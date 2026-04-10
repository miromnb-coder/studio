import { NextResponse } from 'next/server';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { evaluateOperatorAlertsForUser } from '@/lib/operator/alerts';
import {
  analyzeFinancialEmailsWithAI,
  computeMonthlyTotal,
  fetchFinancialEmails,
  getUsableAccessTokenFromIntegration,
  mergeSubscriptionSignals,
  parseIntegrationState,
  verifyGmailAccessToken,
} from '@/lib/integrations/gmail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FALLBACK_ERROR = 'Unable to sync Gmail right now. Please reconnect and try again.';

type FinanceProfileRecord = {
  user_id: string;
  active_subscriptions: Array<Record<string, unknown>> | null;
  total_monthly_cost: number | null;
  estimated_savings: number | null;
  currency: string | null;
  memory_summary: string | null;
  last_analysis: Record<string, unknown> | null;
};

function asObject(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

function asArrayOfObjects(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object') : [];
}

function toNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

async function loadFinanceProfile(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, userId: string): Promise<FinanceProfileRecord | null> {
  const { data } = await supabase
    .from('finance_profiles')
    .select('user_id,active_subscriptions,total_monthly_cost,estimated_savings,currency,memory_summary,last_analysis')
    .eq('user_id', userId)
    .maybeSingle();

  return (data as FinanceProfileRecord | null) || null;
}

async function saveFinanceProfile(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  payload: Record<string, unknown>,
  label: string,
) {
  const result = await supabase.from('finance_profiles').upsert(payload, { onConflict: 'user_id' });
  console.log('GMAIL_IMPORT_DB_WRITE_RESULT', { label, hasError: Boolean(result.error) });
  if (result.error) throw result.error;
}

function buildBaseProfilePayload(userId: string, profile: FinanceProfileRecord | null) {
  return {
    user_id: userId,
    active_subscriptions: asArrayOfObjects(profile?.active_subscriptions),
    total_monthly_cost: toNumber(profile?.total_monthly_cost, 0),
    estimated_savings: toNumber(profile?.estimated_savings, 0),
    currency: profile?.currency || 'USD',
    memory_summary: profile?.memory_summary || '',
    last_analysis: asObject(profile?.last_analysis),
    updated_at: new Date().toISOString(),
  };
}

export async function POST() {
  const supabase = await createSupabaseServerClient();

  try {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
    }

    console.log('GMAIL_IMPORT_START', { userId });

    const profile = await loadFinanceProfile(supabase, userId);
    const basePayload = buildBaseProfilePayload(userId, profile);

    const lastAnalysis = asObject(basePayload.last_analysis);
    const currentIntegration = parseIntegrationState(lastAnalysis.gmail_integration);

    if (!currentIntegration.access_token_encrypted) {
      const erroredAnalysis = {
        ...lastAnalysis,
        gmail_integration: {
          ...currentIntegration,
          status: 'error',
          last_error: 'Gmail is not connected.',
        },
      };

      await saveFinanceProfile(
        supabase,
        {
          ...basePayload,
          last_analysis: erroredAnalysis,
          updated_at: new Date().toISOString(),
        },
        'missing_gmail_connection',
      );

      return NextResponse.json({ error: 'GMAIL_NOT_CONNECTED', message: 'Connect Gmail before syncing.' }, { status: 400 });
    }

    const syncStartedAt = new Date().toISOString();

    await saveFinanceProfile(
      supabase,
      {
        ...basePayload,
        last_analysis: {
          ...lastAnalysis,
          gmail_integration: {
            ...currentIntegration,
            status: 'syncing',
            sync_started_at: syncStartedAt,
            last_error: null,
          },
        },
        updated_at: syncStartedAt,
      },
      'syncing_state',
    );

    let integrationForSave = { ...currentIntegration };
    let accessToken: string;

    try {
      const tokenState = await getUsableAccessTokenFromIntegration(currentIntegration);
      accessToken = tokenState.accessToken;
      integrationForSave = tokenState.nextIntegration;
      console.log('GMAIL_IMPORT_REFRESH_RESULT', {
        userId,
        refreshApplied: tokenState.refreshApplied,
        expiresAt: tokenState.nextIntegration.expires_at || null,
      });
    } catch (refreshError) {
      const errorMessage = refreshError instanceof Error ? refreshError.message : 'Unknown token error';
      const failedIntegration = {
        ...currentIntegration,
        status: 'error',
        last_error: `Token refresh failed: ${errorMessage}`,
      };

      await saveFinanceProfile(
        supabase,
        {
          ...basePayload,
          last_analysis: {
            ...lastAnalysis,
            gmail_integration: failedIntegration,
          },
          updated_at: new Date().toISOString(),
        },
        'refresh_failed',
      );

      console.log('GMAIL_IMPORT_REFRESH_RESULT', { userId, refreshApplied: false, error: errorMessage });
      return NextResponse.json({ status: 'error', error: 'GMAIL_TOKEN_INVALID', message: FALLBACK_ERROR }, { status: 400 });
    }

    let profileValidationError: string | null = null;
    try {
      await verifyGmailAccessToken(accessToken);
    } catch (profileError) {
      profileValidationError = profileError instanceof Error ? profileError.message : 'Gmail profile validation failed';
    }

    const emails = await fetchFinancialEmails(accessToken, 100);
    console.log('GMAIL_IMPORT_FETCH_RESULT', { userId, emailsFetched: emails.length, profileValidationError });

    const aiAnalysis = await analyzeFinancialEmailsWithAI(emails);

    const incomingSignals = [...aiAnalysis.subscriptions, ...aiAnalysis.recurringPayments];
    const existingSubscriptions = asArrayOfObjects(basePayload.active_subscriptions);
    const mergedSubscriptions = mergeSubscriptionSignals(existingSubscriptions, incomingSignals);

    const monthlyTotal = computeMonthlyTotal(mergedSubscriptions);
    const currency = basePayload.currency || incomingSignals.find((item) => item.currency)?.currency || 'USD';
    const subscriptionsFound = aiAnalysis.subscriptions.length;
    const recurringPaymentsFound = aiAnalysis.recurringPayments.length;
    const savingsEstimate =
      toNumber(basePayload.estimated_savings, 0) > 0
        ? toNumber(basePayload.estimated_savings, 0)
        : Math.round(monthlyTotal * 0.15 * 100) / 100;

    const summary =
      aiAnalysis.summary ||
      (emails.length === 0
        ? 'Gmail is connected, but no recent finance emails were found in the configured search window.'
        : `Analyzed ${emails.length} finance-related emails and extracted ${incomingSignals.length} recurring payment signals.`);

    console.log('GMAIL_IMPORT_ANALYSIS_RESULT', {
      userId,
      emailsAnalyzed: emails.length,
      subscriptionsFound,
      recurringPaymentsFound,
      merchants: aiAnalysis.merchants.length,
      monthlyTotal,
      estimatedSavings: savingsEstimate,
    });

    const syncedAt = new Date().toISOString();
    const updatedLastAnalysis = {
      ...lastAnalysis,
      gmail_integration: {
        ...integrationForSave,
        status: profileValidationError ? 'error' : 'connected',
        last_synced_at: syncedAt,
        last_sync_emails_analyzed: emails.length,
        last_sync_subscriptions_found: subscriptionsFound,
        last_error: profileValidationError,
      },
      gmail_import: {
        ...(asObject(lastAnalysis.gmail_import) || {}),
        last_synced_at: syncedAt,
        emails_analyzed: emails.length,
        subscriptions_found: subscriptionsFound,
        recurring_payments_found: recurringPaymentsFound,
        summary,
        merchants: aiAnalysis.merchants,
        trial_risks: aiAnalysis.trialRisks,
        savings_opportunities: aiAnalysis.savingsOpportunities,
      },
    };

    const memorySummary =
      emails.length === 0
        ? 'Gmail sync complete. No clear finance emails were found yet, so no recurring charges were added.'
        : summary;

    await saveFinanceProfile(
      supabase,
      {
        ...basePayload,
        active_subscriptions: mergedSubscriptions,
        total_monthly_cost: monthlyTotal,
        estimated_savings: savingsEstimate,
        currency,
        memory_summary: memorySummary,
        last_analysis: updatedLastAnalysis,
        updated_at: syncedAt,
      },
      'sync_complete',
    );


    try {
      await evaluateOperatorAlertsForUser(supabase, userId);
    } catch (operatorError) {
      console.error('OPERATOR_ALERT_ERROR', {
        action: 'gmail_import_post_sync_evaluate',
        userId,
        error: operatorError instanceof Error ? operatorError.message : String(operatorError),
      });
    }

    const profileWrite = await supabase.from('profiles').upsert(
      {
        id: userId,
        gmail_connected: true,
        gmail_last_sync_at: syncedAt,
        updated_at: syncedAt,
      },
      { onConflict: 'id' },
    );

    console.log('GMAIL_IMPORT_DB_WRITE_RESULT', { label: 'profiles_sync', hasError: Boolean(profileWrite.error) });
    if (profileWrite.error) throw profileWrite.error;

    const responsePayload = {
      status: profileValidationError ? 'error' : 'connected',
      lastSyncedAt: syncedAt,
      emailsAnalyzed: emails.length,
      subscriptionsFound,
      recurringPaymentsFound,
      monthlyTotal,
      estimatedMonthlySavings: savingsEstimate,
      summary,
      subscriptions: mergedSubscriptions,
      warning: profileValidationError,
    };

    console.log('GMAIL_IMPORT_DB_WRITE_RESULT', {
      label: 'final_response',
      userId,
      emailsAnalyzed: responsePayload.emailsAnalyzed,
      subscriptionsFound: responsePayload.subscriptionsFound,
      status: responsePayload.status,
    });

    return NextResponse.json(responsePayload, {
      status: profileValidationError ? 207 : 200,
    });
  } catch (error) {
    console.error('GMAIL_IMPORT_ERROR', error);

    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;

    if (userId) {
      const profile = await loadFinanceProfile(supabase, userId);
      const basePayload = buildBaseProfilePayload(userId, profile);
      const lastAnalysis = asObject(basePayload.last_analysis);
      const integration = parseIntegrationState(lastAnalysis.gmail_integration);

      await saveFinanceProfile(
        supabase,
        {
          ...basePayload,
          last_analysis: {
            ...lastAnalysis,
            gmail_integration: {
              ...integration,
              status: 'error',
              last_error: FALLBACK_ERROR,
            },
          },
          updated_at: new Date().toISOString(),
        },
        'sync_error_state',
      );
    }

    return NextResponse.json({ status: 'error', error: 'GMAIL_IMPORT_FAILED', message: FALLBACK_ERROR }, { status: 500 });
  }
}
