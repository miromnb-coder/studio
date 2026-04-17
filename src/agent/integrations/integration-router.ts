import { detectIntegrationIntent } from './integration-intent';
import type { AgentToolName } from '@/agent/vNext/types';

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

export function resolveRequiredTools(message: string, currentTools: AgentToolName[]): AgentToolName[] {
  const intent = detectIntegrationIntent(message);

  if (!intent.sources.length) {
    return currentTools;
  }

  const next = [...currentTools];

  if (intent.sources.includes('gmail')) next.push('gmail');
  if (intent.sources.includes('calendar')) next.push('calendar');
  if (intent.sources.includes('memory')) next.push('memory');

  return unique(next);
}

export { detectIntegrationIntent };
