import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { resolveAppOrigin } from '@/lib/auth/redirects';
import {
  encryptCalendarToken,
  getGoogleAccountProfile,
  GOOGLE_CALENDAR_READONLY_SCOPE,
  hasCalendarReadonlyScope,
} from '@/lib/integrations/google-calendar';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type GoogleTokenBundle = {
  accessToken: string;
  refreshToken?: string | null;
  expiryDate?: number;
  scope?: string;
  tokenType?: string;
};

function toObject(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function exchangeCodeForGoogleCalendarToken(
  code: string,
  redirectUri: string,
): Promise<GoogleTokenBundle> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Google Calendar token exchange failed (${response.status}): ${text}`);
  }

  const payload = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
    token_type?: string;
  };

  if (!payload.access_token) {
    throw new Error('Google Calendar token exchange returned no access token');
  }

  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token ?? null,
    expiryDate: payload.expires_in ? Date.now() + payload.expires_in * 1000 : undefined,
    scope: payload.scope,
    tokenType: payload.token_type,
  };
}

async function verifyCalendarAccessToken(accessToken: string): Promise<{
  calendarsFound: number;
  primaryCalendarId: string | null;
  primarySummary: string | null;
}> {
  const response = await fetch(
    'https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=10',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Google Calendar verification failed (${response.status}): ${text}`);
  }

  const payload = (await response.json()) as {
    items?: Array<{
      id?: string;
      summary?: string;
      primary?: boolean;
    }>;
  };

  const items = Array.isArray(payload.items) ? payload.items : [];
  const primary =
    items.find((item) => item?.primary) ??
    items[0] ??
    null;

  return {
    calendarsFound: items.length,
    primaryCalendarId: typeof primary?.id === 'string' ? primary.id : null,
    primarySummary: typeof primary?.summary === 'string' ? primary.summary : null,
  };
}

async function writeOrThrow(
  label: string,
  operation: () => Promise<{ error: unknown; data?: unknown; status?: number; statusText?: string }>,
  payload: Record<string, unknown>,
) {
  console.log('GOOGLE_CALENDAR_CALLBACK_WRITE_START', { label, payload });

  const result = await operation();

  console.log('GOOGLE_CALENDAR_CALLBACK_WRITE_RESULT', {
    label,
    status: result.status,
    statusText: result.statusText,
    hasData: result.data !== undefined && result.data !== null,
    error: result.error || null,
  });

  if (result.error) {
    console.error(`${label}_WRITE_ERROR`, result.error);
    throw result.error;
  }
}

export async function GET(req: Request) {
  const requestUrl = new URL(req.url);
  const appOrigin = resolveAppOrigin(requestUrl);
  const isSecure = appOrigin.startsWith('https://');
  const code = requestUrl.searchParams.get('code');
  const oauthError = requestUrl.searchParams.get('error');
  const returnedState = requestUrl.searchParams.get('state');

  const failRedirect = (reason: string, step?: string) => {
    const target = new URL('/control', appOrigin);
    target.searchParams.set('calendar', 'error');
    target.searchParams.set('reason', reason);
    if (step) target.searchParams.set('step', step);
    return NextResponse.redirect(target);
  };

  if (oauthError) {
    return failRedirect(`oauth_error:${oauthError}`);
  }

  if (!code) {
    return failRedirect('missing_code');
  }

  try {
    const cookieStore = await cookies();
    const localState = cookieStore.get('google_calendar_oauth_state')?.value;
    const userId = cookieStore.get('google_calendar_oauth_user_id')?.value;

    if (!localState || !userId) {
      return failRedirect('state_mismatch');
    }
    if (!returnedState || returnedState !== localState) {
      return failRedirect('state_mismatch');
    }

    const supabase = await createSupabaseServerClient();
    const adminSupabase = createAdminClient();

    let accessToken: string | null = null;
    let refreshToken: string | null = null;
    let tokenScope = GOOGLE_CALENDAR_READONLY_SCOPE;
    let tokenType = 'Bearer';
    let expiryIso: string | null = null;

    const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError) {
      const session = exchangeData.session as
        | {
            provider_token?: string | null;
            provider_refresh_token?: string | null;
            expires_at?: number | null;
            token_type?: string | null;
          }
        | null;

      accessToken = session?.provider_token || null;
      refreshToken = session?.provider_refresh_token || null;

      if (session?.expires_at) {
        expiryIso = new Date(session.expires_at * 1000).toISOString();
      }

      if (session?.token_type) {
        tokenType = session.token_type;
      }
    } else {
      console.error('GOOGLE_CALENDAR_CALLBACK_SESSION_EXCHANGE_ERROR', exchangeError);
    }

    if (!accessToken) {
      const redirectUri = `${appOrigin}/api/integrations/google-calendar/callback`;
      const fallbackTokens = await exchangeCodeForGoogleCalendarToken(code, redirectUri);

      accessToken = fallbackTokens.accessToken;
      refreshToken = fallbackTokens.refreshToken || null;
      tokenScope = fallbackTokens.scope || tokenScope;
      tokenType = fallbackTokens.tokenType || tokenType;
      expiryIso = fallbackTokens.expiryDate
        ? new Date(fallbackTokens.expiryDate).toISOString()
        : null;
    }
    const scopeFromQuery = requestUrl.searchParams.get('scope');
    if (scopeFromQuery) {
      tokenScope = scopeFromQuery;
    }
    if (!hasCalendarReadonlyScope(tokenScope)) {
      tokenScope = `${tokenScope} ${GOOGLE_CALENDAR_READONLY_SCOPE}`.trim();
    }

    const calendarProfile = await verifyCalendarAccessToken(accessToken);
    const googleProfile = await getGoogleAccountProfile(accessToken);

    const { data: authUser } = await adminSupabase.auth.admin.getUserById(userId);
    const inferredEmail = googleProfile.email || authUser.user?.email || null;

    const { data: financeProfile } = await adminSupabase
      .from('finance_profiles')
      .select('last_analysis,active_subscriptions,total_monthly_cost,estimated_savings,currency,memory_summary')
      .eq('user_id', userId)
      .maybeSingle();

    const lastAnalysis = toObject(financeProfile?.last_analysis);
    const connectedAt = new Date().toISOString();

    const financeProfilePayload = {
      user_id: userId,
      active_subscriptions: Array.isArray(financeProfile?.active_subscriptions)
        ? financeProfile.active_subscriptions
        : [],
      total_monthly_cost:
        typeof financeProfile?.total_monthly_cost === 'number'
          ? financeProfile.total_monthly_cost
          : 0,
      estimated_savings:
        typeof financeProfile?.estimated_savings === 'number'
          ? financeProfile.estimated_savings
          : 0,
      currency: financeProfile?.currency || 'USD',
      memory_summary: financeProfile?.memory_summary || '',
      last_analysis: {
        ...lastAnalysis,
        google_calendar_integration: {
          status: 'connected',
          scope: tokenScope,
          token_type: tokenType,
          access_token_encrypted: encryptCalendarToken(accessToken),
          refresh_token_encrypted: refreshToken ? encryptCalendarToken(refreshToken) : null,
          expires_at: expiryIso,
          connected_at: connectedAt,
          last_synced_at: connectedAt,
          account_email: inferredEmail,
          verified_email: googleProfile.verifiedEmail ? inferredEmail : null,
          calendars_found: calendarProfile.calendarsFound,
          primary_calendar_id: calendarProfile.primaryCalendarId,
          primary_calendar_summary: calendarProfile.primarySummary,
          last_error: null,
        },
      },
      updated_at: connectedAt,
    };

    try {
      await writeOrThrow(
        'finance_profiles_google_calendar_connected',
        () =>
          adminSupabase
            .from('finance_profiles')
            .upsert(financeProfilePayload, { onConflict: 'user_id' }),
        financeProfilePayload,
      );
    } catch (errorAtFinanceWrite) {
      console.error('GOOGLE_CALENDAR_CALLBACK_FAILURE_POINT', {
        step: 'finance_profiles_google_calendar_connected',
        error: errorAtFinanceWrite,
      });
      return failRedirect('write_failed', 'finance_profiles_google_calendar_connected');
    }

    const profilePayload = {
      id: userId,
      google_calendar_connected: true,
      google_calendar_connected_at: connectedAt,
      google_calendar_last_sync_at: connectedAt,
      updated_at: connectedAt,
    };

    try {
      await writeOrThrow(
        'profiles_google_calendar_connected',
        () =>
          adminSupabase
            .from('profiles')
            .upsert(profilePayload, { onConflict: 'id' }),
        profilePayload,
      );
    } catch (errorAtProfileWrite) {
      console.error('GOOGLE_CALENDAR_CALLBACK_FAILURE_POINT', {
        step: 'profiles_google_calendar_connected',
        error: errorAtProfileWrite,
      });
      return failRedirect('write_failed', 'profiles_google_calendar_connected');
    }

    const successTarget = new URL('/control', appOrigin);
    successTarget.searchParams.set('calendar', 'connected');

    const response = NextResponse.redirect(successTarget);

    response.cookies.set({
      name: 'google_calendar_oauth_state',
      value: '',
      maxAge: 0,
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: isSecure,
    });

    response.cookies.set({
      name: 'google_calendar_oauth_user_id',
      value: '',
      maxAge: 0,
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: isSecure,
    });

    return response;
  } catch (error) {
    console.error('google calendar callback error', error);

    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : 'unknown_callback_error';

    return failRedirect(`callback_exception:${message}`);
  }
}
