import {
  analyzeFinancialEmailsWithAI,
  fetchFinancialEmails,
  fetchInboxMessages,
  getUsableAccessTokenFromIntegration as getUsableGmailAccessToken,
  parseIntegrationState,
} from '@/lib/integrations/gmail';
import { buildInboxSummary, scoreInboxMessage } from '@/server/email-operator/summarize';
import { detectUrgentEmails } from '@/server/email-operator/urgent';
import { buildSubscriptionScannerResult } from '@/server/email-operator/subscriptions';
import { buildWeeklyDigest } from '@/server/email-operator/digest';
import { asObject, normalizeLower, normalizeText, toErrorMessage, DEFAULT_EMAIL_PREFERENCES, createAdminClient, TOOL_CONFIDENCE } from './helpers';
import type { AgentContext, AgentToolCall, AgentToolResult, PersistedFinanceProfile, ToolInput } from './types';
import { buildFailure, buildMissingConnection, buildSuccess } from './result-builders';
import { getRequestText } from './context';

function normalizeGmailAction(input: ToolInput): string {
  const action = normalizeLower(input.action);
  switch (action) {
    case 'status':
    case 'search':
    case 'scan_subscriptions':
    case 'subscriptions':
    case 'scan_receipts':
    case 'urgent':
    case 'digest':
    case 'draft_reply':
    case 'summarize_inbox':
    case 'inbox_summary':
      return action;
    default:
      return 'summarize_inbox';
  }
}

function extractRequestedQuery(call: AgentToolCall, context: AgentContext): string {
  const input = asObject(call.input);
  return normalizeText(input.query) || normalizeText(input.message) || getRequestText(context);
}

async function persistFinanceLastAnalysisUpdate(params: {
  userId: string;
  financeProfile: PersistedFinanceProfile | null | undefined;
  integrationKey: 'gmail_integration' | 'google_calendar_integration';
  integrationState: Record<string, unknown>;
}) {
  const admin = createAdminClient();
  const lastAnalysis = asObject(params.financeProfile?.last_analysis);

  await admin.from('finance_profiles').upsert(
    {
      user_id: params.userId,
      active_subscriptions: Array.isArray(params.financeProfile?.active_subscriptions)
        ? params.financeProfile?.active_subscriptions
        : [],
      total_monthly_cost:
        typeof params.financeProfile?.total_monthly_cost === 'number'
          ? params.financeProfile.total_monthly_cost
          : 0,
      estimated_savings:
        typeof params.financeProfile?.estimated_savings === 'number'
          ? params.financeProfile.estimated_savings
          : 0,
      currency: params.financeProfile?.currency || 'USD',
      memory_summary: params.financeProfile?.memory_summary || '',
      last_analysis: {
        ...lastAnalysis,
        [params.integrationKey]: params.integrationState,
      },
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
}

export async function gmailTool(
  call: AgentToolCall,
  context: AgentContext,
): Promise<AgentToolResult> {
  const startedAt = Date.now();
  const input = asObject(call.input);
  const action = normalizeGmailAction(input);
  const query = extractRequestedQuery(call, context);
  const userId = normalizeText(input.userId) || normalizeText(context.request.userId);

  if (!userId) return buildMissingConnection(call, 'gmail', action, startedAt);

  try {
    const admin = createAdminClient();
    const { data: financeProfile } = await admin
      .from('finance_profiles')
      .select('last_analysis,active_subscriptions,total_monthly_cost,estimated_savings,currency,memory_summary')
      .eq('user_id', userId)
      .maybeSingle();

    const integration = parseIntegrationState(
      asObject(asObject(financeProfile?.last_analysis).gmail_integration),
    );

    if (!integration.access_token_encrypted) {
      return buildMissingConnection(call, 'gmail', action, startedAt);
    }

    const tokenState = await getUsableGmailAccessToken(integration);
    if (tokenState.refreshApplied) {
      await persistFinanceLastAnalysisUpdate({
        userId,
        financeProfile: financeProfile ?? null,
        integrationKey: 'gmail_integration',
        integrationState: tokenState.nextIntegration as Record<string, unknown>,
      });
    }

    if (action === 'status') {
      return buildSuccess(
        call,
        'gmail',
        { action, connected: true, availableOperations: ['summarize_inbox', 'urgent', 'subscriptions', 'digest'] },
        {
          requiresAuth: true,
          requiredScopes: ['gmail.readonly'],
          summary: 'Gmail connection is available and operator actions are executable.',
          confidence: TOOL_CONFIDENCE.gmail,
        },
        startedAt,
      );
    }

    if (action === 'scan_subscriptions' || action === 'subscriptions') {
      const emails = await fetchFinancialEmails(tokenState.accessToken, 100);
      const analysis = await analyzeFinancialEmailsWithAI(emails);
      const scanner = buildSubscriptionScannerResult({
        analysis,
        emails,
        existingSubscriptions: Array.isArray(financeProfile?.active_subscriptions)
          ? financeProfile.active_subscriptions
          : [],
        preferences: DEFAULT_EMAIL_PREFERENCES,
      });

      return buildSuccess(call, 'gmail', {
        action: 'subscriptions', connected: true, query, summary: scanner.summary, result: scanner,
      }, {
        requiresAuth: true,
        summary: 'Fetched subscription and billing signals directly from Gmail.',
        confidence: TOOL_CONFIDENCE.gmail,
      }, startedAt);
    }

    if (action === 'scan_receipts') {
      const emails = await fetchFinancialEmails(tokenState.accessToken, 50);
      return buildSuccess(call, 'gmail', {
        action: 'scan_receipts', connected: true, query, receipts: emails.slice(0, 25),
      }, {
        requiresAuth: true,
        summary: 'Fetched receipt and billing-like messages from Gmail.',
        confidence: TOOL_CONFIDENCE.gmail,
      }, startedAt);
    }

    const inbox = await fetchInboxMessages({
      accessToken: tokenState.accessToken,
      maxResults: 60,
      query: action === 'search' ? query : 'newer_than:14d',
    });

    const scored = inbox.map((message) => scoreInboxMessage(message));

    if (action === 'urgent') {
      const urgent = detectUrgentEmails(inbox, DEFAULT_EMAIL_PREFERENCES);
      return buildSuccess(call, 'gmail', {
        action: 'urgent', connected: true, query, summary: `Detected ${urgent.totalUrgent} urgent messages.`, result: urgent,
      }, {
        requiresAuth: true,
        summary: 'Executed Gmail urgent analysis.',
        confidence: TOOL_CONFIDENCE.gmail,
      }, startedAt);
    }

    if (action === 'digest') {
      const urgent = detectUrgentEmails(inbox, DEFAULT_EMAIL_PREFERENCES);
      const inboxSummary = buildInboxSummary(scored, DEFAULT_EMAIL_PREFERENCES);
      const digest = buildWeeklyDigest({
        inboxSummary,
        urgent,
        subscriptions: {
          generatedAt: new Date().toISOString(),
          activeCount: 0,
          duplicateCount: 0,
          trialEndingCount: 0,
          renewalCount: 0,
          priceIncreaseCount: 0,
          cancellationOpportunities: [],
          estimatedMonthlySavings: 0,
          currency: 'USD',
          opportunities: [],
          summary: 'Subscription scan not requested.',
        },
      });

      return buildSuccess(call, 'gmail', {
        action: 'digest', connected: true, query, summary: digest.conciseSummary, result: digest,
      }, {
        requiresAuth: true,
        summary: 'Generated Gmail digest.',
        confidence: TOOL_CONFIDENCE.gmail,
      }, startedAt);
    }

    const summary = buildInboxSummary(scored, DEFAULT_EMAIL_PREFERENCES);
    return buildSuccess(call, 'gmail', {
      action: action === 'search' ? 'search' : 'summarize_inbox',
      connected: true,
      query,
      summary: summary.headline,
      result: summary,
    }, {
      requiresAuth: true,
      summary: summary.headline,
      confidence: TOOL_CONFIDENCE.gmail,
    }, startedAt);
  } catch (error) {
    return buildFailure(
      call,
      'gmail',
      `Gmail execution failed: ${toErrorMessage(error)}`,
      { action, query },
      startedAt,
    );
  }
}
