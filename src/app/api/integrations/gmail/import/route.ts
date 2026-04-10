import { NextResponse } from 'next/server';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import {
  analyzeFinancialEmailsWithAI,
  computeMonthlyTotal,
  decryptToken,
  encryptToken,
  fetchFinancialEmails,
  mergeSubscriptionSignals,
} from '@/lib/integrations/gmail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function asObject(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

function resolveTokenExpiry(value: unknown): number | null {
  const raw = String(value || '');
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
}

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('finance_profiles')
      .select('active_subscriptions,total_monthly_cost,estimated_savings,currency,memory_summary,last_analysis')
      .eq('user_id', userId)
      .maybeSingle();

    const lastAnalysis = asObject(profile?.last_analysis);
    const gmailIntegration = asObject(lastAnalysis.gmail_integration);

    const encryptedAccessToken = String(gmailIntegration.access_token_encrypted || '');
    if (!encryptedAccessToken) {
      return NextResponse.json({ error: 'GMAIL_NOT_CONNECTED' }, { status: 400 });
    }

    let accessToken = decryptToken(encryptedAccessToken);
    const refreshEncrypted = String(gmailIntegration.refresh_token_encrypted || '');
    const expiryAt = resolveTokenExpiry(gmailIntegration.expires_at);

    if (expiryAt && expiryAt < Date.now() + 45_000 && refreshEncrypted) {
      const { refreshAccessToken } = await import('@/lib/integrations/gmail');
      const refreshed = await refreshAccessToken(decryptToken(refreshEncrypted));
      accessToken = refreshed.accessToken;
      gmailIntegration.access_token_encrypted = encryptToken(refreshed.accessToken);
      if (refreshed.expiryDate) {
        gmailIntegration.expires_at = new Date(refreshed.expiryDate).toISOString();
      }
      gmailIntegration.status = 'connected';
      gmailIntegration.last_error = null;
    }

    const emails = await fetchFinancialEmails(accessToken, 100);
    const analysis = await analyzeFinancialEmailsWithAI(emails);

    const incomingSignals = [...analysis.subscriptions, ...analysis.recurringPayments];
    const existingSubscriptions = Array.isArray(profile?.active_subscriptions)
      ? (profile.active_subscriptions as Array<Record<string, unknown>>)
      : [];

    const mergedSubscriptions = mergeSubscriptionSignals(existingSubscriptions, incomingSignals);
    const monthlyTotal = computeMonthlyTotal(mergedSubscriptions);

    const nextLastAnalysis = {
      ...lastAnalysis,
      gmail_integration: {
        ...gmailIntegration,
        status: 'connected',
        last_synced_at: new Date().toISOString(),
        last_sync_emails_analyzed: emails.length,
        last_sync_subscriptions_found: incomingSignals.length,
        last_error: null,
      },
    };

    await supabase.from('finance_profiles').upsert(
      {
        user_id: userId,
        active_subscriptions: mergedSubscriptions,
        total_monthly_cost: monthlyTotal,
        estimated_savings: typeof profile?.estimated_savings === 'number' ? profile.estimated_savings : 0,
        currency: profile?.currency || 'USD',
        memory_summary: profile?.memory_summary || '',
        last_analysis: nextLastAnalysis,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );

    await supabase.from('finance_history').insert({
      user_id: userId,
      event_type: 'gmail_import',
      title: 'Gmail financial import completed',
      summary: `Analyzed ${emails.length} emails and extracted ${incomingSignals.length} financial signals.`,
      metadata: {
        source: 'gmail',
        emails_analyzed: emails.length,
        subscriptions_found: incomingSignals.length,
        merchants: analysis.merchants,
      },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      status: 'connected',
      lastSyncedAt: nextLastAnalysis.gmail_integration.last_synced_at,
      emailsAnalyzed: emails.length,
      subscriptionsFound: incomingSignals.length,
    });
  } catch (error) {
    console.error('GMAIL_IMPORT_ERROR', error);
    return NextResponse.json({ error: 'GMAIL_IMPORT_FAILED' }, { status: 500 });
  }
}
