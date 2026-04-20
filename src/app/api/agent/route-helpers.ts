import { NextResponse } from 'next/server';
import type { AgentResponse } from '@/types/agent-response';
import type {
  OperatorAction,
  OperatorActionKind,
  OperatorResponse,
} from '@/types/operator-response';
import type { FinanceActionType } from '@/lib/finance/types';
import { shouldUseBrowserSearch, type BrowserSearchMode, type BrowserSearchResult } from '@/lib/browser-search/search';
import type { ResponseMode } from '@/agent/types/response-mode';

export const SAFE_AGENT_FALLBACK: AgentResponse = {
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

export type IncomingAttachment = {
  id?: string;
  name?: string;
  kind?: 'image' | 'file';
  mimeType?: string;
  size?: number;
};

export type NormalizedAttachment = {
  id: string;
  name: string;
  kind: 'image' | 'file';
  mimeType?: string;
  size?: number;
};

export type AgentRouteInput = {
  input: string;
  userId: string;
  history: Array<{ role: string; content: string }>;
  memory?: Record<string, unknown> | null;
  operatorAlerts?: unknown[];
  outcomes?: unknown[];
  userProfileIntelligence?: Record<string, unknown> | null;
  userIntelligenceSummary?: string;
  productState?: Record<string, unknown>;
  attachments?: NormalizedAttachment[];
};

export type BrowserSearchContext = {
  enabled: boolean;
  used: boolean;
  mode: BrowserSearchMode | null;
  provider: string | null;
  query: string | null;
  results: BrowserSearchResult[];
  error: string | null;
};

export type CompatibleAgentResponse = {
  reply: string;
  metadata?: Record<string, any>;
  operatorResponse?: OperatorResponse;
};

export type OperatorAlertContextRow = {
  id: string;
  user_id: string;
  type: 'spend_spike' | 'subscription_leak' | 'renewal_risk' | 'budget_breach' | 'goal_drift' | 'cashflow_risk';
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

export function safeJsonResponse(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status });
}

export function parseActionType(raw: unknown): FinanceActionType | null {
  if (
    raw === 'create_savings_plan' ||
    raw === 'find_alternatives' ||
    raw === 'draft_cancellation'
  ) {
    return raw;
  }
  return null;
}

export function normalizeAttachments(raw: unknown): NormalizedAttachment[] {
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

export function shouldUseOperatorAlertsContext(input: string): boolean {
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

export function resolveGmailConnected(params: {
  userProfile?: Record<string, unknown> | null;
}): boolean {
  return Boolean(params.userProfile?.gmail_connected);
}

export function resolveCalendarConnected(params: {
  userProfile?: Record<string, unknown> | null;
}): boolean {
  return Boolean(params.userProfile?.google_calendar_connected);
}

export function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {};
}

export function asArrayOfObjects(value: unknown): Array<Record<string, unknown>> {
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

export function buildOperatorResponse(params: {
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

export function inferMemorySummaryType(input: string): 'finance' | 'general' {
  return /\b(save|saving|budget|subscription|bill|expense|debt|money|finance|monthly|cost|raha|sääst|saast|budjet|tilaus|lasku|kulu|talous|ahorro|dinero|gasto|suscrip|factura|sijoit|krypt|osake)\b/i.test(
    input,
  )
    ? 'finance'
    : 'general';
}

export function shouldRunBrowserTool(params: {
  input: string;
  attachments: NormalizedAttachment[];
  actionType: FinanceActionType | null;
  responseMode: ResponseMode;
}) {
  if (params.attachments.length > 0) return false;
  if (params.actionType) return false;

  return (
    (params.responseMode === 'operator' ||
      params.responseMode === 'tool' ||
      params.responseMode === 'fast') &&
    shouldUseBrowserSearch(params.input)
  );
}

export function buildBrowserSuggestedActions(input: string) {
  return [
    {
      id: 'browser-search-follow-up',
      label: 'Refine browser search',
      kind: 'comparison',
      behavior: 'navigate',
      route: `/tools?tool=browser-search&q=${encodeURIComponent(input)}`,
    },
    {
      id: 'browser-search-deeper',
      label: 'Search deeper',
      kind: 'follow_up',
      behavior: 'enqueue_prompt',
      prompt: `Use browser search to go deeper on this: ${input}`,
    },
  ];
}
