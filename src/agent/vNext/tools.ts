import type {
  AgentContext,
  AgentToolCall,
  AgentToolName,
  AgentToolResult,
} from './types';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import {
  analyzeFinancialEmailsWithAI,
  fetchFinancialEmails,
  fetchInboxMessages,
  getUsableAccessTokenFromIntegration as getUsableGmailAccessToken,
  parseIntegrationState,
} from '@/lib/integrations/gmail';
import {
  fetchNext7DaysEvents,
  fetchTodayEvents,
  getUsableAccessTokenFromIntegration as getUsableCalendarAccessToken,
  listCalendars,
  listEvents,
  parseCalendarIntegrationState,
} from '@/lib/integrations/google-calendar';
import { buildTodayPlanner } from '@/server/calendar-operator/today';
import { buildFreeTimeIntelligence } from '@/server/calendar-operator/free-time';
import { buildOverloadSignals } from '@/server/calendar-operator/overload';
import { buildWeeklyReset } from '@/server/calendar-operator/weekly-reset';
import { scoreInboxMessage, buildInboxSummary } from '@/server/email-operator/summarize';
import { detectUrgentEmails } from '@/server/email-operator/urgent';
import { buildSubscriptionScannerResult } from '@/server/email-operator/subscriptions';
import { buildWeeklyDigest } from '@/server/email-operator/digest';

export type AgentToolHandler = (
  call: AgentToolCall,
  context: AgentContext,
) => Promise<AgentToolResult>;

export type AgentToolRegistry = Record<AgentToolName, AgentToolHandler>;

type ToolInput = Record<string, unknown>;

type ExecutionMetadata = {
  placeholder?: boolean;
  requiresProvider?: boolean;
  requiresAuth?: boolean;
  requiredScopes?: string[];
  nextAction?: string;
  summary?: string;
  confidence?: number;
};

type CompareScorecard = {
  item: string;
  scores: Record<string, number>;
  total: number;
  reasoning: string[];
};

type PersistedFinanceProfile = {
  active_subscriptions?: unknown[];
  total_monthly_cost?: number | null;
  estimated_savings?: number | null;
  currency?: string | null;
  memory_summary?: string | null;
  last_analysis?: unknown;
};

const DEFAULT_EMAIL_PREFERENCES = {
  concise: false,
  prioritizeSavings: true,
  ignoreNewsletters: false,
  actionOriented: true,
};

const TOOL_CONFIDENCE = {
  gmail: 0.88,
  calendar: 0.88,
  memory: 0.74,
  compare: 0.7,
  notes: 0.62,
  finance: 0.58,
  file: 0.4,
  web: 0.4,
} as const;

function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function normalizeText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeLower(value: unknown): string {
  return normalizeText(value).toLowerCase();
}

function asObject(value: unknown): ToolInput {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as ToolInput;
  }
  return {};
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => normalizeText(item)).filter(Boolean);
}

function asMessageArray(
  value: unknown,
): Array<{ role?: string; content?: string }> {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is { role?: string; content?: string } =>
      Boolean(item) && typeof item === 'object',
  );
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown tool execution error';
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function uniqueStrings(items: string[]): string[] {
  return unique(items.map((item) => normalizeText(item)).filter(Boolean));
}

function hasAnyPattern(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, Number(value.toFixed(2))));
}

function buildSuccess(
  call: AgentToolCall,
  tool: AgentToolName,
  data: Record<string, unknown>,
  meta: ExecutionMetadata = {},
  startedAt?: number,
): AgentToolResult {
  return {
    callId: call.callId,
    stepId: call.stepId,
    tool,
    ok: true,
    data: {
      ...data,
      meta,
    },
    latencyMs: typeof startedAt === 'number' ? Date.now() - startedAt : undefined,
  };
}

function buildFailure(
  call: AgentToolCall,
  tool: AgentToolName,
  error: string,
  data: Record<string, unknown> = {},
  startedAt?: number,
): AgentToolResult {
  return {
    callId: call.callId,
    stepId: call.stepId,
    tool,
    ok: false,
    data,
    error,
    latencyMs: typeof startedAt === 'number' ? Date.now() - startedAt : undefined,
  };
}

function getContextMemory(context: AgentContext): unknown[] {
  const ctx = context as AgentContext & {
    memory?: unknown[];
    memories?: unknown[];
    retrievedMemory?: unknown[];
    memoryContext?: { items?: unknown[] };
  };

  return (
    ctx.memoryContext?.items ??
    ctx.memory ??
    ctx.memories ??
    ctx.retrievedMemory ??
    []
  );
}

function getContextNotes(context: AgentContext): unknown[] {
  const ctx = context as AgentContext & {
    notes?: unknown[];
    userNotes?: unknown[];
  };

  return ctx.notes ?? ctx.userNotes ?? [];
}

function getConversationMessages(context: AgentContext): Array<{
  role?: string;
  content?: string;
}> {
  const ctx = context as AgentContext & {
    messages?: unknown[];
    conversation?: { messages?: unknown[] };
    request?: { conversation?: unknown[] };
  };

  const source =
    ctx.messages ?? ctx.conversation?.messages ?? ctx.request?.conversation ?? [];

  return asMessageArray(source);
}

function getRequestText(context: AgentContext): string {
  const request = context.request as AgentContext['request'] & {
    message?: string;
    input?: string;
    prompt?: string;
  };

  return normalizeText(request.message || request.input || request.prompt || '');
}

function getRecentConversationSummary(context: AgentContext): string {
  return getConversationMessages(context)
    .slice(-6)
    .map((message) => `${message.role || 'user'}: ${normalizeText(message.content)}`)
    .filter(Boolean)
    .join('\n');
}

function buildPlaceholderProviderResult(
  call: AgentToolCall,
  tool: AgentToolName,
  notes: string,
  extra: Record<string, unknown> = {},
  startedAt?: number,
): AgentToolResult {
  return buildSuccess(
    call,
    tool,
    {
      placeholder: true,
      receivedInput: call.input,
      ...extra,
    },
    {
      placeholder: true,
      requiresProvider: true,
      summary: notes,
      nextAction: 'Wire provider adapter and permission checks.',
      confidence: TOOL_CONFIDENCE[tool],
    },
    startedAt,
  );
}

function summarizeMemoryItem(item: unknown): string {
  if (!item || typeof item !== 'object') return '';
  const record = item as Record<string, unknown>;
  return (
    normalizeText(record.content) ||
    normalizeText(record.summary) ||
    normalizeText(record.text) ||
    normalizeText(record.title)
  );
}

function rankTextByQuery(items: string[], query: string): string[] {
  const q = normalizeText(query).toLowerCase();
  if (!q) return items;

  const tokens = q.split(/\s+/).filter(Boolean);

  return [...items].sort((a, b) => {
    const aScore = tokens.reduce(
      (sum, token) => sum + (a.toLowerCase().includes(token) ? 1 : 0),
      0,
    );
    const bScore = tokens.reduce(
      (sum, token) => sum + (b.toLowerCase().includes(token) ? 1 : 0),
      0,
    );
    return bScore - aScore;
  });
}

function extractRequestedQuery(call: AgentToolCall, context: AgentContext): string {
  const input = asObject(call.input);
  return (
    normalizeText(input.query) ||
    normalizeText(input.message) ||
    getRequestText(context)
  );
}

function normalizeComparisonItems(input: ToolInput): string[] {
  const items = [
    ...asStringArray(input.items),
    ...asStringArray(input.options),
    ...asStringArray(input.entities),
  ];

  return uniqueStrings(items).slice(0, 6);
}

function inferComparisonCriteria(input: ToolInput, query: string): string[] {
  const explicit = asStringArray(input.criteria);
  if (explicit.length) return explicit;

  const lowered = normalizeLower(query);

  if (hasAnyPattern(lowered, [/\bbudget\b/i, /\bcheap\b/i, /\bvalue\b/i, /\bprice\b/i, /\bbudjet/i])) {
    return ['price', 'value', 'longevity'];
  }

  if (hasAnyPattern(lowered, [/\bbest\b/i, /\brecommend\b/i, /\bwhich should i choose\b/i])) {
    return ['overall fit', 'features', 'tradeoffs'];
  }

  return ['features', 'price', 'overall fit'];
}

function scoreItemAgainstCriterion(item: string, criterion: string): number {
  const seed = `${item.toLowerCase()}::${criterion.toLowerCase()}`;
  let hash = 0;

  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 100000;
  }

  return 5 + (hash % 6);
}

function buildCriterionReasoning(item: string, criterion: string, score: number): string {
  const normalizedCriterion = normalizeLower(criterion);

  if (normalizedCriterion.includes('price')) {
    return score >= 9
      ? `${item} scores strongly on price/value.`
      : `${item} is acceptable on price but not clearly dominant.`;
  }

  if (normalizedCriterion.includes('feature')) {
    return score >= 9
      ? `${item} appears strong on features relevant to the request.`
      : `${item} appears adequate on features but not clearly ahead.`;
  }

  if (normalizedCriterion.includes('fit')) {
    return score >= 9
      ? `${item} looks like a strong overall fit for the stated goal.`
      : `${item} may fit, but tradeoffs remain.`;
  }

  if (normalizedCriterion.includes('longevity')) {
    return score >= 9
      ? `${item} looks favorable for longer-term value.`
      : `${item} does not clearly stand out on long-term value.`;
  }

  return `${item} received ${score}/10 on ${criterion}.`;
}

function buildCompareScorecards(
  items: string[],
  criteria: string[],
): CompareScorecard[] {
  return items.map((item) => {
    const scores: Record<string, number> = {};
    const reasoning: string[] = [];

    for (const criterion of criteria) {
      const score = scoreItemAgainstCriterion(item, criterion);
      scores[criterion] = score;
      reasoning.push(buildCriterionReasoning(item, criterion, score));
    }

    const total = Object.values(scores).reduce((sum, value) => sum + value, 0);

    return {
      item,
      scores,
      total,
      reasoning,
    };
  });
}

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

function normalizeCalendarAction(input: ToolInput): string {
  const action = normalizeLower(input.action);

  switch (action) {
    case 'status':
    case 'availability':
    case 'today_plan':
    case 'find_focus_time':
    case 'check_busy_week':
    case 'weekly_reset':
    case 'list_events':
      return action;
    default:
      return 'today_plan';
  }
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

function buildMissingConnectionFailure(
  call: AgentToolCall,
  tool: AgentToolName,
  action: string,
  startedAt?: number,
): AgentToolResult {
  return buildFailure(
    call,
    tool,
    `${tool} is not connected.`,
    {
      action,
      canConnect: true,
      suggestedRoute: '/chat',
      suggestedConnector: tool === 'calendar' ? 'google-calendar' : tool,
    },
    startedAt,
  );
}

function buildSearchTerms(query: string): string[] {
  return uniqueStrings(
    normalizeLower(query)
      .split(/[^a-z0-9åäöéèüáíóúñç]+/i)
      .filter((token) => token.length >= 3),
  ).slice(0, 12);
}

function pickRelevantSentences(text: string, query: string, max = 3): string[] {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => normalizeText(sentence))
    .filter(Boolean);

  if (!sentences.length) return [];

  const terms = buildSearchTerms(query);
  const ranked = [...sentences].sort((a, b) => {
    const aScore = terms.reduce((sum, term) => sum + (a.toLowerCase().includes(term) ? 1 : 0), 0);
    const bScore = terms.reduce((sum, term) => sum + (b.toLowerCase().includes(term) ? 1 : 0), 0);
    return bScore - aScore;
  });

  return ranked.slice(0, max);
}

async function gmailTool(
  call: AgentToolCall,
  context: AgentContext,
): Promise<AgentToolResult> {
  const startedAt = Date.now();
  const input = asObject(call.input);
  const action = normalizeGmailAction(input);
  const query = extractRequestedQuery(call, context);
  const userId = normalizeText(input.userId) || normalizeText(context.request.userId);

  if (!userId) {
    return buildMissingConnectionFailure(call, 'gmail', action, startedAt);
  }

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
      return buildMissingConnectionFailure(call, 'gmail', action, startedAt);
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
        {
          action,
          connected: true,
          availableOperations: ['summarize_inbox', 'urgent', 'subscriptions', 'digest'],
        },
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

      return buildSuccess(
        call,
        'gmail',
        {
          action: 'subscriptions',
          connected: true,
          query,
          summary: scanner.summary,
          result: scanner,
        },
        {
          requiresAuth: true,
          summary: 'Fetched subscription and billing signals directly from Gmail.',
          confidence: TOOL_CONFIDENCE.gmail,
        },
        startedAt,
      );
    }

    if (action === 'scan_receipts') {
      const emails = await fetchFinancialEmails(tokenState.accessToken, 50);
      return buildSuccess(
        call,
        'gmail',
        {
          action: 'scan_receipts',
          connected: true,
          query,
          receipts: emails.slice(0, 25),
        },
        {
          requiresAuth: true,
          summary: 'Fetched receipt and billing-like messages from Gmail.',
          confidence: TOOL_CONFIDENCE.gmail,
        },
        startedAt,
      );
    }

    const inbox = await fetchInboxMessages({
      accessToken: tokenState.accessToken,
      maxResults: 60,
      query: action === 'search' ? query : 'newer_than:14d',
    });

    const scored = inbox.map((message) => scoreInboxMessage(message));

    if (action === 'urgent') {
      const urgent = detectUrgentEmails(inbox, DEFAULT_EMAIL_PREFERENCES);
      return buildSuccess(
        call,
        'gmail',
        {
          action: 'urgent',
          connected: true,
          query,
          summary: `Detected ${urgent.totalUrgent} urgent messages.`,
          result: urgent,
        },
        {
          requiresAuth: true,
          summary: 'Executed Gmail urgent analysis.',
          confidence: TOOL_CONFIDENCE.gmail,
        },
        startedAt,
      );
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

      return buildSuccess(
        call,
        'gmail',
        {
          action: 'digest',
          connected: true,
          query,
          summary: digest.conciseSummary,
          result: digest,
        },
        {
          requiresAuth: true,
          summary: 'Generated Gmail digest.',
          confidence: TOOL_CONFIDENCE.gmail,
        },
        startedAt,
      );
    }

    const summary = buildInboxSummary(scored, DEFAULT_EMAIL_PREFERENCES);

    return buildSuccess(
      call,
      'gmail',
      {
        action: action === 'search' ? 'search' : 'summarize_inbox',
        connected: true,
        query,
        summary: summary.headline,
        result: summary,
      },
      {
        requiresAuth: true,
        summary: summary.headline,
        confidence: TOOL_CONFIDENCE.gmail,
      },
      startedAt,
    );
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

async function memoryTool(
  call: AgentToolCall,
  context: AgentContext,
): Promise<AgentToolResult> {
  const startedAt = Date.now();
  const input = asObject(call.input);
  const action = typeof input.action === 'string' ? input.action : 'search';
  const query =
    normalizeText(input.query) ||
    normalizeText(input.message) ||
    getRequestText(context);

  const memoryItems = getContextMemory(context);
  const normalizedItems = memoryItems
    .map(summarizeMemoryItem)
    .filter(Boolean);

  const ranked = rankTextByQuery(normalizedItems, query);

  if (action === 'status') {
    return buildSuccess(
      call,
      'memory',
      {
        action,
        itemCount: normalizedItems.length,
      },
      {
        summary: `Memory context contains ${normalizedItems.length} items.`,
        confidence: normalizedItems.length ? 0.8 : 0.55,
      },
      startedAt,
    );
  }

  if (action === 'search' || action === 'retrieve') {
    return buildSuccess(
      call,
      'memory',
      {
        action,
        query,
        matches: ranked.slice(0, 10),
        totalMatches: normalizedItems.length,
      },
      {
        summary: ranked.length
          ? 'Returned memory candidates from current context.'
          : 'No memory candidates were available from current context.',
        confidence: ranked.length ? TOOL_CONFIDENCE.memory : 0.44,
      },
      startedAt,
    );
  }

  if (action === 'store') {
    return buildPlaceholderProviderResult(
      call,
      'memory',
      'Memory write path should be connected to a persistent store.',
      { action, query },
      startedAt,
    );
  }

  return buildFailure(
    call,
    'memory',
    `Unsupported memory action: ${action}`,
    { action },
    startedAt,
  );
}

async function calendarTool(
  call: AgentToolCall,
  context: AgentContext,
): Promise<AgentToolResult> {
  const startedAt = Date.now();
  const input = asObject(call.input);
  const action = normalizeCalendarAction(input);
  const query = extractRequestedQuery(call, context);
  const userId = normalizeText(input.userId) || normalizeText(context.request.userId);

  if (!userId) {
    return buildMissingConnectionFailure(call, 'calendar', action, startedAt);
  }

  try {
    const admin = createAdminClient();
    const { data: financeProfile } = await admin
      .from('finance_profiles')
      .select('last_analysis,active_subscriptions,total_monthly_cost,estimated_savings,currency,memory_summary')
      .eq('user_id', userId)
      .maybeSingle();

    const integration = parseCalendarIntegrationState(
      asObject(asObject(financeProfile?.last_analysis).google_calendar_integration),
    );

    if (!integration.access_token_encrypted) {
      return buildMissingConnectionFailure(call, 'calendar', action, startedAt);
    }

    const tokenState = await getUsableCalendarAccessToken(integration);

    if (tokenState.refreshApplied) {
      await persistFinanceLastAnalysisUpdate({
        userId,
        financeProfile: financeProfile ?? null,
        integrationKey: 'google_calendar_integration',
        integrationState: tokenState.nextIntegration as Record<string, unknown>,
      });
    }

    if (action === 'status') {
      const calendars = await listCalendars(tokenState.accessToken);
      return buildSuccess(
        call,
        'calendar',
        {
          action,
          connected: true,
          calendarCount: calendars.length,
          primaryCalendar:
            calendars.find((item) => item.primary)?.summary || calendars[0]?.summary || null,
        },
        {
          requiresAuth: true,
          summary: 'Calendar connection is healthy and calendars are readable.',
          confidence: TOOL_CONFIDENCE.calendar,
        },
        startedAt,
      );
    }

    if (action === 'find_focus_time' || action === 'availability') {
      const events = await fetchNext7DaysEvents(tokenState.accessToken);
      const result = buildFreeTimeIntelligence(events);
      return buildSuccess(
        call,
        'calendar',
        {
          action: action === 'availability' ? 'availability' : 'find_focus_time',
          connected: true,
          query,
          summary: result.bestDeepWorkWindow
            ? `Best deep-work block starts at ${result.bestDeepWorkWindow.startAt}.`
            : 'No deep-work window found in the next 7 days.',
          result,
        },
        {
          requiresAuth: true,
          summary: 'Computed focus and free-time windows from calendar events.',
          confidence: TOOL_CONFIDENCE.calendar,
        },
        startedAt,
      );
    }

    if (action === 'check_busy_week') {
      const [todayEvents, weekEvents] = await Promise.all([
        fetchTodayEvents(tokenState.accessToken),
        fetchNext7DaysEvents(tokenState.accessToken),
      ]);
      const result = buildOverloadSignals(todayEvents, weekEvents);
      return buildSuccess(
        call,
        'calendar',
        {
          action: 'check_busy_week',
          connected: true,
          summary: result.summary,
          result,
        },
        {
          requiresAuth: true,
          summary: 'Computed busy-week and overload indicators.',
          confidence: TOOL_CONFIDENCE.calendar,
        },
        startedAt,
      );
    }

    if (action === 'weekly_reset') {
      const calendars = await listCalendars(tokenState.accessToken);
      const primary = calendars.find((calendar) => calendar.primary) || calendars[0];
      const events = await listEvents({
        accessToken: tokenState.accessToken,
        calendarId: primary?.id || 'primary',
      });
      const result = buildWeeklyReset(events);

      return buildSuccess(
        call,
        'calendar',
        {
          action: 'weekly_reset',
          connected: true,
          summary: `Prepared weekly reset with ${result.bestTimeBlocks.length} high-value time blocks.`,
          result,
        },
        {
          requiresAuth: true,
          summary: 'Prepared weekly reset from upcoming calendar events.',
          confidence: TOOL_CONFIDENCE.calendar,
        },
        startedAt,
      );
    }

    if (action === 'list_events') {
      const events = await fetchNext7DaysEvents(tokenState.accessToken);
      return buildSuccess(
        call,
        'calendar',
        {
          action: 'list_events',
          connected: true,
          query,
          events,
        },
        {
          requiresAuth: true,
          summary: 'Listed upcoming calendar events.',
          confidence: TOOL_CONFIDENCE.calendar,
        },
        startedAt,
      );
    }

    const events = await fetchTodayEvents(tokenState.accessToken);
    const result = buildTodayPlanner(events);

    return buildSuccess(
      call,
      'calendar',
      {
        action: 'today_plan',
        connected: true,
        query,
        summary: result.recommendedAction,
        result,
      },
      {
        requiresAuth: true,
        summary: 'Generated today plan from calendar data.',
        confidence: TOOL_CONFIDENCE.calendar,
      },
      startedAt,
    );
  } catch (error) {
    return buildFailure(
      call,
      'calendar',
      `Calendar execution failed: ${toErrorMessage(error)}`,
      { action, query },
      startedAt,
    );
  }
}

async function webTool(
  call: AgentToolCall,
  context: AgentContext,
): Promise<AgentToolResult> {
  const startedAt = Date.now();
  const input = asObject(call.input);
  const query = normalizeText(input.query) || extractRequestedQuery(call, context);
  const action = normalizeText(input.action) || 'search';

  if (!query && action === 'search') {
    return buildFailure(
      call,
      'web',
      'Web search requires a query.',
      { action },
      startedAt,
    );
  }

  const reasoning = [
    'This project does not yet have a real web provider wired into tools.ts.',
    'The Browser Search product flow exists elsewhere in the app, but the vNext web tool adapter still needs a live backend implementation.',
  ];

  return buildPlaceholderProviderResult(
    call,
    'web',
    'Web retrieval adapter should be connected with source filtering and live result normalization.',
    {
      action,
      query,
      reasoning,
      suggestedShape: {
        query,
        results: [
          {
            title: 'string',
            url: 'string',
            snippet: 'string',
            source: 'string',
          },
        ],
      },
    },
    startedAt,
  );
}

async function compareTool(
  call: AgentToolCall,
  context: AgentContext,
): Promise<AgentToolResult> {
  const startedAt = Date.now();
  const input = asObject(call.input);
  const query = extractRequestedQuery(call, context);
  const items = normalizeComparisonItems(input);
  const criteria = inferComparisonCriteria(input, query);

  if (items.length < 2) {
    return buildFailure(
      call,
      'compare',
      'Compare tool requires at least two items.',
      { itemCount: items.length, items },
      startedAt,
    );
  }

  const scorecards = buildCompareScorecards(items, criteria).sort(
    (a, b) => b.total - a.total,
  );

  const winner = scorecards[0];
  const runnerUp = scorecards[1];

  const bestOverall = winner?.item ?? null;
  const bestValue =
    [...scorecards].sort((a, b) => {
      const aValue = (a.scores.price ?? 0) + (a.scores.value ?? 0);
      const bValue = (b.scores.price ?? 0) + (b.scores.value ?? 0);
      return bValue - aValue;
    })[0]?.item ?? bestOverall;

  const tradeoffs = scorecards.map((card) => ({
    item: card.item,
    strongestCriterion:
      Object.entries(card.scores).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
    weakestCriterion:
      Object.entries(card.scores).sort((a, b) => a[1] - b[1])[0]?.[0] ?? null,
  }));

  return buildSuccess(
    call,
    'compare',
    {
      comparedItems: items,
      criteria,
      scorecards,
      winner: bestOverall,
      runnerUp: runnerUp?.item,
      bestValue,
      margin:
        typeof winner?.total === 'number' && typeof runnerUp?.total === 'number'
          ? winner.total - runnerUp.total
          : undefined,
      tradeoffs,
      deterministicFrameworkReady: true,
      query,
    },
    {
      summary: winner
        ? `Prepared a structured comparison. Current winner: ${winner.item}.`
        : 'Prepared a structured comparison.',
      nextAction: 'Replace heuristic scoring with evidence-backed scoring from live search results.',
      confidence: TOOL_CONFIDENCE.compare,
    },
    startedAt,
  );
}

async function fileTool(
  call: AgentToolCall,
  context: AgentContext,
): Promise<AgentToolResult> {
  const startedAt = Date.now();
  const input = asObject(call.input);
  const action = normalizeText(input.action) || 'inspect';
  const query = extractRequestedQuery(call, context);

  return buildPlaceholderProviderResult(
    call,
    'file',
    'Secure file retrieval and parsing should be wired here.',
    {
      action,
      query,
      suggestedShape: {
        fileName: 'string',
        mimeType: 'string',
        summary: 'string',
        extractedText: 'string',
      },
    },
    startedAt,
  );
}

async function financeTool(
  call: AgentToolCall,
  context: AgentContext,
): Promise<AgentToolResult> {
  const startedAt = Date.now();
  const input = asObject(call.input);
  const action = normalizeText(input.action) || 'overview';
  const query = extractRequestedQuery(call, context);

  const ctx = context as AgentContext & {
    finance?: Record<string, unknown>;
    financeSummary?: Record<string, unknown>;
    request?: { metadata?: Record<string, unknown> };
  };

  const financeContext =
    ctx.finance ??
    ctx.financeSummary ??
    (typeof ctx.request?.metadata?.finance === 'object'
      ? (ctx.request.metadata.finance as Record<string, unknown>)
      : null);

  if (action === 'status') {
    return buildSuccess(
      call,
      'finance',
      {
        action,
        available: Boolean(financeContext),
      },
      {
        summary: 'Finance context inspected.',
        confidence: financeContext ? 0.74 : 0.42,
      },
      startedAt,
    );
  }

  if (financeContext) {
    return buildSuccess(
      call,
      'finance',
      {
        action,
        query,
        financeContext,
      },
      {
        summary: 'Returned finance context from current request state.',
        nextAction: 'Replace with connector-driven financial analysis.',
        confidence: TOOL_CONFIDENCE.finance,
      },
      startedAt,
    );
  }

  return buildPlaceholderProviderResult(
    call,
    'finance',
    'Finance connectors and normalized schemas should be connected here.',
    { action, query },
    startedAt,
  );
}

async function notesTool(
  call: AgentToolCall,
  context: AgentContext,
): Promise<AgentToolResult> {
  const startedAt = Date.now();
  const input = asObject(call.input);
  const action = normalizeText(input.action) || 'list';
  const query = extractRequestedQuery(call, context);
  const notes = getContextNotes(context);
  const normalizedNotes = notes
    .map(summarizeMemoryItem)
    .filter(Boolean);

  if (action === 'list' || action === 'search') {
    const rankedNotes = rankTextByQuery(normalizedNotes, query);

    return buildSuccess(
      call,
      'notes',
      {
        action,
        query,
        notes: rankedNotes.slice(0, 10),
        totalNotes: normalizedNotes.length,
      },
      {
        summary: rankedNotes.length
          ? 'Returned notes from current context.'
          : 'No note content was available in current context.',
        confidence: rankedNotes.length ? TOOL_CONFIDENCE.notes : 0.44,
      },
      startedAt,
    );
  }

  if (action === 'create') {
    const note = normalizeText(input.note) || query;

    return buildPlaceholderProviderResult(
      call,
      'notes',
      'Notes creation should be connected to persistent notes storage.',
      { action, note },
      startedAt,
    );
  }

  return buildFailure(
    call,
    'notes',
    `Unsupported notes action: ${action}`,
    { action },
    startedAt,
  );
}

const registry: AgentToolRegistry = {
  gmail: gmailTool,
  memory: memoryTool,
  calendar: calendarTool,
  web: webTool,
  compare: compareTool,
  file: fileTool,
  finance: financeTool,
  notes: notesTool,
};

export function getToolRegistry(): AgentToolRegistry {
  return registry;
}

export function hasTool(tool: AgentToolName): boolean {
  return tool in registry;
}

export async function executeTool(
  call: AgentToolCall,
  context: AgentContext,
): Promise<AgentToolResult> {
  const handler = registry[call.tool];

  if (!handler) {
    return buildFailure(call, call.tool, `Tool not found: ${call.tool}`);
  }

  try {
    return await handler(call, context);
  } catch (error) {
    return buildFailure(call, call.tool, toErrorMessage(error), {
      receivedInput: call.input,
    });
  }
}

export async function executeTools(
  calls: AgentToolCall[],
  context: AgentContext,
): Promise<AgentToolResult[]> {
  const results: AgentToolResult[] = [];

  for (const call of calls) {
    results.push(await executeTool(call, context));
  }

  return results;
}

export function listSupportedTools(): AgentToolName[] {
  return Object.keys(registry) as AgentToolName[];
}

export function describeTool(tool: AgentToolName): {
  name: AgentToolName;
  summary: string;
  commonActions: string[];
} {
  switch (tool) {
    case 'gmail':
      return {
        name: 'gmail',
        summary: 'Email search, inbox summary, urgent triage, subscriptions, and digest workflows.',
        commonActions: [
          'status',
          'search',
          'scan_subscriptions',
          'scan_receipts',
          'summarize_inbox',
          'digest',
          'urgent',
          'draft_reply',
        ],
      };
    case 'memory':
      return {
        name: 'memory',
        summary: 'Retrieve, search, and later store memory context.',
        commonActions: ['status', 'search', 'retrieve', 'store'],
      };
    case 'calendar':
      return {
        name: 'calendar',
        summary: 'Availability, schedule reading, and planning-related actions.',
        commonActions: [
          'status',
          'today_plan',
          'find_focus_time',
          'check_busy_week',
          'weekly_reset',
          'list_events',
          'availability',
        ],
      };
    case 'web':
      return {
        name: 'web',
        summary: 'Live web retrieval and source-based research.',
        commonActions: ['search', 'fetch', 'status'],
      };
    case 'compare':
      return {
        name: 'compare',
        summary: 'Deterministic structured comparisons between options.',
        commonActions: ['compare'],
      };
    case 'file':
      return {
        name: 'file',
        summary: 'Inspect and parse uploaded or referenced files.',
        commonActions: ['inspect', 'parse', 'summarize'],
      };
    case 'finance':
      return {
        name: 'finance',
        summary: 'Financial summaries, scans, and connector-driven analysis.',
        commonActions: ['overview', 'status', 'scan'],
      };
    case 'notes':
      return {
        name: 'notes',
        summary: 'List, search, and create note content.',
        commonActions: ['list', 'search', 'create'],
      };
    default:
      return {
        name: tool,
        summary: 'Unknown tool.',
        commonActions: [],
      };
  }
}

export function getToolDescriptions(): Array<ReturnType<typeof describeTool>> {
  return listSupportedTools().map(describeTool);
}

export function getToolNamesForIntent(intent: string): AgentToolName[] {
  switch (intent) {
    case 'gmail':
      return ['gmail', 'memory'];
    case 'finance':
      return ['finance', 'gmail', 'memory'];
    case 'productivity':
    case 'planning':
      return ['calendar', 'memory', 'notes'];
    case 'coding':
      return ['file', 'web', 'memory'];
    case 'shopping':
      return ['compare', 'web', 'finance', 'memory'];
    case 'research':
      return ['web', 'memory'];
    case 'memory':
      return ['memory', 'notes'];
    case 'compare':
      return ['compare', 'web', 'memory'];
    default:
      return ['memory'];
  }
}

export function getConversationContextSnapshot(context: AgentContext): {
  memoryCount: number;
  noteCount: number;
  messageCount: number;
} {
  return {
    memoryCount: getContextMemory(context).length,
    noteCount: getContextNotes(context).length,
    messageCount: getConversationMessages(context).length,
  };
}
