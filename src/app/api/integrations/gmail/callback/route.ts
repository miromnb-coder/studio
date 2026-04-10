import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
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

async function writeOrThrow(
  label: string,
  operation: () => Promise<{ error: unknown }>,
  payload: Record<string, unknown>,
) {
  console.log('Saving to Supabase:', { label, data: payload });
  const result = await operation();
  if (result.error) {
    console.error(`${label}_WRITE_ERROR`, result.error);
    throw result.error;
  }
}

export async function GET(req: Request) {
  const requestUrl = new URL(req.url);
  const appOrigin = resolveAppOrigin(requestUrl);
  const code = requestUrl.searchParams.get('code');
  const state = requestUrl.searchParams.get('state');
  const error = requestUrl.searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL('/profile?gmail=error', appOrigin));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL('/profile?gmail=missing_code', appOrigin));
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) {
      return NextResponse.redirect(new URL('/login', appOrigin));
    }

    const stateCookieValue = (await cookies()).get('gmail_oauth_state')?.value;

    if (!stateCookieValue || stateCookieValue !== state || !state.startsWith(`${userId}:`)) {
      return NextResponse.redirect(new URL('/profile?gmail=state_mismatch', appOrigin));
    }

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

    const { data: profile } = await supabase
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

    await writeOrThrow(
      'finance_profiles_gmail_connected',
      () => supabase.from('finance_profiles').upsert(financeProfilePayload, { onConflict: 'user_id' }),
      financeProfilePayload,
    );

    const profilePayload = {
      id: userId,
      gmail_connected: true,
      gmail_connected_at: connectedAt,
      updated_at: connectedAt,
    };

    await writeOrThrow(
      'profiles_gmail_connected',
      () => supabase.from('profiles').upsert(profilePayload, { onConflict: 'id' }),
      profilePayload,
    );

    const response = NextResponse.redirect(new URL('/profile?gmail=connected', appOrigin));
    response.cookies.set({
      name: 'gmail_oauth_state',
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
    return NextResponse.redirect(new URL('/profile?gmail=error', appOrigin));
  }
}
