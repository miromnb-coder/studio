import { getContextMemory, getRequestText, rankTextByQuery, summarizeMemoryItem } from './context';
import { asObject, normalizeText, TOOL_CONFIDENCE } from './helpers';
import { buildFailure, buildPlaceholderProviderResult, buildSuccess } from './result-builders';
import type { AgentContext, AgentToolCall, AgentToolResult } from './types';

export async function memoryTool(
  call: AgentToolCall,
  context: AgentContext,
): Promise<AgentToolResult> {
  const startedAt = Date.now();
  const input = asObject(call.input);
  const action = typeof input.action === 'string' ? input.action : 'search';
  const query = normalizeText(input.query) || normalizeText(input.message) || getRequestText(context);

  const normalizedItems = getContextMemory(context).map(summarizeMemoryItem).filter(Boolean);
  const ranked = rankTextByQuery(normalizedItems, query);

  if (action === 'status') {
    return buildSuccess(call, 'memory', { action, itemCount: normalizedItems.length }, {
      summary: `Memory context contains ${normalizedItems.length} items.`,
      confidence: normalizedItems.length ? 0.8 : 0.55,
    }, startedAt);
  }

  if (action === 'search' || action === 'retrieve') {
    return buildSuccess(call, 'memory', {
      action,
      query,
      matches: ranked.slice(0, 10),
      totalMatches: normalizedItems.length,
    }, {
      summary: ranked.length
        ? 'Returned memory candidates from current context.'
        : 'No memory candidates were available from current context.',
      confidence: ranked.length ? TOOL_CONFIDENCE.memory : 0.44,
    }, startedAt);
  }

  if (action === 'store') {
    return buildPlaceholderProviderResult(
      call,
      'memory',
      'Memory write path should be connected to a persistent store.',
      { action, query },
      startedAt,
    );
  }

  return buildFailure(call, 'memory', `Unsupported memory action: ${action}`, { action }, startedAt);
}
