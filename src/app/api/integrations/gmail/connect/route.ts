import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json({ error: 'GOOGLE_OAUTH_NOT_CONFIGURED' }, { status: 500 });
    }

    const supabase = await createSupabaseServerClient();
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
    }

    const stateNonce = crypto.randomBytes(18).toString('hex');
    const state = `${userId}:${stateNonce}`;

    const requestUrl = new URL(req.url);
    const redirectUri =
      process.env.GMAIL_OAUTH_REDIRECT_URI || `${requestUrl.origin}/api/integrations/gmail/callback`;

    const oauthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    oauthUrl.searchParams.set('client_id', clientId);
    oauthUrl.searchParams.set('redirect_uri', redirectUri);
    oauthUrl.searchParams.set('response_type', 'code');
    oauthUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/gmail.readonly');
    oauthUrl.searchParams.set('state', state);
    oauthUrl.searchParams.set('access_type', 'offline');
    oauthUrl.searchParams.set('prompt', 'consent');
    oauthUrl.searchParams.set('include_granted_scopes', 'true');

    const response = NextResponse.redirect(oauthUrl);
    response.cookies.set({
      name: 'gmail_oauth_state',
      value: state,
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
      maxAge: 60 * 10,
    });

    return response;
  } catch (error) {
    console.error('GMAIL_CONNECT_ERROR', error);
    return NextResponse.json({ error: 'GMAIL_CONNECT_FAILED' }, { status: 500 });
  }
}
