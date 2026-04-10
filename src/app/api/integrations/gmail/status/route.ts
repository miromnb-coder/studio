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
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('finance_profiles')
      .select('last_analysis')
      .eq('user_id', userId)
      .maybeSingle();

    const lastAnalysis = asObject(profile?.last_analysis);
    const gmail = asObject(lastAnalysis.gmail_integration);

    const connected = Boolean(gmail.access_token_encrypted);
    const status = connected ? 'connected' : 'disconnected';

    return NextResponse.json({
      status,
      lastSyncedAt: gmail.last_synced_at ? String(gmail.last_synced_at) : null,
      emailsAnalyzed: typeof gmail.last_sync_emails_analyzed === 'number' ? gmail.last_sync_emails_analyzed : 0,
      subscriptionsFound: typeof gmail.last_sync_subscriptions_found === 'number' ? gmail.last_sync_subscriptions_found : 0,
      errorMessage: gmail.last_error ? String(gmail.last_error) : null,
    });
  } catch (error) {
    console.error('GMAIL_STATUS_ERROR', error);
    return NextResponse.json({ error: 'GMAIL_STATUS_FAILED' }, { status: 500 });
  }
}
