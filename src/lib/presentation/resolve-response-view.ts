export type ResponseViewKind =
  | 'plain'
  | 'email'
  | 'calendar'
  | 'search'
  | 'compare'
  | 'shopping'
  | 'operator';

export type ResponseViewResolution = {
  view: ResponseViewKind;
  confidence: number;
  reason: string;
};

export type ResolveResponseViewInput = {
  text?: string | null;
  structured?: Record<string, unknown> | null;
  structuredData?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  toolResults?: Array<Record<string, unknown>> | null;
  isStreaming?: boolean;
};

type ToolSignal = {
  gmail: boolean;
  calendar: boolean;
  web: boolean;
  compare: boolean;
  finance: boolean;
};

function normalizeText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeLower(value: unknown): string {
  return normalizeText(value).toLowerCase();
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function hasTruthy(value: unknown): boolean {
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return Boolean(value);
}

function getCombinedData(input: ResolveResponseViewInput): Record<string, unknown> {
  return {
    ...asObject(input.structured),
    ...asObject(input.structuredData),
    ...asObject(input.metadata),
  };
}

function detectToolSignals(toolResults: Array<Record<string, unknown>>): ToolSignal {
  const names = toolResults
    .map((result) => normalizeLower(result.tool))
    .filter(Boolean);

  return {
    gmail: names.includes('gmail'),
    calendar: names.includes('calendar'),
    web: names.includes('web'),
    compare: names.includes('compare'),
    finance: names.includes('finance'),
  };
}

function hasEmailLikeData(data: Record<string, unknown>): boolean {
  return (
    hasTruthy(data.inboxSummary) ||
    hasTruthy(data.emailSummary) ||
    hasTruthy(data.urgentEmails) ||
    hasTruthy(data.importantEmails) ||
    hasTruthy(data.messages) ||
    hasTruthy(data.emailItems) ||
    hasTruthy(data.inboxItems) ||
    hasTruthy(data.gmail) ||
    normalizeLower(data.responseType) === 'email' ||
    normalizeLower(data.view) === 'email'
  );
}

function hasCalendarLikeData(data: Record<string, unknown>): boolean {
  return (
    hasTruthy(data.dayPlan) ||
    hasTruthy(data.calendarSummary) ||
    hasTruthy(data.events) ||
    hasTruthy(data.focusTime) ||
    hasTruthy(data.availability) ||
    hasTruthy(data.busyWeek) ||
    hasTruthy(data.weeklyReset) ||
    hasTruthy(data.calendar) ||
    normalizeLower(data.responseType) === 'calendar' ||
    normalizeLower(data.view) === 'calendar'
  );
}

function hasSearchLikeData(data: Record<string, unknown>): boolean {
  return (
    hasTruthy(data.sources) ||
    hasTruthy(data.searchResults) ||
    hasTruthy(data.resultChips) ||
    hasTruthy(data.sourceChips) ||
    hasTruthy(data.webResults) ||
    hasTruthy(data.groundedSources) ||
    normalizeLower(data.responseType) === 'search' ||
    normalizeLower(data.view) === 'search'
  );
}

function hasCompareLikeData(data: Record<string, unknown>): boolean {
  return (
    hasTruthy(data.compareRows) ||
    hasTruthy(data.compareTable) ||
    hasTruthy(data.comparison) ||
    hasTruthy(data.scorecards) ||
    hasTruthy(data.criteria) ||
    normalizeLower(data.responseType) === 'compare' ||
    normalizeLower(data.view) === 'compare'
  );
}

function hasShoppingLikeData(data: Record<string, unknown>): boolean {
  return (
    hasTruthy(data.products) ||
    hasTruthy(data.productCards) ||
    hasTruthy(data.shoppingResults) ||
    hasTruthy(data.offers) ||
    normalizeLower(data.responseType) === 'shopping' ||
    normalizeLower(data.view) === 'shopping'
  );
}

function hasOperatorLikeData(data: Record<string, unknown>): boolean {
  return (
    hasTruthy(data.operator) ||
    hasTruthy(data.nextActions) ||
    hasTruthy(data.decision) ||
    hasTruthy(data.risks) ||
    hasTruthy(data.opportunities) ||
    hasTruthy(data.strategy) ||
    normalizeLower(data.responseType) === 'operator' ||
    normalizeLower(data.view) === 'operator'
  );
}

function countMeaningfulTextSignals(text: string, patterns: RegExp[]): number {
  return patterns.reduce((sum, pattern) => sum + (pattern.test(text) ? 1 : 0), 0);
}

function pickStrongest(scored: Array<ResponseViewResolution>): ResponseViewResolution {
  return [...scored].sort((a, b) => b.confidence - a.confidence)[0] ?? {
    view: 'plain',
    confidence: 0.4,
    reason: 'Defaulted to plain view.',
  };
}

export function resolveResponseView(
  input: ResolveResponseViewInput,
): ResponseViewResolution {
  const text = normalizeText(input.text);
  const lowered = normalizeLower(text);
  const data = getCombinedData(input);
  const toolSignals = detectToolSignals(
    asArray(input.toolResults)
      .map((item) => asObject(item))
      .filter((item) => Object.keys(item).length > 0),
  );

  if (input.isStreaming) {
    return {
      view: 'plain',
      confidence: 0.98,
      reason: 'Streaming responses default to plain view to prevent layout jumping.',
    };
  }

  const scores: Array<ResponseViewResolution> = [];

  if (hasEmailLikeData(data) || toolSignals.gmail) {
    scores.push({
      view: 'email',
      confidence: hasEmailLikeData(data) ? 0.96 : 0.82,
      reason: hasEmailLikeData(data)
        ? 'Email-specific structured data was detected.'
        : 'Gmail tool results were detected.',
    });
  }

  if (hasCalendarLikeData(data) || toolSignals.calendar) {
    scores.push({
      view: 'calendar',
      confidence: hasCalendarLikeData(data) ? 0.95 : 0.8,
      reason: hasCalendarLikeData(data)
        ? 'Calendar-specific structured data was detected.'
        : 'Calendar tool results were detected.',
    });
  }

  if (hasShoppingLikeData(data)) {
    scores.push({
      view: 'shopping',
      confidence: 0.97,
      reason: 'Product/shopping structured data was detected.',
    });
  }

  if (hasCompareLikeData(data) || toolSignals.compare) {
    scores.push({
      view: 'compare',
      confidence: hasCompareLikeData(data) ? 0.95 : 0.84,
      reason: hasCompareLikeData(data)
        ? 'Comparison structured data was detected.'
        : 'Compare tool results were detected.',
    });
  }

  if (hasSearchLikeData(data) || toolSignals.web) {
    scores.push({
      view: 'search',
      confidence: hasSearchLikeData(data) ? 0.92 : 0.78,
      reason: hasSearchLikeData(data)
        ? 'Search/source structured data was detected.'
        : 'Web/search tool results were detected.',
    });
  }

  if (hasOperatorLikeData(data) || toolSignals.finance) {
    scores.push({
      view: 'operator',
      confidence: hasOperatorLikeData(data) ? 0.9 : 0.72,
      reason: hasOperatorLikeData(data)
        ? 'Operator/decision structured data was detected.'
        : 'Finance/operator-like tool results were detected.',
    });
  }

  const emailTopicOnlyScore = countMeaningfulTextSignals(lowered, [
    /\bemail\b/i,
    /\binbox\b/i,
    /\bgmail\b/i,
    /\bsähköposti\b/i,
  ]);

  const calendarTopicOnlyScore = countMeaningfulTextSignals(lowered, [
    /\bcalendar\b/i,
    /\bschedule\b/i,
    /\bavailability\b/i,
    /\bkalenteri\b/i,
    /\baikataulu\b/i,
  ]);

  if (!scores.length && emailTopicOnlyScore >= 2) {
    scores.push({
      view: 'email',
      confidence: 0.7,
      reason: 'The response text appears strongly email-oriented.',
    });
  }

  if (!scores.length && calendarTopicOnlyScore >= 2) {
    scores.push({
      view: 'calendar',
      confidence: 0.7,
      reason: 'The response text appears strongly calendar-oriented.',
    });
  }

  // Strong guardrail: email/calendar answers should not accidentally degrade
  // into search/compare layouts just because generic sources/rows exist.
  const strongest = pickStrongest(scores);

  if (
    strongest.view === 'email' &&
    (hasSearchLikeData(data) || hasCompareLikeData(data))
  ) {
    return {
      view: 'email',
      confidence: Math.max(strongest.confidence, 0.96),
      reason: 'Email view was locked because email answers should not fall through into search/compare layouts.',
    };
  }

  if (
    strongest.view === 'calendar' &&
    (hasSearchLikeData(data) || hasCompareLikeData(data))
  ) {
    return {
      view: 'calendar',
      confidence: Math.max(strongest.confidence, 0.95),
      reason: 'Calendar view was locked because schedule answers should not fall through into search/compare layouts.',
    };
  }

  if (scores.length) {
    return strongest;
  }

  return {
    view: 'plain',
    confidence: 0.88,
    reason: 'No specialized response layout was strongly indicated.',
  };
}
