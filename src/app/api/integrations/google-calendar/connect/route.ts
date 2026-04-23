import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { GOOGLE_CALENDAR_DEFAULT_SCOPES } from '@/lib/integrations/google-calendar';
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

    const flowNonce = crypto.randomBytes(18).toString('hex');

    const requestUrl = new URL(req.url);
    const appOrigin = resolveAppOrigin(requestUrl);
    const isSecure = appOrigin.startsWith('https://');
    const redirectTo = `${appOrigin}/api/integrations/google-calendar/callback?flow=${encodeURIComponent(flowNonce)}`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        scopes: GOOGLE_CALENDAR_DEFAULT_SCOPES,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
          include_granted_scopes: 'true',
        },
      },
    });

    if (error || !data.url) {
      console.error('GOOGLE_CALENDAR_CONNECT_SUPABASE_OAUTH_ERROR', error);
      return NextResponse.json(
        { error: 'GOOGLE_CALENDAR_CONNECT_FAILED' },
        { status: 500 },
      );
    }

    const response = NextResponse.redirect(data.url);

    response.cookies.set({
      name: 'google_calendar_oauth_flow',
      value: flowNonce,
      httpOnly: true,
      sameSite: 'lax',
      secure: isSecure,
      path: '/',
      maxAge: 60 * 10,
    });

    response.cookies.set({
      name: 'google_calendar_oauth_user_id',
      value: userId,
      httpOnly: true,
      sameSite: 'lax',
      secure: isSecure,
      path: '/',
      maxAge: 60 * 10,
    });

    return response;
  } catch (error) {
    console.error('GOOGLE_CALENDAR_CONNECT_ERROR', error);
    return NextResponse.json(
      { error: 'GOOGLE_CALENDAR_CONNECT_FAILED' },
      { status: 500 },
    );
  }
}
