import { AGENT_VNEXT_FALLBACK_MESSAGES } from './constants';
import type { AgentRequest, AgentRouteResult, AgentToolName } from './types';

const KEYWORD_MAP: Array<{ intent: AgentRouteResult['intent']; keywords: string[]; tools?: AgentToolName[] }> = [
  { intent: 'email', keywords: ['email', 'gmail', 'inbox', 'send', 'reply'], tools: ['gmail'] },
  { intent: 'scheduling', keywords: ['calendar', 'schedule', 'meeting', 'availability'], tools: ['calendar'] },
  { intent: 'memory_lookup', keywords: ['remember', 'memory', 'last time', 'history'], tools: ['memory'] },
  { intent: 'compare', keywords: ['compare', 'versus', 'vs', 'difference'], tools: ['compare'] },
  { intent: 'research', keywords: ['research', 'latest', 'find sources', 'look up'], tools: ['web'] },
  { intent: 'planning', keywords: ['plan', 'roadmap', 'steps', 'strategy'] },
  { intent: 'execution', keywords: ['do this', 'execute', 'run', 'perform'], tools: ['notes'] },
  { intent: 'tool_use', keywords: ['tool', 'integrate', 'connect'], tools: ['file', 'finance'] },
  { intent: 'question', keywords: ['what', 'why', 'how', 'when'] },
  { intent: 'chat', keywords: ['hey', 'hello', 'help me'] },
];

export function routeIntent(request: AgentRequest): AgentRouteResult {
  const text = request.message.toLowerCase();

  const match = KEYWORD_MAP.find((entry) => entry.keywords.some((keyword) => text.includes(keyword)));

  if (!match) {
    return {
      intent: 'fallback',
      confidence: 0.3,
      reason: 'No strong lexical intent signal found.',
      requiresTools: [],
      shouldFetchMemory: true,
      suggestedExecutionMode: 'sync',
      fallbackMessage: AGENT_VNEXT_FALLBACK_MESSAGES.missingContext,
    };
  }

  const requiresTools = match.tools ?? [];
  const shouldFetchMemory = match.intent !== 'research' && match.intent !== 'fallback';

  return {
    intent: match.intent,
    confidence: match.intent === 'chat' ? 0.65 : 0.78,
    reason: `Matched keyword pattern for intent: ${match.intent}`,
    requiresTools,
    shouldFetchMemory,
    suggestedExecutionMode: match.intent === 'research' ? 'stream' : 'sync',
    // TODO: Replace deterministic confidence with model-based routing + calibration.
  };
}
