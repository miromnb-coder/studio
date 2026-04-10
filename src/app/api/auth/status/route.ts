import { NextResponse } from 'next/server';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function asObject(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

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

    const { data: financeProfile } = await supabase
      .from('finance_profiles')
      .select('last_analysis')
      .eq('user_id', user.id)
      .maybeSingle();

    const lastAnalysis = asObject(financeProfile?.last_analysis);
    const gmail = asObject(lastAnalysis.gmail_integration);
    const gmailConnected = Boolean(gmail.access_token_encrypted) && String(gmail.status || 'connected') !== 'disconnected';

    return NextResponse.json({
      signed_in_with_google: signedInWithGoogle,
      gmail_connected: gmailConnected,
    });
  } catch (error) {
    console.error('AUTH_STATUS_ERROR', error);
    return NextResponse.json({ error: 'AUTH_STATUS_FAILED' }, { status: 500 });
  }
}
