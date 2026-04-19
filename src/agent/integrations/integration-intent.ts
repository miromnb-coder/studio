import type {
  CalendarAutoAction,
  GmailAutoAction,
  IntegrationIntent,
  IntegrationSource,
} from './types';
import type { AgentIntent, AgentToolName } from '@/agent/vNext/types';

export type IntegrationIntentHints = {
  routeIntent?: AgentIntent | string;
  currentTools?: AgentToolName[];
  metadata?: Record<string, unknown>;
};

type SourceSignal = {
  source: IntegrationSource;
  weight: number;
  reason: string;
};

type SourceScores = Record<IntegrationSource, number>;

function normalizeText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeLower(value: unknown): string {
  return normalizeText(value).toLowerCase();
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function hasTruthy(value: unknown): boolean {
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return Boolean(value);
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, Number(value.toFixed(2))));
}

function normalizeIntent(value: unknown): AgentIntent | 'unknown' {
  return value === 'compare' ||
    value === 'finance' ||
    value === 'planning' ||
    value === 'productivity' ||
    value === 'gmail' ||
    value === 'coding' ||
    value === 'memory' ||
    value === 'research' ||
    value === 'shopping' ||
    value === 'general' ||
    value === 'unknown'
    ? value
    : 'unknown';
}

function normalizeToolList(value: unknown): AgentToolName[] {
  if (!Array.isArray(value)) return [];

  return unique(
    value.filter(
      (item): item is AgentToolName =>
        item === 'gmail' ||
        item === 'memory' ||
        item === 'calendar' ||
        item === 'web' ||
        item === 'compare' ||
        item === 'file' ||
        item === 'finance' ||
        item === 'notes',
    ),
  );
}

function addSignal(
  bucket: Map<IntegrationSource, SourceSignal[]>,
  source: IntegrationSource,
  weight: number,
  reason: string,
) {
  const next = bucket.get(source) ?? [];
  next.push({ source, weight, reason });
  bucket.set(source, next);
}

function sumWeights(signals: SourceSignal[]): number {
  return signals.reduce((sum, signal) => sum + signal.weight, 0);
}

function collectPromptLikeText(metadata: Record<string, unknown>): string {
  const candidates = [
    metadata.userGoal,
    metadata.goal,
    metadata.query,
    metadata.prompt,
    metadata.message,
    metadata.latestUserMessage,
    metadata.latestMessage,
    metadata.requestText,
    metadata.recentConversationSummary,
    metadata.summary,
  ];

  return candidates
    .map((value) => normalizeText(value))
    .filter(Boolean)
    .join(' ');
}

function extractEntities(metadata: Record<string, unknown>): string[] {
  const raw = asArray(metadata.entities);

  return unique(
    raw
      .map((item) => normalizeText(item))
      .filter(Boolean),
  ).slice(0, 8);
}

function deriveSignalsFromTools(
  tools: AgentToolName[],
): SourceSignal[] {
  const signals: SourceSignal[] = [];

  if (tools.includes('gmail')) {
    signals.push({
      source: 'gmail',
      weight: 0.94,
      reason: 'Current tool set already includes Gmail.',
    });
  }

  if (tools.includes('calendar')) {
    signals.push({
      source: 'calendar',
      weight: 0.94,
      reason: 'Current tool set already includes Calendar.',
    });
  }

  if (tools.includes('memory')) {
    signals.push({
      source: 'memory',
      weight: 0.88,
      reason: 'Current tool set already includes Memory.',
    });
  }

  return signals;
}

function deriveSignalsFromIntent(
  intent: AgentIntent | 'unknown',
): SourceSignal[] {
  switch (intent) {
    case 'gmail':
      return [
        {
          source: 'gmail',
          weight: 0.9,
          reason: 'Top-level route intent is Gmail-specific.',
        },
        {
          source: 'memory',
          weight: 0.38,
          reason: 'Memory can improve inbox prioritization with prior context.',
        },
      ];

    case 'planning':
    case 'productivity':
      return [
        {
          source: 'calendar',
          weight: 0.84,
          reason: 'Planning/productivity intent strongly suggests calendar context.',
        },
        {
          source: 'memory',
          weight: 0.42,
          reason: 'Memory can improve planning using prior preferences and context.',
        },
      ];

    case 'finance':
      return [
        {
          source: 'gmail',
          weight: 0.68,
          reason: 'Finance intent often benefits from subscription and billing email signals.',
        },
        {
          source: 'memory',
          weight: 0.4,
          reason: 'Memory can improve financial advice with historical preferences.',
        },
      ];

    case 'memory':
      return [
        {
          source: 'memory',
          weight: 0.92,
          reason: 'Top-level route intent is explicitly memory-oriented.',
        },
      ];

    default:
      return [];
  }
}

function deriveSignalsFromMetadata(
  metadata: Record<string, unknown>,
): SourceSignal[] {
  const signals: SourceSignal[] = [];

  if (hasTruthy(metadata.gmailAction) || hasTruthy(metadata.emails)) {
    signals.push({
      source: 'gmail',
      weight: 0.84,
      reason: 'Metadata already contains Gmail-specific action or email payload.',
    });
  }

  if (hasTruthy(metadata.calendarAction) || hasTruthy(metadata.events)) {
    signals.push({
      source: 'calendar',
      weight: 0.84,
      reason: 'Metadata already contains Calendar-specific action or event payload.',
    });
  }

  if (hasTruthy(metadata.memory) || hasTruthy(metadata.memoryContext)) {
    signals.push({
      source: 'memory',
      weight: 0.8,
      reason: 'Metadata already contains memory context.',
    });
  }

  const sourceHints = normalizeToolList(metadata.requiresTools);
  for (const signal of deriveSignalsFromTools(sourceHints)) {
    signals.push({
      ...signal,
      weight: Math.max(0.72, signal.weight - 0.1),
      reason: `Metadata requiresTools suggests ${signal.source}.`,
    });
  }

  return signals;
}

function deriveSignalsFromSemanticMetadata(
  metadata: Record<string, unknown>,
): SourceSignal[] {
  const signals: SourceSignal[] = [];

  const emailish =
    hasTruthy(metadata.emailTask) ||
    hasTruthy(metadata.inboxTask) ||
    hasTruthy(metadata.inboxSummary) ||
    hasTruthy(metadata.urgentEmails) ||
    hasTruthy(metadata.subscriptionSignals) ||
    hasTruthy(metadata.receipts) ||
    hasTruthy(metadata.draftEmail) ||
    hasTruthy(metadata.emailWorkflow);

  if (emailish) {
    signals.push({
      source: 'gmail',
      weight: 0.8,
      reason: 'Metadata semantics indicate inbox/email work.',
    });
  }

  const calendarish =
    hasTruthy(metadata.scheduleTask) ||
    hasTruthy(metadata.dayPlan) ||
    hasTruthy(metadata.timeBlock) ||
    hasTruthy(metadata.availability) ||
    hasTruthy(metadata.focusTime) ||
    hasTruthy(metadata.busyWeek) ||
    hasTruthy(metadata.weeklyReset) ||
    hasTruthy(metadata.scheduleWorkflow);

  if (calendarish) {
    signals.push({
      source: 'calendar',
      weight: 0.8,
      reason: 'Metadata semantics indicate schedule/time planning work.',
    });
  }

  const memoryish =
    hasTruthy(metadata.userProfile) ||
    hasTruthy(metadata.preferences) ||
    hasTruthy(metadata.personalContext) ||
    hasTruthy(metadata.priorContext) ||
    hasTruthy(metadata.historyContext);

  if (memoryish) {
    signals.push({
      source: 'memory',
      weight: 0.74,
      reason: 'Metadata semantics indicate personal context or memory relevance.',
    });
  }

  return signals;
}

function minimalFallbackTextSignal(input: string): SourceSignal[] {
  const lowered = normalizeLower(input);
  if (!lowered) return [];

  const signals: SourceSignal[] = [];

  // Keep this intentionally tiny. These are explicit product/source references,
  // not multilingual keyword routing.
  if (lowered.includes('gmail') || lowered.includes('inbox')) {
    signals.push({
      source: 'gmail',
      weight: 0.34,
      reason: 'Fallback matched explicit product/source name for Gmail.',
    });
  }

  if (lowered.includes('calendar')) {
    signals.push({
      source: 'calendar',
      weight: 0.34,
      reason: 'Fallback matched explicit product/source name for Calendar.',
    });
  }

  if (lowered.includes('memory')) {
    signals.push({
      source: 'memory',
      weight: 0.34,
      reason: 'Fallback matched explicit product/source name for Memory.',
    });
  }

  return signals;
}

function buildSourceScores(signals: SourceSignal[]): SourceScores {
  const bucket = new Map<IntegrationSource, SourceSignal[]>();

  for (const signal of signals) {
    addSignal(bucket, signal.source, signal.weight, signal.reason);
  }

  return {
    gmail: sumWeights(bucket.get('gmail') ?? []),
    calendar: sumWeights(bucket.get('calendar') ?? []),
    memory: sumWeights(bucket.get('memory') ?? []),
  };
}

function resolvePrimarySources(scores: SourceScores): IntegrationSource[] {
  const entries = (Object.entries(scores) as Array<[IntegrationSource, number]>)
    .filter(([, score]) => score > 0.36)
    .sort((a, b) => b[1] - a[1]);

  if (!entries.length) return [];

  const strongest = entries[0][1];
  const selected = entries.filter(([, score]) => score >= strongest - 0.18);

  return selected.map(([source]) => source);
}

function shouldCombineSources(
  sources: IntegrationSource[],
  scores: SourceScores,
): boolean {
  if (sources.length <= 1) return false;

  const gmailScore = scores.gmail;
  const calendarScore = scores.calendar;
  const memoryScore = scores.memory;

  if (sources.includes('memory') && (sources.includes('gmail') || sources.includes('calendar'))) {
    return memoryScore >= 0.4;
  }

  if (sources.includes('gmail') && sources.includes('calendar')) {
    return Math.min(gmailScore, calendarScore) >= 0.62;
  }

  return true;
}

function computeConfidence(
  selectedSources: IntegrationSource[],
  scores: SourceScores,
): number {
  if (!selectedSources.length) return 0.18;

  const selectedScores = selectedSources
    .map((source) => scores[source])
    .sort((a, b) => b - a);

  const topScore = selectedScores[0] ?? 0;
  const secondaryScore = selectedScores[1] ?? 0;

  if (selectedSources.length === 1) {
    if (topScore >= 1.5) return 0.95;
    if (topScore >= 1.05) return 0.88;
    if (topScore >= 0.78) return 0.8;
    if (topScore >= 0.52) return 0.68;
    return 0.56;
  }

  if (topScore >= 1.2 && secondaryScore >= 0.62) return 0.9;
  if (topScore >= 0.9 && secondaryScore >= 0.46) return 0.82;
  return 0.72;
}

function buildReason(
  routeIntent: AgentIntent | 'unknown',
  selectedSources: IntegrationSource[],
  allSignals: SourceSignal[],
): string {
  if (!selectedSources.length) {
    return `No strong integration source was inferred for ${routeIntent}.`;
  }

  const sourceReasons = selectedSources.map((source) => {
    const relevant = allSignals
      .filter((signal) => signal.source === source)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 2)
      .map((signal) => signal.reason);

    return `${source}: ${relevant.join(' ')}`;
  });

  return `Integration routing for ${routeIntent} selected ${selectedSources.join(
    ', ',
  )}. ${sourceReasons.join(' ')}`;
}

function resolveGmailAction(
  hints: IntegrationIntentHints,
  selectedSources: IntegrationSource[],
  sourceScores: SourceScores,
): GmailAutoAction | undefined {
  if (!selectedSources.includes('gmail')) return undefined;

  const metadata = asObject(hints.metadata);
  const explicit = normalizeLower(metadata.gmailAction);

  if (
    explicit === 'inbox_summary' ||
    explicit === 'urgent' ||
    explicit === 'subscriptions' ||
    explicit === 'digest'
  ) {
    return explicit;
  }

  const routeIntent = normalizeIntent(hints.routeIntent);

  if (routeIntent === 'finance') return 'subscriptions';
  if (routeIntent === 'gmail') return 'inbox_summary';

  if (routeIntent === 'planning' || routeIntent === 'productivity') {
    return sourceScores.gmail >= 0.72 ? 'digest' : 'inbox_summary';
  }

  return 'inbox_summary';
}

function resolveCalendarAction(
  hints: IntegrationIntentHints,
  selectedSources: IntegrationSource[],
  sourceScores: SourceScores,
): CalendarAutoAction | undefined {
  if (!selectedSources.includes('calendar')) return undefined;

  const metadata = asObject(hints.metadata);
  const explicit = normalizeLower(metadata.calendarAction);

  if (
    explicit === 'today_plan' ||
    explicit === 'find_focus_time' ||
    explicit === 'check_busy_week' ||
    explicit === 'weekly_reset'
  ) {
    return explicit;
  }

  const routeIntent = normalizeIntent(hints.routeIntent);

  if (routeIntent === 'planning' || routeIntent === 'productivity') {
    return sourceScores.calendar >= 0.84 ? 'today_plan' : 'find_focus_time';
  }

  return 'today_plan';
}

export function detectIntegrationIntent(
  input: string,
  hints: IntegrationIntentHints = {},
): IntegrationIntent {
  const routeIntent = normalizeIntent(hints.routeIntent);
  const currentTools = normalizeToolList(hints.currentTools);
  const metadata = asObject(hints.metadata);

  const semanticText = [
    normalizeText(input),
    collectPromptLikeText(metadata),
    extractEntities(metadata).join(' '),
  ]
    .filter(Boolean)
    .join(' ');

  const allSignals: SourceSignal[] = [
    ...deriveSignalsFromTools(currentTools),
    ...deriveSignalsFromIntent(routeIntent),
    ...deriveSignalsFromMetadata(metadata),
    ...deriveSignalsFromSemanticMetadata(metadata),
    ...minimalFallbackTextSignal(semanticText),
  ];

  const sourceScores = buildSourceScores(allSignals);
  const sources = resolvePrimarySources(sourceScores);
  const combineSources = shouldCombineSources(sources, sourceScores);
  const confidence = computeConfidence(sources, sourceScores);

  return {
    sources,
    confidence: clamp01(confidence),
    reason: buildReason(routeIntent, sources, allSignals),
    gmailAction: resolveGmailAction(hints, sources, sourceScores),
    calendarAction: resolveCalendarAction(hints, sources, sourceScores),
    combineSources,
  };
}
