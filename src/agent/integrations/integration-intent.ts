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

function normalizeText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim();
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function hasTruthy(value: unknown): boolean {
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return Boolean(value);
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

function resolveGmailAction(hints: IntegrationIntentHints): GmailAutoAction {
  const metadata = asObject(hints.metadata);
  const explicit = normalizeText(metadata.gmailAction).toLowerCase();

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
  if (routeIntent === 'planning' || routeIntent === 'productivity') return 'digest';
  return 'inbox_summary';
}

function resolveCalendarAction(hints: IntegrationIntentHints): CalendarAutoAction {
  const metadata = asObject(hints.metadata);
  const explicit = normalizeText(metadata.calendarAction).toLowerCase();

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
    return 'today_plan';
  }

  return 'today_plan';
}

function deriveSourcesFromTools(tools: AgentToolName[]): IntegrationSource[] {
  const sources: IntegrationSource[] = [];

  if (tools.includes('gmail')) sources.push('gmail');
  if (tools.includes('calendar')) sources.push('calendar');
  if (tools.includes('memory')) sources.push('memory');

  return unique(sources);
}

function deriveSourcesFromIntent(intent: AgentIntent | 'unknown'): IntegrationSource[] {
  switch (intent) {
    case 'gmail':
      return ['gmail', 'memory'];
    case 'planning':
    case 'productivity':
      return ['calendar', 'memory'];
    case 'memory':
      return ['memory'];
    case 'finance':
      return ['gmail', 'memory'];
    default:
      return [];
  }
}

function deriveSourcesFromMetadata(metadata: Record<string, unknown>): IntegrationSource[] {
  const sources: IntegrationSource[] = [];

  if (hasTruthy(metadata.gmailAction) || hasTruthy(metadata.emails)) {
    sources.push('gmail');
  }

  if (hasTruthy(metadata.calendarAction) || hasTruthy(metadata.events)) {
    sources.push('calendar');
  }

  if (hasTruthy(metadata.memory) || hasTruthy(metadata.memoryContext)) {
    sources.push('memory');
  }

  const sourceHints = normalizeToolList(metadata.requiresTools);
  return unique([...sources, ...deriveSourcesFromTools(sourceHints)]);
}

function buildReason(sources: IntegrationSource[], routeIntent: AgentIntent | 'unknown'): string {
  if (!sources.length) {
    return 'No integration-specific context was strongly indicated.';
  }

  if (sources.length > 1) {
    return `Intent-driven integration routing selected ${sources.join(', ')} for ${routeIntent}.`;
  }

  return `Intent-driven integration routing selected ${sources[0]} for ${routeIntent}.`;
}

function fallbackTextSignal(input: string): IntegrationSource[] {
  const text = normalizeText(input);
  if (!text) return [];

  const lowered = text.toLowerCase();
  const sources: IntegrationSource[] = [];

  // Minimal, non-language-list fallback for obvious product/tool names only.
  if (lowered.includes('gmail') || lowered.includes('inbox')) {
    sources.push('gmail');
  }

  if (lowered.includes('calendar')) {
    sources.push('calendar');
  }

  if (lowered.includes('memory')) {
    sources.push('memory');
  }

  return unique(sources);
}

export function detectIntegrationIntent(
  input: string,
  hints: IntegrationIntentHints = {},
): IntegrationIntent {
  const routeIntent = normalizeIntent(hints.routeIntent);
  const currentTools = normalizeToolList(hints.currentTools);
  const metadata = asObject(hints.metadata);

  const fromTools = deriveSourcesFromTools(currentTools);
  const fromIntent = deriveSourcesFromIntent(routeIntent);
  const fromMetadata = deriveSourcesFromMetadata(metadata);
  const fromFallbackText = fallbackTextSignal(input);

  const sources = unique([
    ...fromTools,
    ...fromIntent,
    ...fromMetadata,
    ...fromFallbackText,
  ]);

  const combineSources =
    sources.length > 1 ||
    (sources.includes('memory') && (sources.includes('gmail') || sources.includes('calendar')));

  let confidence = 0.2;

  if (fromTools.length) confidence = 0.9;
  else if (fromIntent.length) confidence = 0.82;
  else if (fromMetadata.length) confidence = 0.76;
  else if (fromFallbackText.length) confidence = 0.55;

  return {
    sources,
    confidence,
    reason: buildReason(sources, routeIntent),
    gmailAction: sources.includes('gmail') ? resolveGmailAction(hints) : undefined,
    calendarAction: sources.includes('calendar') ? resolveCalendarAction(hints) : undefined,
    combineSources,
  };
}
