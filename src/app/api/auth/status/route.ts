import { NextResponse } from 'next/server';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
    }

    const signedInWithGoogle = Array.isArray(user.app_metadata?.providers) && user.app_metadata.providers.includes('google');

    const { data: profile } = await supabase
      .from('profiles')
      .select('gmail_connected')
      .eq('id', user.id)
      .maybeSingle();
    const gmailConnected = Boolean(profile?.gmail_connected);

    return NextResponse.json(
      {
        signed_in_with_google: signedInWithGoogle,
        gmail_connected: gmailConnected,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      },
    );
  } catch (error) {
    console.error('AUTH_STATUS_ERROR', error);
    return NextResponse.json({ error: 'AUTH_STATUS_FAILED' }, { status: 500 });
  }
}
