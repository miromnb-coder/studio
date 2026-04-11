import { AgentContextV8, ToolResultV8 } from '../types';
import {
  analyzeFinancialEmailsWithAI,
  fetchFinancialEmails,
  getUsableAccessTokenFromIntegration,
  parseIntegrationState,
} from '@/lib/integrations/gmail';

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

export async function gmailFetchTool(
  input: Record<string, unknown>,
  context: AgentContextV8,
): Promise<ToolResultV8> {
  if (!context.environment.gmailConnected) {
    return {
      ok: false,
      tool: 'gmail_fetch',
      output: { connected: false, messages: [] },
      error: 'Gmail is not connected.',
    };
  }

  const query = typeof input.query === 'string' ? input.query : context.user.message;
  const financeOnly = Boolean(input.financeOnly);
  const maxResults = financeOnly ? 60 : 40;

  const { data: profile, error: profileError } = await context.supabase
    .from('finance_profiles')
    .select('last_analysis')
    .eq('user_id', context.user.id)
    .maybeSingle();

  if (profileError) {
    return {
      ok: false,
      tool: 'gmail_fetch',
      output: { connected: true, query, financeOnly, messages: [] },
      error: `Failed to load Gmail integration state: ${profileError.message}`,
    };
  }

  const lastAnalysis = asObject(profile?.last_analysis);
  const integration = parseIntegrationState(lastAnalysis.gmail_integration);
  const gmailImport = asObject(lastAnalysis.gmail_import);

  if (!integration.access_token_encrypted) {
    return {
      ok: false,
      tool: 'gmail_fetch',
      output: {
        connected: false,
        query,
        financeOnly,
        messages: [],
      },
      error: 'Gmail token is missing. Reconnect Gmail to fetch messages.',
    };
  }

  try {
    const tokenState = await getUsableAccessTokenFromIntegration(integration);
    const emails = await fetchFinancialEmails(tokenState.accessToken, maxResults);
    const analysis = await analyzeFinancialEmailsWithAI(emails);

    return {
      ok: true,
      tool: 'gmail_fetch',
      output: {
        connected: true,
        query,
        financeOnly,
        emailsAnalyzed: emails.length,
        subscriptionsFound: analysis.subscriptions.length,
        recurringPaymentsFound: analysis.recurringPayments.length,
        merchants: analysis.merchants,
        trialRisks: analysis.trialRisks,
        savingsOpportunities: analysis.savingsOpportunities,
        subscriptions: analysis.subscriptions,
        recurringPayments: analysis.recurringPayments,
        summary: analysis.summary || String(gmailImport.summary || ''),
        lastSyncedAt: integration.last_synced_at || gmailImport.last_synced_at || null,
      },
    };
  } catch (error) {
    return {
      ok: false,
      tool: 'gmail_fetch',
      output: {
        connected: true,
        query,
        financeOnly,
        emailsAnalyzed: typeof gmailImport.emails_analyzed === 'number' ? gmailImport.emails_analyzed : 0,
        subscriptionsFound: typeof gmailImport.subscriptions_found === 'number' ? gmailImport.subscriptions_found : 0,
        recurringPaymentsFound: typeof gmailImport.recurring_payments_found === 'number' ? gmailImport.recurring_payments_found : 0,
        merchants: Array.isArray(gmailImport.merchants) ? gmailImport.merchants : [],
        trialRisks: Array.isArray(gmailImport.trial_risks) ? gmailImport.trial_risks : [],
        savingsOpportunities: Array.isArray(gmailImport.savings_opportunities) ? gmailImport.savings_opportunities : [],
        subscriptions: [],
        recurringPayments: [],
        summary: String(gmailImport.summary || ''),
        lastSyncedAt: integration.last_synced_at || gmailImport.last_synced_at || null,
      },
      error: error instanceof Error ? error.message : 'Gmail fetch failed.',
    };
  }
}
