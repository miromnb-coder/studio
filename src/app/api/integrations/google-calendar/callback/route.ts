import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { resolveAppOrigin } from '@/lib/auth/redirects';
import {
  encryptCalendarToken,
  exchangeCodeForToken,
  getGoogleAccountProfile,
  GOOGLE_CALENDAR_READONLY_SCOPE,
  hasCalendarReadonlyScope,
  listCalendars,
} from '@/lib/integrations/google-calendar';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

export async function GET(req: Request) {
  const requestUrl = new URL(req.url);
  const appOrigin = resolveAppOrigin(requestUrl);
  const code = requestUrl.searchParams.get('code');
  const oauthError = requestUrl.searchParams.get('error');
  const returnedState = requestUrl.searchParams.get('state');

  const failRedirect = (reason: string) => {
    const target = new URL('/control', appOrigin);
    target.searchParams.set('calendar', 'error');
    target.searchParams.set('reason', reason);
    return NextResponse.redirect(target);
  };

  if (oauthError) return failRedirect('oauth_error');
  if (!code) return failRedirect('missing_code');

  try {
    const cookieStore = await cookies();
    const localState = cookieStore.get('google_calendar_oauth_state')?.value;
    const userId = cookieStore.get('google_calendar_oauth_user_id')?.value;

    if (!localState || !userId) {
      return failRedirect('state_cookie_missing');
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
    }

    if (!accessToken) {
      const redirectUri = `${appOrigin}/api/integrations/google-calendar/callback`;
      const fallbackTokens = await exchangeCodeForToken(code, redirectUri);
      accessToken = fallbackTokens.accessToken;
      refreshToken = fallbackTokens.refreshToken || null;
      tokenScope = fallbackTokens.scope || GOOGLE_CALENDAR_READONLY_SCOPE;
      tokenType = fallbackTokens.tokenType || 'Bearer';
      expiryIso = fallbackTokens.expiryDate ? new Date(fallbackTokens.expiryDate).toISOString() : null;
    }

    const scopeQuery = requestUrl.searchParams.get('scope');
    if (scopeQuery) tokenScope = scopeQuery;
    if (!hasCalendarReadonlyScope(tokenScope)) {
      tokenScope = `${tokenScope} ${GOOGLE_CALENDAR_READONLY_SCOPE}`.trim();
    }

    const profile = await getGoogleAccountProfile(accessToken);
    const calendars = await listCalendars(accessToken);
    const connectedAt = new Date().toISOString();

    const { data: financeProfile } = await adminSupabase
      .from('finance_profiles')
      .select('active_subscriptions,total_monthly_cost,estimated_savings,currency,memory_summary,last_analysis')
      .eq('user_id', userId)
      .maybeSingle();

    const lastAnalysis = toObject(financeProfile?.last_analysis);

    const financeProfilePayload = {
      user_id: userId,
      active_subscriptions: Array.isArray(financeProfile?.active_subscriptions) ? financeProfile.active_subscriptions : [],
      total_monthly_cost: typeof financeProfile?.total_monthly_cost === 'number' ? financeProfile.total_monthly_cost : 0,
      estimated_savings: typeof financeProfile?.estimated_savings === 'number' ? financeProfile.estimated_savings : 0,
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
          verified_email: profile.email,
          calendars_found: calendars.length,
          last_error: null,
        },
      },
      updated_at: connectedAt,
    };

    const writeResult = await adminSupabase.from('finance_profiles').upsert(financeProfilePayload, { onConflict: 'user_id' });
    if (writeResult.error) {
      console.error('GOOGLE_CALENDAR_CALLBACK_UPSERT_ERROR', writeResult.error);
      return failRedirect('write_failed');
    }

    const successTarget = new URL('/control?calendar=connected', appOrigin);
    const response = NextResponse.redirect(successTarget);

    response.cookies.set({ name: 'google_calendar_oauth_state', value: '', maxAge: 0, path: '/', httpOnly: true, sameSite: 'lax', secure: true });
    response.cookies.set({ name: 'google_calendar_oauth_user_id', value: '', maxAge: 0, path: '/', httpOnly: true, sameSite: 'lax', secure: true });

    return response;
  } catch (error) {
    console.error('GOOGLE_CALENDAR_CALLBACK_ERROR', error);
    return failRedirect('callback_exception');
  }
}
