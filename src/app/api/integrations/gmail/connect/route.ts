import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { GMAIL_READONLY_SCOPE } from '@/lib/integrations/gmail';
import { resolveAppOrigin } from '@/lib/auth/redirects';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
    }

    const stateNonce = crypto.randomBytes(18).toString('hex');
    const state = `${userId}:${stateNonce}`;

    const requestUrl = new URL(req.url);
    const appOrigin = resolveAppOrigin(requestUrl);
    const redirectTo = `${appOrigin}/api/integrations/gmail/callback`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        scopes: GMAIL_READONLY_SCOPE,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
          include_granted_scopes: 'true',
          state,
        },
      },
    });

    if (error || !data.url) {
      console.error('GMAIL_CONNECT_SUPABASE_OAUTH_ERROR', error);
      return NextResponse.json({ error: 'GMAIL_CONNECT_FAILED' }, { status: 500 });
    }

    const response = NextResponse.redirect(data.url);
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
