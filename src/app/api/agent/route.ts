import { NextResponse } from 'next/server';
import { runAgentVNext } from '@/agent/vNext/orchestrator';
import type { AgentResponse } from '@/types/agent-response';
import type {
  OperatorAction,
  OperatorActionKind,
  OperatorResponse,
} from '@/types/operator-response';
import {
  normalizeFinanceAnalysis,
  runFinanceAction,
  safeFinanceActionFallback,
} from '@/lib/finance/normalize';
import type { FinanceActionType } from '@/lib/finance/types';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import {
  getUserProfileIntelligence,
  updateUserProfileIntelligence,
} from '@/lib/operator/personalization';
import type { OperatorAlertType } from '@/lib/operator/alerts';
import { fetchRelevantUserMemory } from '@/agent/memory-store';
import {
  extractMemoryCandidates,
  inferRelevantCategories,
  persistPersonalMemoryCandidates,
} from '@/lib/memory/personal-memory';
import { resolveResponseMode } from '@/agent/mode/resolve-response-mode';
import type { ResponseMode } from '@/agent/types/response-mode';
import { fetchRecentRecommendationOutcomes } from '@/lib/operator/outcomes';
import {
  getUserPlanAndUsage,
  incrementUsage,
  isAdminBypass,
  isDevUnlimitedMode,
  PLAN_LIMITS,
  toUsageEnvelope,
  getUserBonusAgentRuns,
  consumeOneBonusAgentRun,
} from '@/lib/usage/usage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const SAFE_AGENT_FALLBACK: AgentResponse = {
  reply: 'I ran into an issue, but here’s what I could analyze so far.',
  metadata: {
    intent: 'general',
    mode: 'general',
    responseMode: 'fallback',
    plan: 'Partial fallback',
    steps: [],
    structuredData: null,
    operatorResponse: {
      answer: 'I ran into an issue, but here’s what I could analyze so far.',
      nextStep: 'Retry your request in one clear sentence.',
    },
    suggestedActions: [],
    memoryUsed: false,
    verificationPassed: false,
    iterationCount: 0,
  },
  operatorResponse: {
    answer: 'I ran into an issue, but here’s what I could analyze so far.',
    nextStep: 'Retry your request in one clear sentence.',
  },
};

type IncomingAttachment = {
  id?: string;
  name?: string;
  kind?: 'image' | 'file';
  mimeType?: string;
  size?: number;
};

type NormalizedAttachment = {
  id: string;
  name: string;
  kind: 'image' | 'file';
  mimeType?: string;
  size?: number;
};

type AgentRouteInput = {
  input: string;
  userId: string;
  history: Array<{ role: string; content: string }>;
  memory?: Record<string, unknown> | null;
  operatorAlerts?: unknown[];
  outcomes?: unknown[];
  userProfileIntelligence?: Record<string, unknown> | null;
  productState?: Record<string, unknown>;
  attachments?: NormalizedAttachment[];
};

type CompatibleAgentResponse = {
  reply: string;
  metadata?: Record<string, any>;
  operatorResponse?: OperatorResponse;
};

function safeJsonResponse(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status });
}

function parseActionType(raw: unknown): FinanceActionType | null {
  if (
    raw === 'create_savings_plan' ||
    raw === 'find_alternatives' ||
    raw === 'draft_cancellation'
  ) {
    return raw;
  }
  return null;
}

function normalizeAttachments(raw: unknown): NormalizedAttachment[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((item): item is IncomingAttachment => {
      return Boolean(item && typeof item === 'object');
    })
    .map((item, index) => {
      const kind = item.kind === 'image' ? 'image' : 'file';

      return {
        id:
          typeof item.id === 'string' && item.id.trim().length > 0
            ? item.id
            : `attachment-${index + 1}`,
        name:
          typeof item.name === 'string' && item.name.trim().length > 0
            ? item.name
            : kind === 'image'
              ? `image-${index + 1}`
              : `file-${index + 1}`,
        kind,
        mimeType:
          typeof item.mimeType === 'string' ? item.mimeType : undefined,
        size:
          typeof item.size === 'number' && Number.isFinite(item.size)
            ? item.size
            : undefined,
      };
    });
}

function shouldUseOperatorAlertsContext(input: string): boolean {
  const normalized = input.toLowerCase();
  const explicitPhrases = [
    'what should i do next',
    'any issues',
    'anything important',
    'how can i save',
    'what looks risky',
    'what changed',
    'what should i cancel',
    'deserves attention',
    'mitä minun pitäisi tehdä seuraavaksi',
    'mita minun pitaisi tehda seuraavaksi',
    'onko jotain tärkeää',
    'onko jotain tarkeaa',
    'miten voin säästää',
    'miten voin saastaa',
    'mikä näyttää riskiltä',
    'mika nayttaa riskilta',
    'mitä minun kannattaa peruuttaa',
    'mita minun kannattaa peruuttaa',
    'mitä minun pitäisi priorisoida',
    'mita minun pitaisi priorisoida',
    'onko riskejä',
    'onko riskeja',
    'what should i prioritize',
    'do i have any risks',
  ];
  const semanticSignals =
    /\b(subscription|billing|spend|finance|save|cancel|risk|priority|attention|raha|sääst|saast|tilaus|lasku|kulu|talous|priorisoi|riski)\b/i;
  return (
    explicitPhrases.some((phrase) => normalized.includes(phrase)) ||
    semanticSignals.test(normalized)
  );
}

type OperatorAlertContextRow = {
  id: string;
  user_id: string;
  type: OperatorAlertType;
  severity: 'low' | 'medium' | 'high';
  status: 'active' | 'dismissed' | 'completed';
  title: string;
  summary: string;
  suggested_action: string;
  source: string;
  dedupe_key: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

function resolveGmailConnected(params: {
  userProfile?: Record<string, unknown> | null;
}): boolean {
  return Boolean(params.userProfile?.gmail_connected);
}

function resolveCalendarConnected(params: {
  userProfile?: Record<string, unknown> | null;
}): boolean {
  return Boolean(params.userProfile?.google_calendar_connected);
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {};
}

function asArrayOfObjects(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value)
    ? value.filter(
        (item): item is Record<string, unknown> =>
          !!item && typeof item === 'object',
      )
    : [];
}

function toOperatorActionKind(value: unknown): OperatorActionKind {
  if (
    value === 'finance' ||
    value === 'general' ||
    value === 'planning' ||
    value === 'prioritization' ||
    value === 'comparison' ||
    value === 'execution' ||
    value === 'productivity' ||
    value === 'gmail' ||
    value === 'premium'
  ) {
    return value === 'gmail' ? 'message' : value;
  }
  return 'follow_up';
}

function pickFirstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return undefined;
}

function buildDefaultActions(params: {
  intent?: unknown;
  answer: string;
  nextStep?: string;
  opportunity?: string;
}): OperatorAction[] {
  const intent = typeof params.intent === 'string' ? params.intent : 'general';
  const continuation = [params.nextStep, params.opportunity, params.answer]
    .filter((item): item is string => Boolean(item && item.trim().length > 0))
    .join(' ')
    .slice(0, 220);
  const withContext = (label: string) =>
    continuation
      ? `Continue from this context: "${continuation}". ${label}`
      : label;

  if (intent === 'finance') {
    return [
      {
        id: 'build-savings-plan',
        label: 'Build savings plan',
        kind: 'finance',
        behavior: 'enqueue_prompt',
        prompt: withContext(
          'Build a concrete 30-day savings plan with weekly targets and exact amounts.',
        ),
      },
      {
        id: 'analyze-subscriptions',
        label: 'Analyze subscriptions',
        kind: 'comparison',
        behavior: 'navigate',
        route: '/money-saver',
        prompt: withContext(
          'Analyze subscription leaks and rank what to cancel, downgrade, or keep.',
        ),
      },
      {
        id: 'compare-alternatives',
        label: 'Compare alternatives',
        kind: 'comparison',
        behavior: 'enqueue_prompt',
        prompt: withContext(
          'Compare lower-cost alternatives and recommend the highest-value switch.',
        ),
      },
    ];
  }

  if (intent === 'planning' || intent === 'productivity') {
    return [
      {
        id: 'build-weekly-plan',
        label: 'Build weekly plan',
        kind: 'planning',
        behavior: 'enqueue_prompt',
        prompt: withContext(
          'Turn this into a realistic weekly plan with daily focus blocks.',
        ),
      },
      {
        id: 'prioritize-tasks',
        label: 'Prioritize tasks',
        kind: 'prioritization',
        behavior: 'enqueue_prompt',
        prompt: withContext(
          'Prioritize this into must-do, should-do, and can-wait with reasoning.',
        ),
      },
      {
        id: 'turn-into-checklist',
        label: 'Turn into checklist',
        kind: 'execution',
        behavior: 'enqueue_prompt',
        prompt: withContext(
          'Convert this into an execution checklist with the first task to start now.',
        ),
      },
    ];
  }

  if (intent === 'compare' || intent === 'decision') {
    return [
      {
        id: 'compare-options',
        label: 'Compare options',
        kind: 'comparison',
        behavior: 'enqueue_prompt',
        prompt: withContext(
          'Compare the best options side by side by impact, cost, and effort.',
        ),
      },
      {
        id: 'list-risks',
        label: 'List risks',
        kind: 'decision',
        behavior: 'enqueue_prompt',
        prompt: withContext(
          'List key risks and mitigation steps before making the decision.',
        ),
      },
      {
        id: 'recommend-best-choice',
        label: 'Recommend best choice',
        kind: 'decision',
        behavior: 'enqueue_prompt',
        prompt: withContext(
          'Recommend the best option and explain why it wins right now.',
        ),
      },
    ];
  }

  return [
    {
      id: 'next-best-move',
      label: 'Next best move',
      kind: 'execution',
      behavior: 'enqueue_prompt',
      prompt: withContext(
        'Give me the single best next move and how to execute it immediately.',
      ),
    },
    {
      id: 'make-it-actionable',
      label: 'Make it actionable',
      kind: 'execution',
      behavior: 'enqueue_prompt',
      prompt: withContext(
        'Turn this into concise steps I can execute in the next 15 minutes.',
      ),
    },
  ];
}

function buildOperatorResponse(params: {
  answer: string;
  metadata?: Record<string, unknown>;
  structuredData?: Record<string, unknown>;
  responseMode?: ResponseMode;
}): OperatorResponse {
  if (params.responseMode === 'casual' || params.responseMode === 'fast') {
    return {
      answer: params.answer,
    };
  }

  const metadata = params.metadata || {};
  const structuredData = params.structuredData || {};
  const suggestedActions = Array.isArray(metadata.suggestedActions)
    ? metadata.suggestedActions
    : [];
  const actions: OperatorAction[] = [];
  for (const [index, item] of suggestedActions.entries()) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    const label = pickFirstString(record.label, record.title);
    if (!label) continue;

    actions.push({
      id: pickFirstString(record.id) || `operator-action-${index + 1}`,
      label,
      kind: toOperatorActionKind(record.kind),
      behavior: pickFirstString(record.behavior) as
        | 'enqueue_prompt'
        | 'navigate'
        | 'open_flow'
        | undefined,
      prompt: pickFirstString(record.prompt),
      route: pickFirstString(record.route),
      payload:
        record.payload && typeof record.payload === 'object'
          ? (record.payload as Record<string, unknown>)
          : undefined,
    });
  }

  const operatorAlerts = Array.isArray(structuredData.operator_alerts)
    ? structuredData.operator_alerts.filter(
        (item): item is Record<string, unknown> =>
          Boolean(item && typeof item === 'object'),
      )
    : [];
  const highestPriorityAlert = operatorAlerts[0];

  const financeData =
    structuredData.finance && typeof structuredData.finance === 'object'
      ? (structuredData.finance as Record<string, unknown>)
      : null;

  const nextStep = pickFirstString(
    actions[0]?.label,
    highestPriorityAlert?.suggestedAction,
    metadata.recommendedNextStep,
    structuredData.next_step,
  );

  const decisionBrief = pickFirstString(
    structuredData.decision_brief,
    highestPriorityAlert?.title,
    highestPriorityAlert?.summary,
  );

  const opportunity = pickFirstString(
    structuredData.opportunity,
    financeData?.top_recommendation,
    financeData?.savings_summary,
    financeData?.quick_win,
  );
  const intent = pickFirstString(metadata.intent, structuredData.intent);
  const resolvedActions =
    actions.length > 0
      ? actions.slice(0, 3)
      : buildDefaultActions({
          intent,
          answer: params.answer,
          nextStep,
          opportunity,
        }).slice(0, 3);

  return {
    answer: params.answer,
    nextStep,
    actions: resolvedActions.length ? resolvedActions : undefined,
    decisionBrief,
    risk: pickFirstString(
      highestPriorityAlert?.summary,
      highestPriorityAlert?.title,
      structuredData.risk,
    ),
    opportunity,
    savingsOpportunity: pickFirstString(
      financeData?.top_recommendation,
      financeData?.savings_summary,
    ),
    timeOpportunity: pickFirstString(financeData?.quick_win),
  };
}

async function runNewAgent(
  input: AgentRouteInput,
): Promise<CompatibleAgentResponse | null> {
  const responseModeHint =
    typeof input.productState?.responseModeHint === 'string'
      ? (input.productState.responseModeHint as ResponseMode)
      : 'operator';

  const result = await runAgentVNext({
    requestId: crypto.randomUUID(),
    userId: input.userId,
    message: input.input,
    conversation: (input.history || [])
      .filter(
        (
          message,
        ): message is { role: 'system' | 'user' | 'assistant'; content: string } =>
          !!message &&
          typeof message === 'object' &&
          (message as { role?: unknown }).role !== undefined &&
          ((message as { role?: unknown }).role === 'system' ||
            (message as { role?: unknown }).role === 'user' ||
            (message as { role?: unknown }).role === 'assistant') &&
          typeof (message as { content?: unknown }).content === 'string',
      )
      .map((message, index) => ({
        id: `history-${index}`,
        role: message.role,
        content: message.content,
      })),
    metadata: {
      productState: input.productState,
      gmailConnected: Boolean(input.productState?.gmailConnected),
      calendarConnected: Boolean(input.productState?.calendarConnected),
      memory: input.memory || null,
      operatorAlerts: input.operatorAlerts || [],
      outcomes: input.outcomes || [],
      userProfileIntelligence: input.userProfileIntelligence || null,
      attachments: input.attachments || [],
      attachmentCount: input.attachments?.length || 0,
      responseModeHint,
    },
  });

  if (!result.ok || !result.response) {
    return null;
  }

  return {
    reply: result.response.answer.text,
    metadata: {
      intent: 'general',
      subtype: 'none',
      mode: 'general',
      responseMode: responseModeHint,
      goal: {
        explicitRequest: input.input,
        hiddenRequest: '',
        inferredGoal:
          result.response.route.reason || 'Provide a helpful response.',
        interpretationConfidence: 'medium',
        urgency: 'medium',
        complexityLevel: 'medium',
        blockerLevel: 'none',
        riskLevel: 'low',
        effortTolerance: 'medium',
        speedVsDepth: 'balanced',
        decisionType: 'informational',
        requestKind: 'advice',
        userConfidenceLevel: 'medium',
        horizon: 'short_term',
        preferredStyle: 'structured',
        category: 'general',
        hiddenOpportunities: [],
        clarificationNeeded: false,
        wantsImmediateNextStep: true,
        emotionalTone: 'neutral',
        inputLanguage: 'en',
        responseLanguage: 'en',
      },
      plan: result.response.plan.summary,
      planModes: ['recommend'],
      steps: result.response.plan.steps.map((step) => ({
        stepId: step.id,
        title: step.title,
        tool: 'retrieve_semantic_memory',
        status:
          step.status === 'failed'
            ? 'failed'
            : step.status === 'skipped'
              ? 'skipped'
              : 'completed',
        summary: step.description,
        input: step.input || {},
        output: {},
      })),
      structuredData: {
        route: result.response.route,
        toolResults: result.response.toolResults,
        evaluation: result.response.evaluation || null,
        attachments: input.attachments || [],
        structuredAnswer: result.response.answer.structured,
      },
      suggestedActions: [],
      memoryUsed: result.response.memory.items.length > 0,
      verificationPassed: result.response.evaluation?.passed ?? true,
      critic: {
        criticScore: result.response.evaluation?.score ?? 80,
        passed: result.response.evaluation?.passed ?? true,
        needsRewrite: false,
        qualityNotes: result.response.warnings || [],
      },
      state: 'responding',
    },
    operatorResponse: {
      answer: result.response.answer.text,
      nextStep: result.response.plan.steps[0]?.title,
      decisionBrief: result.response.plan.summary,
    },
  };
}

function inferMemorySummaryType(input: string): 'finance' | 'general' {
  return /\b(save|saving|budget|subscription|bill|expense|debt|money|finance|monthly|cost|raha|sääst|saast|budjet|tilaus|lasku|kulu|talous|ahorro|dinero|gasto|suscrip|factura|sijoit|krypt|osake)\b/i.test(
    input,
  )
    ? 'finance'
    : 'general';
}

export async function POST(req: Request) {
  const requestId =
    req.headers.get('x-kivo-request-id') || crypto.randomUUID();
  const startedAt = Date.now();

  try {
    console.info('AGENT_ROUTE_PARSE_START', { requestId });
    const body = await req.json().catch(() => ({}));
    console.info('AGENT_ROUTE_PARSE_DONE', { requestId });

    const {
      input,
      history,
      imageUri,
      userId: requestedUserId,
    } = body ?? {};
    const attachments = normalizeAttachments(body?.attachments);
    const actionType = parseActionType(body?.actionType);

    const safeHistory = (history || [])
      .filter(
        (m: any) =>
          m && typeof m.content === 'string' && m.content.trim().length > 0,
      )
      .map((m: any) => ({
        role: m.role || 'user',
        content: m.content.trim(),
      }));

    const safeInput =
      typeof input === 'string' && input.trim().length > 0
        ? input.trim()
        : imageUri
          ? '[Analyze visual data]'
          : attachments.length > 0
            ? '[Analyze attachments]'
            : null;

    if (!safeInput && safeHistory.length === 0 && attachments.length === 0) {
      return safeJsonResponse({ error: 'No valid content provided.' }, 400);
    }

    const supabase = await createSupabaseServerClient().catch((error) => {
      console.error('SUPABASE_SERVER_CLIENT_ERROR:', error);
      return null;
    });

    if (!supabase) {
      console.error('SUPABASE_UNAVAILABLE', { requestId });
      return safeJsonResponse(SAFE_AGENT_FALLBACK);
    }

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error('AGENT_ROUTE_AUTH_ERROR', {
        requestId,
        error: authError,
      });
      return safeJsonResponse(
        {
          error: 'AUTH_REQUIRED',
          message: 'Please sign in to use chat.',
        },
        401,
      );
    }

    const userId = authUser?.id;
    if (!userId || userId === 'system_anonymous') {
      return safeJsonResponse(
        {
          error: 'AUTH_REQUIRED',
          message: 'Please sign in to use chat.',
        },
        401,
      );
    }

    let operatorAlertsContext: OperatorAlertContextRow[] = [];
    if (shouldUseOperatorAlertsContext(String(safeInput || ''))) {
      const operatorAlertRes = await supabase
        .from('operator_alerts')
        .select(
          'id,user_id,type,severity,status,title,summary,suggested_action,source,dedupe_key,metadata,created_at,updated_at',
        )
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(5);

      if (operatorAlertRes.error) {
        console.error('OPERATOR_ALERT_ERROR', {
          action: 'agent_context_fetch',
          userId,
          error: operatorAlertRes.error.message,
        });
      } else {
        operatorAlertsContext =
          (operatorAlertRes.data || []) as OperatorAlertContextRow[];
      }
    }

    if (requestedUserId && requestedUserId !== userId) {
      console.warn('AGENT_ROUTE_USER_ID_MISMATCH', {
        requestId,
        requestedUserId,
        sessionUserId: userId,
      });
    }

    const { plan, usage, email } = await getUserPlanAndUsage(
      supabase,
      userId,
    );
    const bonusAgentRuns = await getUserBonusAgentRuns(supabase, userId);

    const { data: userProfile } = await supabase
      .from('profiles')
      .select('gmail_connected')
      .eq('id', userId)
      .maybeSingle();

    const unlimitedReason = isDevUnlimitedMode()
      ? 'dev'
      : isAdminBypass(email)
        ? 'admin'
        : null;

    if (actionType && plan !== 'PREMIUM') {
      return safeJsonResponse(
        {
          error: 'premium_required',
          message: 'Finance actions require Premium plan.',
          plan,
        },
        403,
      );
    }

    const usageBeforeRun = toUsageEnvelope({ plan, usage, unlimitedReason });
    const limit = PLAN_LIMITS[plan].dailyAgentRuns;
    const hasBonusRun = bonusAgentRuns > 0;
    const overBaseLimit = usageBeforeRun.current >= limit;

    if (!usageBeforeRun.unlimited && overBaseLimit && !hasBonusRun) {
      return safeJsonResponse(
        {
          error: 'limit_reached',
          message: 'Daily agent limit reached',
          limitKey: 'daily_agent_runs',
          limitValue: usageBeforeRun.limit,
          currentValue: usageBeforeRun.current,
          usage: {
            current: usageBeforeRun.current,
            limit: usageBeforeRun.limit,
            remaining: usageBeforeRun.remaining,
            unlimited: usageBeforeRun.unlimited,
            unlimitedReason: usageBeforeRun.unlimitedReason,
          },
          bonusAgentRuns,
          plan,
        },
        402,
      );
    }

    const userProfileIntelligence = await getUserProfileIntelligence(
      supabase,
      userId,
    ).catch((error) => {
      console.error('USER_PROFILE_INTELLIGENCE_FETCH_ERROR:', error);
      return null;
    });

    const recommendationOutcomes =
      await fetchRecentRecommendationOutcomes(supabase, userId).catch(
        (error) => {
          console.error('RECOMMENDATION_OUTCOMES_FETCH_ERROR:', error);
          return [];
        },
      );

    const summaryType = inferMemorySummaryType(safeInput || 'Continue');
    const relevantMemories = await fetchRelevantUserMemory({
      supabase,
      userId,
      query: safeInput || 'Continue',
      limit: summaryType === 'finance' ? 8 : 6,
      financeOnly: summaryType === 'finance',
      preferredTypes: inferRelevantCategories(safeInput || 'Continue'),
    }).catch((error) => {
      console.error('MEMORY_RETRIEVAL_ERROR:', error);
      return [];
    });

    const { data: financeProfileData } = await supabase
      .from('finance_profiles')
      .select(
        'active_subscriptions,total_monthly_cost,estimated_savings,currency,memory_summary,last_analysis',
      )
      .eq('user_id', userId)
      .maybeSingle();

    const financeProfile = financeProfileData
      ? {
          active_subscriptions: asArrayOfObjects(
            financeProfileData.active_subscriptions,
          ),
          total_monthly_cost: financeProfileData.total_monthly_cost ?? 0,
          estimated_savings: financeProfileData.estimated_savings ?? 0,
          currency: financeProfileData.currency || 'USD',
          memory_summary: financeProfileData.memory_summary || '',
          last_analysis: asObject(financeProfileData.last_analysis),
        }
      : null;

    const memorySummary =
      relevantMemories.length > 0
        ? relevantMemories
            .slice(0, 3)
            .map((item) => item.content)
            .join(' ')
        : typeof financeProfile?.memory_summary === 'string' &&
            financeProfile.memory_summary.trim().length > 0
          ? financeProfile.memory_summary.trim()
          : 'No prior context available.';

    const memoryEnvelope = {
      summaryType,
      summary: memorySummary,
      financeProfile,
      financeEvents: [],
      semanticMemories: relevantMemories.map((item) => ({
        id: item.id,
        content: item.content,
        type: item.type,
        importance: item.importance,
        relevanceScore: item.relevanceScore || 0,
      })),
    };

    console.info('AGENT_ROUTE_ORCHESTRATOR_START', {
      requestId,
      userId,
      hasImage: Boolean(imageUri),
      attachmentCount: attachments.length,
      historyCount: safeHistory.length,
      bonusAgentRuns,
    });

    const responseMode = resolveResponseMode({
      input: safeInput || 'Continue',
      history: safeHistory,
      hasAttachments: attachments.length > 0,
      requestedActionType: actionType,
    });

    const agentInput = {
      input: safeInput || 'Continue',
      userId,
      history: safeHistory,
      memory: memoryEnvelope,
      operatorAlerts: operatorAlertsContext,
      outcomes: recommendationOutcomes,
      userProfileIntelligence,
      attachments,
      productState: {
        plan,
        usage: {
          current: usageBeforeRun.current,
          limit: usageBeforeRun.limit,
          remaining: usageBeforeRun.remaining,
          bonusAgentRuns,
        },
        gmailConnected: resolveGmailConnected({
          userProfile: (userProfile as Record<string, unknown> | null) || null,
        }),
        calendarConnected: resolveCalendarConnected({
          userProfile: (userProfile as Record<string, unknown> | null) || null,
        }),
        attachmentCount: attachments.length,
        responseModeHint: responseMode,
      },
    };

    const agentResult = await runNewAgent(agentInput);

    if (!agentResult) {
      console.error('AGENT_VNEXT_EXECUTION_ERROR:', { requestId });
      console.error('AGENT_EXECUTION_ERROR', {
        requestId,
        mode: 'vNext',
      });
      return safeJsonResponse(SAFE_AGENT_FALLBACK);
    }

    console.info('AGENT_ROUTE_ORCHESTRATOR_DONE', {
      requestId,
      ok: true,
      intent: agentResult.metadata?.intent || 'unknown',
      stepCount: agentResult.metadata?.steps?.length || 0,
    });

    const normalizedFinance = normalizeFinanceAnalysis(
      agentResult.metadata?.structuredData || {},
    );
    const shouldAttachFinance =
      agentResult.metadata?.intent === 'finance' ||
      Boolean((agentResult.metadata?.structuredData || {}).detect_leaks) ||
      Boolean(actionType);

    const operatorAlertsStructured = operatorAlertsContext.map((alert) => ({
      id: alert.id,
      severity: alert.severity,
      title: alert.title,
      summary: alert.summary,
      suggestedAction: alert.suggested_action,
      updatedAt: alert.updated_at,
    }));

    if (actionType) {
      const actionResult = runFinanceAction(actionType, normalizedFinance);
      let updatedUsage = usage;

      if (!usageBeforeRun.unlimited && overBaseLimit && hasBonusRun) {
        await consumeOneBonusAgentRun(supabase, userId);
      } else {
        updatedUsage = await incrementUsage(
          supabase,
          userId,
          usage,
          'agent',
        ).catch((error) => {
          console.error('ACTION_AGENT_USAGE_INCREMENT_ERROR:', error);
          return usage;
        });
      }

      if (actionResult.type !== 'error') {
        updatedUsage = await incrementUsage(
          supabase,
          userId,
          updatedUsage,
          'premium_action',
        ).catch((error) => {
          console.error('PREMIUM_ACTION_USAGE_INCREMENT_ERROR:', error);
          return updatedUsage;
        });
      }

      await updateUserProfileIntelligence({
        supabase,
        userId,
        userMessage: safeInput || '',
        existing: userProfileIntelligence,
      }).catch((error) => {
        console.error('USER_PROFILE_INTELLIGENCE_UPDATE_ERROR:', error);
      });

      const usageAfterRun = toUsageEnvelope({
        plan,
        usage: updatedUsage,
        unlimitedReason,
      });

      const remainingBonusAgentRuns = await getUserBonusAgentRuns(supabase, userId);

      return safeJsonResponse({
        reply: actionResult.summary,
        metadata: {
          intent: 'finance',
          responseMode: 'tool',
          plan: 'Finance follow-up action execution',
          steps: [
            {
              action: actionType,
              status:
                actionResult.type === 'error' ? 'failed' : 'completed',
              summary: actionResult.summary,
            },
          ],
          structuredData: {
            finance: normalizedFinance,
            actionResult:
              actionResult.type === 'error'
                ? safeFinanceActionFallback()
                : actionResult,
            operator_alerts: operatorAlertsStructured,
            attachments,
          },
          operatorResponse: buildOperatorResponse({
            answer: actionResult.summary,
            metadata: {
              plan: 'Finance follow-up action execution',
              suggestedActions: [],
            },
            structuredData: {
              finance: normalizedFinance as unknown as Record<string, unknown>,
              operator_alerts: operatorAlertsStructured,
            },
            responseMode: 'tool',
          }),
          memoryUsed: relevantMemories.length > 0,
          iterationCount: 1,
        },
        operatorResponse: buildOperatorResponse({
          answer: actionResult.summary,
          metadata: {
            plan: 'Finance follow-up action execution',
            suggestedActions: [],
          },
          structuredData: {
            finance: normalizedFinance as unknown as Record<string, unknown>,
            operator_alerts: operatorAlertsStructured,
          },
          responseMode: 'tool',
        }),
        usage: {
          current: usageAfterRun.current,
          limit: usageAfterRun.limit,
          remaining: usageAfterRun.remaining,
          unlimited: usageAfterRun.unlimited,
          unlimitedReason: usageAfterRun.unlimitedReason,
          bonusAgentRuns: remainingBonusAgentRuns,
        },
        plan,
      });
    }

    console.info('AGENT_ROUTE_RESPONSE_SYNTHESIS_START', { requestId });
    const reply = agentResult.reply || '';
    const memoryCandidates = extractMemoryCandidates({
      userInput: safeInput || '',
      assistantReply: reply || '',
    });
    console.info('AGENT_ROUTE_RESPONSE_SYNTHESIS_DONE', {
      requestId,
      hasReply: reply.trim().length > 0,
      memoryCandidates: memoryCandidates.length,
    });

    let updatedUsage = usage;

    if (!usageBeforeRun.unlimited && overBaseLimit && hasBonusRun) {
      await consumeOneBonusAgentRun(supabase, userId);
    } else {
      updatedUsage = await incrementUsage(
        supabase,
        userId,
        usage,
        'agent',
      ).catch((error) => {
        console.error('USAGE_INCREMENT_ERROR:', error);
        return usage;
      });
    }

    await updateUserProfileIntelligence({
      supabase,
      userId,
      userMessage: safeInput || '',
      existing: userProfileIntelligence,
    }).catch((error) => {
      console.error('USER_PROFILE_INTELLIGENCE_UPDATE_ERROR:', error);
    });

    const storedMemoryCount = await persistPersonalMemoryCandidates({
      supabase,
      userId,
      candidates: memoryCandidates,
    }).catch((error) => {
      console.error('PERSONAL_MEMORY_PERSIST_ERROR', error);
      return 0;
    });

    const usageAfterRun = toUsageEnvelope({
      plan,
      usage: updatedUsage,
      unlimitedReason,
    });

    const remainingBonusAgentRuns = await getUserBonusAgentRuns(supabase, userId);

    const payload: AgentResponse & {
      usage: {
        current: number;
        limit: number;
        remaining: number;
        unlimited: boolean;
        unlimitedReason: 'dev' | 'admin' | null;
        bonusAgentRuns: number;
      };
      plan: string;
    } = {
      reply: reply || SAFE_AGENT_FALLBACK.reply,
      metadata: {
        intent: agentResult.metadata?.intent || 'general',
        mode: agentResult.metadata?.mode || 'general',
        plan: agentResult.metadata?.plan || 'Partial fallback',
        steps: Array.isArray(agentResult.metadata?.steps)
          ? agentResult.metadata.steps.map((step) => ({
              action: step.title,
              status:
                step.status === 'failed' ? 'failed' : 'completed',
              summary:
                step.summary ||
                (step.status === 'failed'
                  ? step.error || 'Step failed.'
                  : 'Step completed.'),
              error: step.error,
            }))
          : [],
        structuredData: {
          ...(agentResult.metadata?.structuredData || {}),
          ...(agentResult.metadata?.goal
            ? { goal_understanding: agentResult.metadata.goal }
            : {}),
          ...(agentResult.metadata?.responseMode
            ? { response_mode: agentResult.metadata.responseMode }
            : {}),
          response_mode: responseMode,
          ...(shouldAttachFinance
            ? { finance: normalizedFinance }
            : {}),
          ...(operatorAlertsStructured.length
            ? { operator_alerts: operatorAlertsStructured }
            : {}),
          attachments,
          memory_diagnostics: {
            candidatesEvaluated: memoryCandidates.length,
            storedCount: storedMemoryCount,
          },
        },
        suggestedActions: agentResult.metadata?.suggestedActions || [],
        operatorResponse: buildOperatorResponse({
          answer: reply || SAFE_AGENT_FALLBACK.reply,
          metadata: {
            ...agentResult.metadata,
            plan: agentResult.metadata?.plan || 'Partial fallback',
            suggestedActions: agentResult.metadata?.suggestedActions || [],
          },
          structuredData: {
            ...(agentResult.metadata?.structuredData || {}),
            ...(shouldAttachFinance
              ? { finance: normalizedFinance as unknown as Record<string, unknown> }
              : {}),
            ...(operatorAlertsStructured.length
              ? { operator_alerts: operatorAlertsStructured }
              : {}),
          },
          responseMode,
        }),
        responseMode,
        memoryUsed:
          Boolean(agentResult.metadata?.memoryUsed) ||
          relevantMemories.length > 0,
        verificationPassed: !!agentResult.metadata?.verificationPassed,
        iterationCount: Array.isArray(agentResult.metadata?.steps)
          ? agentResult.metadata.steps.length
          : 0,
      },
      operatorResponse: buildOperatorResponse({
        answer: reply || SAFE_AGENT_FALLBACK.reply,
        metadata: {
          ...agentResult.metadata,
          plan: agentResult.metadata?.plan || 'Partial fallback',
          suggestedActions: agentResult.metadata?.suggestedActions || [],
        },
        structuredData: {
          ...(agentResult.metadata?.structuredData || {}),
          ...(shouldAttachFinance
            ? { finance: normalizedFinance as unknown as Record<string, unknown> }
            : {}),
          ...(operatorAlertsStructured.length
            ? { operator_alerts: operatorAlertsStructured }
            : {}),
        },
        responseMode,
      }),
      usage: {
        current: usageAfterRun.current,
        limit: usageAfterRun.limit,
        remaining: usageAfterRun.remaining,
        unlimited: usageAfterRun.unlimited,
        unlimitedReason: usageAfterRun.unlimitedReason,
        bonusAgentRuns: remainingBonusAgentRuns,
      },
      plan,
    };

    console.info('AGENT_ROUTE_SUCCESS', {
      requestId,
      durationMs: Date.now() - startedAt,
      intent: payload.metadata.intent,
      attachmentCount: attachments.length,
      storedMemoryCount,
      bonusAgentRuns: remainingBonusAgentRuns,
    });

    return safeJsonResponse(payload);
  } catch (error) {
    console.error('AGENT_ROUTE_ERROR', {
      requestId,
      durationMs: Date.now() - startedAt,
      error,
    });
    return safeJsonResponse(SAFE_AGENT_FALLBACK);
  }
}
