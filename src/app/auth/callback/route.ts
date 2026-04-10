import { NextResponse } from 'next/server';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { resolveAppOrigin, sanitizeNextPath } from '@/lib/auth/redirects';
import { upsertUserProfile } from '@/lib/auth/profile';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const requestUrl = new URL(req.url);
  const appOrigin = resolveAppOrigin(requestUrl);
  const code = requestUrl.searchParams.get('code');
  const authError = requestUrl.searchParams.get('error');
  const nextPath = sanitizeNextPath(requestUrl.searchParams.get('next'));

  if (authError) {
    return NextResponse.redirect(new URL(`/login?error=google_auth_failed&next=${encodeURIComponent(nextPath)}`, appOrigin));
  }

  if (!code) {
    return NextResponse.redirect(new URL(`/login?error=missing_code&next=${encodeURIComponent(nextPath)}`, appOrigin));
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('AUTH_CALLBACK_EXCHANGE_ERROR', exchangeError);
      return NextResponse.redirect(new URL(`/login?error=exchange_failed&next=${encodeURIComponent(nextPath)}`, appOrigin));
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await upsertUserProfile(supabase, user);
    }

    return NextResponse.redirect(new URL(nextPath, appOrigin));
  } catch (error) {
    console.error('AUTH_CALLBACK_ERROR', error);
    return NextResponse.redirect(new URL(`/login?error=google_auth_failed&next=${encodeURIComponent(nextPath)}`, appOrigin));
  }
}
