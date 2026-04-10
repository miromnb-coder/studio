import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { resolveAppOrigin } from '@/lib/auth/redirects';
import {
  encryptToken,
  exchangeCodeForToken,
  GMAIL_READONLY_SCOPE,
  hasGmailReadonlyScope,
  verifyGmailAccessToken,
} from '@/lib/integrations/gmail';

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

async function writeOrThrow(
  label: string,
  operation: () => Promise<{ error: unknown; data?: unknown; status?: number; statusText?: string }>,
  payload: Record<string, unknown>,
) {
  console.log('GMAIL_CALLBACK_WRITE_START', { label, payload });
  const result = await operation();
  console.log('GMAIL_CALLBACK_WRITE_RESULT', {
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
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');

  const failRedirect = (reason: string, step?: string) => {
    const target = new URL('/profile', appOrigin);
    target.searchParams.set('gmail', 'error');
    target.searchParams.set('reason', reason);
    if (step) {
      target.searchParams.set('step', step);
    }
    console.log('GMAIL_CALLBACK_REDIRECT', {
      reason,
      step: step || null,
      redirect: target.pathname + target.search,
    });
    return NextResponse.redirect(target);
  };

  if (error) {
    return failRedirect('oauth_error');
  }

  if (!code) {
    const missingTarget = new URL('/profile', appOrigin);
    missingTarget.searchParams.set('gmail', 'missing_code');
    console.log('GMAIL_CALLBACK_REDIRECT', {
      reason: 'missing_code',
      redirect: missingTarget.pathname + missingTarget.search,
    });
    return NextResponse.redirect(missingTarget);
  }

  try {
    const cookieStore = await cookies();
    const localState = cookieStore.get('gmail_oauth_state')?.value;
    const userId = cookieStore.get('gmail_oauth_user_id')?.value;

    if (!localState || !userId) {
      const mismatchTarget = new URL('/profile', appOrigin);
      mismatchTarget.searchParams.set('gmail', 'state_mismatch');
      console.log('GMAIL_CALLBACK_REDIRECT', {
        reason: 'missing_local_oauth_cookie',
        redirect: mismatchTarget.pathname + mismatchTarget.search,
      });
      return NextResponse.redirect(mismatchTarget);
    }

    const supabase = await createSupabaseServerClient();
    const adminSupabase = createAdminClient();

    let accessToken: string | null = null;
    let refreshToken: string | null = null;
    let tokenScope: string = GMAIL_READONLY_SCOPE;
    let tokenType: string = 'Bearer';
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
      console.error('GMAIL_CALLBACK_SESSION_EXCHANGE_ERROR', exchangeError);
    }

    if (!accessToken) {
      const redirectUri = `${appOrigin}/api/integrations/gmail/callback`;
      const fallbackTokens = await exchangeCodeForToken(code, redirectUri);
      accessToken = fallbackTokens.accessToken;
      refreshToken = fallbackTokens.refreshToken || null;
      tokenScope = fallbackTokens.scope || GMAIL_READONLY_SCOPE;
      tokenType = fallbackTokens.tokenType || 'Bearer';
      expiryIso = fallbackTokens.expiryDate ? new Date(fallbackTokens.expiryDate).toISOString() : null;
    }

    const verifiedProfile = await verifyGmailAccessToken(accessToken);
    const scopeQuery = requestUrl.searchParams.get('scope');

    if (scopeQuery) {
      tokenScope = scopeQuery;
    }

    if (!hasGmailReadonlyScope(tokenScope)) {
      tokenScope = `${tokenScope} ${GMAIL_READONLY_SCOPE}`.trim();
    }

    const { data: profile } = await adminSupabase
      .from('finance_profiles')
      .select('last_analysis,active_subscriptions,total_monthly_cost,estimated_savings,currency,memory_summary')
      .eq('user_id', userId)
      .maybeSingle();

    const lastAnalysis = toObject(profile?.last_analysis);
    const connectedAt = new Date().toISOString();

    const financeProfilePayload = {
      user_id: userId,
      active_subscriptions: Array.isArray(profile?.active_subscriptions) ? profile.active_subscriptions : [],
      total_monthly_cost: typeof profile?.total_monthly_cost === 'number' ? profile.total_monthly_cost : 0,
      estimated_savings: typeof profile?.estimated_savings === 'number' ? profile.estimated_savings : 0,
      currency: profile?.currency || 'USD',
      memory_summary: profile?.memory_summary || '',
      last_analysis: {
        ...lastAnalysis,
        gmail_integration: {
          status: 'connected',
          scope: tokenScope,
          token_type: tokenType,
          access_token_encrypted: encryptToken(accessToken),
          refresh_token_encrypted: refreshToken ? encryptToken(refreshToken) : null,
          expires_at: expiryIso,
          connected_at: connectedAt,
          verified_email: verifiedProfile.emailAddress,
          verified_messages_total: verifiedProfile.messagesTotal,
          last_error: null,
        },
      },
      updated_at: new Date().toISOString(),
    };

    try {
      await writeOrThrow(
        'finance_profiles_gmail_connected',
        () => adminSupabase.from('finance_profiles').upsert(financeProfilePayload, { onConflict: 'user_id' }),
        financeProfilePayload,
      );
    } catch (errorAtFinanceWrite) {
      console.error('GMAIL_CALLBACK_FAILURE_POINT', {
        step: 'finance_profiles_gmail_connected',
        error: errorAtFinanceWrite,
      });
      return failRedirect('write_failed', 'finance_profiles_gmail_connected');
    }

    const profilePayload = {
      id: userId,
      gmail_connected: true,
      gmail_connected_at: connectedAt,
      updated_at: connectedAt,
    };

    try {
      await writeOrThrow(
        'profiles_gmail_connected',
        () => adminSupabase.from('profiles').upsert(profilePayload, { onConflict: 'id' }),
        profilePayload,
      );
    } catch (errorAtProfileWrite) {
      console.error('GMAIL_CALLBACK_FAILURE_POINT', {
        step: 'profiles_gmail_connected',
        error: errorAtProfileWrite,
      });
      return failRedirect('write_failed', 'profiles_gmail_connected');
    }

    const successTarget = new URL('/profile?gmail=connected', appOrigin);
    console.log('GMAIL_CALLBACK_REDIRECT', {
      reason: 'connected',
      redirect: successTarget.pathname + successTarget.search,
    });

    const response = NextResponse.redirect(successTarget);

    response.cookies.set({
      name: 'gmail_oauth_state',
      value: '',
      maxAge: 0,
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
    });

    response.cookies.set({
      name: 'gmail_oauth_user_id',
      value: '',
      maxAge: 0,
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
    });

    return response;
  } catch (callbackError) {
    console.error('GMAIL_CALLBACK_ERROR', callbackError);
    return failRedirect('callback_exception');
  }
}
