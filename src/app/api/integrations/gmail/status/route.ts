import { NextResponse } from 'next/server';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import type { ConnectStatus } from '@/lib/integrations/gmail';

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
      .select('total_monthly_cost,estimated_savings,last_analysis')
      .eq('user_id', userId)
      .maybeSingle();

    const { data: userProfile } = await supabase
      .from('profiles')
      .select('gmail_connected,gmail_last_sync_at')
      .eq('id', userId)
      .maybeSingle();

    const lastAnalysis = asObject(profile?.last_analysis);
    const gmail = asObject(lastAnalysis.gmail_integration);
    const gmailImport = asObject(lastAnalysis.gmail_import);

    const connected = Boolean(userProfile?.gmail_connected);
    const storedStatus = String(gmail.status || '').toLowerCase();

    let status: ConnectStatus = connected ? 'connected' : 'disconnected';
    if (storedStatus === 'syncing') status = 'syncing';
    if (storedStatus === 'error') status = 'error';
    if (!connected && storedStatus === 'error') status = 'error';

    const scope = typeof gmail.scope === 'string' ? gmail.scope : '';

    return NextResponse.json(
      {
        connected,
        status,
        accountEmail: typeof gmail.verified_email === 'string' ? gmail.verified_email : null,
        permissions: scope ? scope.split(' ').filter(Boolean) : [],
        lastSyncedAt: userProfile?.gmail_last_sync_at
          ? String(userProfile.gmail_last_sync_at)
          : typeof gmailImport.last_synced_at === 'string'
            ? gmailImport.last_synced_at
            : null,
        emailsAnalyzed:
          typeof gmailImport.emails_analyzed === 'number'
            ? gmailImport.emails_analyzed
            : typeof gmail.last_sync_emails_analyzed === 'number'
              ? gmail.last_sync_emails_analyzed
              : 0,
        subscriptionsFound:
          typeof gmailImport.subscriptions_found === 'number'
            ? gmailImport.subscriptions_found
            : typeof gmail.last_sync_subscriptions_found === 'number'
              ? gmail.last_sync_subscriptions_found
              : 0,
        recurringPaymentsFound: typeof gmailImport.recurring_payments_found === 'number' ? gmailImport.recurring_payments_found : 0,
        monthlyTotal: typeof profile?.total_monthly_cost === 'number' ? profile.total_monthly_cost : 0,
        estimatedMonthlySavings: typeof profile?.estimated_savings === 'number' ? profile.estimated_savings : 0,
        summary: gmailImport.summary ? String(gmailImport.summary) : '',
        errorMessage: gmail.last_error ? String(gmail.last_error) : null,
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
    console.error('GMAIL_STATUS_ERROR', error);
    return NextResponse.json({ error: 'GMAIL_STATUS_FAILED' }, { status: 500 });
  }
}
