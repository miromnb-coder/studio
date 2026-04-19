import { detectIntegrationIntent, type IntegrationIntentHints } from './integration-intent';
import { detectToolNecessity } from './tool-necessity';
import type { AgentIntent, AgentToolName } from '@/agent/vNext/types';

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function hasTool(tools: AgentToolName[], tool: AgentToolName): boolean {
  return tools.includes(tool);
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

function addIfMissing(tools: AgentToolName[], tool: AgentToolName): AgentToolName[] {
  return hasTool(tools, tool) ? tools : [...tools, tool];
}

function ensureMemoryWhenHelpful(
  tools: AgentToolName[],
  routeIntent: AgentIntent | 'unknown',
): AgentToolName[] {
  if (hasTool(tools, 'memory')) return tools;

  if (
    routeIntent === 'gmail' ||
    routeIntent === 'finance' ||
    routeIntent === 'planning' ||
    routeIntent === 'productivity' ||
    routeIntent === 'memory' ||
    routeIntent === 'compare' ||
    routeIntent === 'shopping'
  ) {
    return [...tools, 'memory'];
  }

  return tools;
}

function enrichWithIntentTools(
  tools: AgentToolName[],
  routeIntent: AgentIntent | 'unknown',
): AgentToolName[] {
  let next = [...tools];

  if (routeIntent === 'finance') {
    next = addIfMissing(next, 'finance');
  }

  if (routeIntent === 'research') {
    next = addIfMissing(next, 'web');
  }

  if (routeIntent === 'shopping') {
    next = addIfMissing(next, 'web');
    next = addIfMissing(next, 'compare');
  }

  if (routeIntent === 'compare') {
    next = addIfMissing(next, 'compare');
    next = addIfMissing(next, 'web');
  }

  if (routeIntent === 'coding') {
    next = addIfMissing(next, 'file');
    next = addIfMissing(next, 'web');
  }

  if (routeIntent === 'memory') {
    next = addIfMissing(next, 'notes');
  }

  if (routeIntent === 'planning' || routeIntent === 'productivity') {
    next = addIfMissing(next, 'notes');
  }

  return next;
}

export function resolveRequiredTools(
  message: string,
  currentTools: AgentToolName[],
  hints: IntegrationIntentHints = {},
): AgentToolName[] {
  const routeIntent = normalizeIntent(hints.routeIntent);

  const detected = detectIntegrationIntent(message, {
    ...hints,
    routeIntent,
    currentTools,
  });

  const necessity = detectToolNecessity(message, {
    routeIntent,
    currentTools,
    metadata: hints.metadata,
  });

  let next = [...currentTools];

  // Only force user-owned sources when the new necessity layer says they are actually needed.
  if (necessity.gmail.required) {
    next = addIfMissing(next, 'gmail');
  }

  if (necessity.calendar.required) {
    next = addIfMissing(next, 'calendar');
  }

  if (necessity.memory.required) {
    next = addIfMissing(next, 'memory');
  }

  // Integration intent still helps when the request is clearly in that source domain.
  // But do not aggressively add Gmail/Calendar just because the topic is related.
  for (const source of detected.sources) {
    if (source === 'memory' && necessity.memory.required) {
      next = addIfMissing(next, 'memory');
    }
  }

  next = ensureMemoryWhenHelpful(next, routeIntent);
  next = enrichWithIntentTools(next, routeIntent);

  if (
    detected.combineSources &&
    necessity.gmail.required &&
    necessity.memory.required
  ) {
    next = addIfMissing(next, 'memory');
  }

  if (
    detected.combineSources &&
    necessity.calendar.required &&
    necessity.memory.required
  ) {
    next = addIfMissing(next, 'memory');
  }

  return unique(next);
}

export function resolveDefaultToolsForIntent(intent: AgentIntent): AgentToolName[] {
  switch (intent) {
    case 'gmail':
      return ['gmail', 'memory'];

    case 'finance':
      return ['finance', 'gmail', 'memory'];

    case 'planning':
    case 'productivity':
      return ['calendar', 'memory', 'notes'];

    case 'coding':
      return ['file', 'web', 'memory'];

    case 'research':
      return ['web', 'memory'];

    case 'shopping':
      return ['web', 'compare', 'memory'];

    case 'compare':
      return ['compare', 'web', 'memory'];

    case 'memory':
      return ['memory', 'notes'];

    case 'general':
      return ['memory'];

    case 'unknown':
    default:
      return ['memory'];
  }
}

export { detectIntegrationIntent };
