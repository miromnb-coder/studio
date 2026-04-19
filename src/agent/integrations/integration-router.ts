import { detectIntegrationIntent, type IntegrationIntentHints } from './integration-intent';
import type { AgentIntent, AgentToolName } from '@/agent/vNext/types';

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function hasTool(tools: AgentToolName[], tool: AgentToolName): boolean {
  return tools.includes(tool);
}

export function resolveRequiredTools(
  message: string,
  currentTools: AgentToolName[],
  hints: IntegrationIntentHints = {},
): AgentToolName[] {
  const intent = detectIntegrationIntent(message, {
    ...hints,
    currentTools,
  });

  const next = [...currentTools];

  if (intent.sources.includes('gmail') && !hasTool(next, 'gmail')) next.push('gmail');
  if (intent.sources.includes('calendar') && !hasTool(next, 'calendar')) next.push('calendar');
  if (intent.sources.includes('memory') && !hasTool(next, 'memory')) next.push('memory');

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
    default:
      return ['memory'];
  }
}

export { detectIntegrationIntent };
