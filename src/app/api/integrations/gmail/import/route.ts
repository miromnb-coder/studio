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
import { generateProactiveInsights } from '@/services/proactive-service';

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

const FALLBACK_ERROR = 'Unable to sync Gmail right now. Please reconnect and try again.';

export async function POST() {
  const supabase = await createSupabaseServerClient();

  try {
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
              ...gmailIntegration,
              status: 'error',
              last_error: 'Gmail is not connected.',
            },
          },
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );

      return NextResponse.json({ error: 'GMAIL_NOT_CONNECTED', message: 'Connect Gmail before syncing.' }, { status: 400 });
    }

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
            ...gmailIntegration,
            status: 'syncing',
            last_error: null,
            sync_started_at: new Date().toISOString(),
          },
        },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );

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

    const emails = await fetchFinancialEmails(accessToken, 75);
    const analysis = await analyzeFinancialEmailsWithAI(emails);

    const incomingSignals = [...analysis.subscriptions, ...analysis.recurringPayments];
    const existingSubscriptions = Array.isArray(profile?.active_subscriptions)
      ? (profile.active_subscriptions as Array<Record<string, unknown>>)
      : [];

    const mergedSubscriptions = mergeSubscriptionSignals(existingSubscriptions, incomingSignals);
    const monthlyTotal = computeMonthlyTotal(mergedSubscriptions);

    const aiSummary =
      analysis.summary ||
      `I analyzed ${emails.length} recent finance-related emails and detected ${incomingSignals.length} recurring payment signals.`;
    const chatReadySummary = `I analyzed your recent emails and found ${incomingSignals.length} subscription or recurring payment signals across ${analysis.merchants.length} merchants.`;

    const currency = profile?.currency || incomingSignals.find((signal) => signal.currency)?.currency || 'USD';
    const savingsEstimate =
      typeof profile?.estimated_savings === 'number'
        ? profile.estimated_savings
        : Math.round(monthlyTotal * 0.15 * 100) / 100;

    const nextLastAnalysis = {
      ...lastAnalysis,
      gmail_integration: {
        ...gmailIntegration,
        status: 'connected',
        last_synced_at: new Date().toISOString(),
        last_sync_emails_analyzed: emails.length,
        last_sync_subscriptions_found: incomingSignals.length,
        chat_ready_summary: chatReadySummary,
        trial_risks: analysis.trialRisks,
        savings_opportunities: analysis.savingsOpportunities,
        last_error: null,
      },
    };

    await supabase.from('finance_profiles').upsert(
      {
        user_id: userId,
        active_subscriptions: mergedSubscriptions,
        total_monthly_cost: monthlyTotal,
        estimated_savings: savingsEstimate,
        currency,
        memory_summary: aiSummary,
        last_analysis: nextLastAnalysis,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );

    await supabase.from('finance_history').insert({
      user_id: userId,
      event_type: 'email_import',
      title: 'Gmail sync completed',
      summary: `Analyzed ${emails.length} relevant emails and extracted ${incomingSignals.length} financial signals.`,
      metadata: {
        action_type: 'email_import',
        source: 'gmail',
        status: 'success',
        emails_analyzed: emails.length,
        subscriptions_found: incomingSignals.length,
        trial_risks: analysis.trialRisks,
        savings_opportunities: analysis.savingsOpportunities,
        chat_ready_summary: chatReadySummary,
        structured_data: {
          merchants: analysis.merchants,
          subscriptions: analysis.subscriptions,
          recurringPayments: analysis.recurringPayments,
        },
      },
      created_at: new Date().toISOString(),
    });

    const { data: recentHistory } = await supabase
      .from('finance_history')
      .select('event_type,title,summary,metadata,created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    const proactiveInsights = generateProactiveInsights({
      profile: {
        ...(profile || {}),
        active_subscriptions: mergedSubscriptions,
        estimated_savings: savingsEstimate,
        last_analysis: nextLastAnalysis,
      },
      history: (recentHistory || []) as Array<Record<string, unknown>>,
    });

    await supabase.from('finance_history').insert({
      user_id: userId,
      event_type: 'proactive_insight',
      title: 'Money Brain refreshed after Gmail sync',
      summary: proactiveInsights.length
        ? `Top insight: ${proactiveInsights[0].title}`
        : 'No high-value proactive insights detected.',
      metadata: {
        key: proactiveInsights[0]?.id || 'none',
        source: 'gmail_import',
        insight_ids: proactiveInsights.map((insight) => insight.id),
        status: 'generated',
      },
      created_at: new Date().toISOString(),
    });

    await supabase.from('memory_summaries').upsert(
      {
        user_id: userId,
        summary_type: 'finance',
        summary_text: aiSummary.slice(0, 320),
        source: 'gmail_import',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,summary_type' },
    );

    return NextResponse.json({
      status: 'connected',
      lastSyncedAt: nextLastAnalysis.gmail_integration.last_synced_at,
      emailsAnalyzed: emails.length,
      subscriptionsFound: incomingSignals.length,
      summary: chatReadySummary,
    });
  } catch (error) {
    console.error('GMAIL_IMPORT_ERROR', error);

    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;

    if (userId) {
      const { data: profile } = await supabase
        .from('finance_profiles')
        .select('active_subscriptions,total_monthly_cost,estimated_savings,currency,memory_summary,last_analysis')
        .eq('user_id', userId)
        .maybeSingle();
      const lastAnalysis = asObject(profile?.last_analysis);
      const gmailIntegration = asObject(lastAnalysis.gmail_integration);

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
              ...gmailIntegration,
              status: 'error',
              last_error: FALLBACK_ERROR,
            },
          },
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );
    }

    return NextResponse.json({ error: 'GMAIL_IMPORT_FAILED', message: FALLBACK_ERROR }, { status: 500 });
  }
}
