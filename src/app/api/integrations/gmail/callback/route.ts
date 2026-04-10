import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { encryptToken, exchangeCodeForToken } from '@/lib/integrations/gmail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function toObject(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

export async function GET(req: Request) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get('code');
  const state = requestUrl.searchParams.get('state');
  const error = requestUrl.searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL('/settings?gmail=error', requestUrl.origin));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL('/settings?gmail=missing_code', requestUrl.origin));
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) {
      return NextResponse.redirect(new URL('/login', requestUrl.origin));
    }

    const stateCookieValue = (await cookies()).get('gmail_oauth_state')?.value;

    if (!stateCookieValue || stateCookieValue !== state || !state.startsWith(`${userId}:`)) {
      return NextResponse.redirect(new URL('/settings?gmail=state_mismatch', requestUrl.origin));
    }

    const redirectUri =
      process.env.GMAIL_OAUTH_REDIRECT_URI || `${requestUrl.origin}/api/integrations/gmail/callback`;

    const tokens = await exchangeCodeForToken(code, redirectUri);

    const { data: profile } = await supabase
      .from('finance_profiles')
      .select('last_analysis,active_subscriptions,total_monthly_cost,estimated_savings,currency,memory_summary')
      .eq('user_id', userId)
      .maybeSingle();

    const lastAnalysis = toObject(profile?.last_analysis);

    await supabase.from('finance_profiles').upsert(
      {
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
            scope: tokens.scope || 'https://www.googleapis.com/auth/gmail.readonly',
            token_type: tokens.tokenType || 'Bearer',
            access_token_encrypted: encryptToken(tokens.accessToken),
            refresh_token_encrypted: tokens.refreshToken ? encryptToken(tokens.refreshToken) : null,
            expires_at: tokens.expiryDate ? new Date(tokens.expiryDate).toISOString() : null,
            connected_at: new Date().toISOString(),
            last_error: null,
          },
        },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );

    const response = NextResponse.redirect(new URL('/settings?gmail=connected', requestUrl.origin));
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
    return NextResponse.redirect(new URL('/settings?gmail=error', requestUrl.origin));
  }
}
