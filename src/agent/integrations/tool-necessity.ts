import type { AgentIntent, AgentToolName } from '@/agent/vNext/types';

export type SourceRequirement = {
  required: boolean;
  confidence: number;
  reason: string;
};

export type ToolNecessityResult = {
  gmail: SourceRequirement;
  calendar: SourceRequirement;
  memory: SourceRequirement;
  shouldUseAnyUserSource: boolean;
};

export type ToolNecessityHints = {
  routeIntent?: AgentIntent | string;
  currentTools?: AgentToolName[];
  metadata?: Record<string, unknown>;
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

function hasAnyPattern(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

function buildRequirement(
  required: boolean,
  confidence: number,
  reason: string,
): SourceRequirement {
  return {
    required,
    confidence: clamp01(confidence),
    reason,
  };
}

function collectSemanticText(
  input: string,
  metadata: Record<string, unknown>,
): string {
  return [
    normalizeText(input),
    normalizeText(metadata.userGoal),
    normalizeText(metadata.goal),
    normalizeText(metadata.query),
    normalizeText(metadata.prompt),
    normalizeText(metadata.message),
    normalizeText(metadata.latestUserMessage),
    normalizeText(metadata.latestMessage),
    normalizeText(metadata.requestText),
    normalizeText(metadata.recentConversationSummary),
    normalizeText(metadata.summary),
  ]
    .filter(Boolean)
    .join(' ');
}

function decideGmailRequirement(
  text: string,
  routeIntent: AgentIntent | 'unknown',
  metadata: Record<string, unknown>,
): SourceRequirement {
  if (hasTruthy(metadata.gmailAction) || hasTruthy(metadata.emails) || hasTruthy(metadata.emailTask)) {
    return buildRequirement(true, 0.95, 'Metadata explicitly indicates Gmail/email work.');
  }

  if (
    hasTruthy(metadata.inboxSummary) ||
    hasTruthy(metadata.urgentEmails) ||
    hasTruthy(metadata.subscriptionSignals) ||
    hasTruthy(metadata.receipts) ||
    hasTruthy(metadata.emailWorkflow)
  ) {
    return buildRequirement(true, 0.9, 'Metadata semantics indicate inbox-specific user data is required.');
  }

  if (routeIntent === 'gmail') {
    return buildRequirement(true, 0.88, 'Top-level route intent is Gmail-specific.');
  }

  if (routeIntent === 'finance') {
    return buildRequirement(true, 0.72, 'Finance requests often depend on billing/subscription email evidence.');
  }

  const lowered = normalizeLower(text);

  const explicitInboxRequest = hasAnyPattern(lowered, [
    /\bcheck my inbox\b/i,
    /\bcheck my email\b/i,
    /\bcheck my emails\b/i,
    /\bwhat emails do i have\b/i,
    /\bwhat important emails do i have\b/i,
    /\bshow my inbox\b/i,
    /\bshow my emails\b/i,
    /\bimportant emails\b/i,
    /\burgent emails\b/i,
    /\bunread emails\b/i,
    /\binbox summary\b/i,
    /\bemail digest\b/i,
    /\bsubscription emails\b/i,
    /\bsaapuneet\b/i,
    /\bkatso sähköpost/i,
    /\bmitä sähköposteja\b/i,
    /\btärkeät sähköpost/i,
  ]);

  if (explicitInboxRequest) {
    return buildRequirement(true, 0.9, 'The user is asking for inbox-specific personal email data.');
  }

  const emailAsTopicOnly = hasAnyPattern(lowered, [
    /\bwrite an email\b/i,
    /\bhow to write an email\b/i,
    /\bhow should i write\b/i,
    /\bemail template\b/i,
    /\bgood email\b/i,
    /\bkirjoita sähköposti\b/i,
    /\bmiten kirjoittaa sähköposti\b/i,
    /\bsähköpostipohja\b/i,
  ]);

  if (emailAsTopicOnly) {
    return buildRequirement(false, 0.9, 'Email is the topic, but inbox data is not required.');
  }

  const draftHelpWithoutInboxData = hasAnyPattern(lowered, [
    /\bhelp me reply\b/i,
    /\bdraft a reply\b/i,
    /\bwrite a reply\b/i,
    /\bvastaus tähän\b/i,
    /\bauta vastaamaan\b/i,
  ]) && !hasAnyPattern(lowered, [/\bmy inbox\b/i, /\bthis email from my inbox\b/i, /\bsaapuneet\b/i]);

  if (draftHelpWithoutInboxData) {
    return buildRequirement(false, 0.72, 'Reply help can often be handled without live inbox access unless the actual email content is needed.');
  }

  return buildRequirement(false, 0.3, 'No strong evidence that Gmail user data is required.');
}

function decideCalendarRequirement(
  text: string,
  routeIntent: AgentIntent | 'unknown',
  metadata: Record<string, unknown>,
): SourceRequirement {
  if (hasTruthy(metadata.calendarAction) || hasTruthy(metadata.events) || hasTruthy(metadata.scheduleTask)) {
    return buildRequirement(true, 0.95, 'Metadata explicitly indicates Calendar/schedule work.');
  }

  if (
    hasTruthy(metadata.dayPlan) ||
    hasTruthy(metadata.timeBlock) ||
    hasTruthy(metadata.availability) ||
    hasTruthy(metadata.focusTime) ||
    hasTruthy(metadata.busyWeek) ||
    hasTruthy(metadata.weeklyReset) ||
    hasTruthy(metadata.scheduleWorkflow)
  ) {
    return buildRequirement(true, 0.9, 'Metadata semantics indicate calendar-specific schedule data is required.');
  }

  if (routeIntent === 'planning' || routeIntent === 'productivity') {
    return buildRequirement(true, 0.8, 'Planning/productivity intent often benefits from live calendar data.');
  }

  const lowered = normalizeLower(text);

  const explicitCalendarRequest = hasAnyPattern(lowered, [
    /\bwhat do i have today\b/i,
    /\bwhat is on my calendar\b/i,
    /\bwhat's on my calendar\b/i,
    /\bwhen am i free\b/i,
    /\bshow my schedule\b/i,
    /\bcheck my calendar\b/i,
    /\bfree time tomorrow\b/i,
    /\bavailability tomorrow\b/i,
    /\bcalendar today\b/i,
    /\bmitä minulla on tänään\b/i,
    /\bmitä minulla on kalenterissa\b/i,
    /\bmilloin olen vapaa\b/i,
    /\bkatso kalenteri\b/i,
    /\bvapaat ajat\b/i,
  ]);

  if (explicitCalendarRequest) {
    return buildRequirement(true, 0.92, 'The user is asking for personal schedule/calendar data.');
  }

  const scheduleAsTopicOnly = hasAnyPattern(lowered, [
    /\bhow should i plan my day\b/i,
    /\bhow to make a schedule\b/i,
    /\bhow to organize my day\b/i,
    /\bplanning tips\b/i,
    /\bmiten suunnittelen päiväni\b/i,
    /\bmiten tehdä aikataulu\b/i,
    /\bajanhallinta\b/i,
  ]);

  if (scheduleAsTopicOnly) {
    return buildRequirement(false, 0.84, 'Scheduling is the topic, but live calendar data is not clearly required.');
  }

  return buildRequirement(false, 0.3, 'No strong evidence that Calendar user data is required.');
}

function decideMemoryRequirement(
  text: string,
  routeIntent: AgentIntent | 'unknown',
  metadata: Record<string, unknown>,
): SourceRequirement {
  if (
    hasTruthy(metadata.memory) ||
    hasTruthy(metadata.memoryContext) ||
    hasTruthy(metadata.userProfile) ||
    hasTruthy(metadata.preferences) ||
    hasTruthy(metadata.personalContext) ||
    hasTruthy(metadata.priorContext) ||
    hasTruthy(metadata.historyContext)
  ) {
    return buildRequirement(true, 0.86, 'Metadata indicates memory/personal context would help.');
  }

  if (
    routeIntent === 'memory' ||
    routeIntent === 'gmail' ||
    routeIntent === 'finance' ||
    routeIntent === 'planning' ||
    routeIntent === 'productivity' ||
    routeIntent === 'shopping' ||
    routeIntent === 'compare'
  ) {
    return buildRequirement(true, 0.66, 'Intent suggests memory could improve personalization or prioritization.');
  }

  const lowered = normalizeLower(text);

  if (
    hasAnyPattern(lowered, [
      /\bfor me\b/i,
      /\bmy preferences\b/i,
      /\bmy goals\b/i,
      /\babout me\b/i,
      /\bremember\b/i,
      /\bearlier\b/i,
      /\bpreviously\b/i,
      /\bminulle\b/i,
      /\bminun\b/i,
      /\bmuista\b/i,
      /\baiemmin\b/i,
      /\btavoitteeni\b/i,
    ])
  ) {
    return buildRequirement(true, 0.8, 'The request appears to depend on personal context or prior information.');
  }

  return buildRequirement(false, 0.28, 'No strong evidence that memory is required.');
}

export function detectToolNecessity(
  input: string,
  hints: ToolNecessityHints = {},
): ToolNecessityResult {
  const metadata = asObject(hints.metadata);
  const routeIntent = normalizeIntent(hints.routeIntent);
  const semanticText = collectSemanticText(input, metadata);

  const gmail = decideGmailRequirement(semanticText, routeIntent, metadata);
  const calendar = decideCalendarRequirement(semanticText, routeIntent, metadata);
  const memory = decideMemoryRequirement(semanticText, routeIntent, metadata);

  const shouldUseAnyUserSource = gmail.required || calendar.required || memory.required;

  return {
    gmail,
    calendar,
    memory,
    shouldUseAnyUserSource,
  };
}
