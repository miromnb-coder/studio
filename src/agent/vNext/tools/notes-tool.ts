import { getContextNotes, getRequestText, rankTextByQuery, summarizeMemoryItem } from './context';
import { asObject, normalizeText, TOOL_CONFIDENCE } from './helpers';
import { buildFailure, buildPlaceholderProviderResult, buildSuccess } from './result-builders';
import type { AgentContext, AgentToolCall, AgentToolResult } from './types';

export async function notesTool(
  call: AgentToolCall,
  context: AgentContext,
): Promise<AgentToolResult> {
  const startedAt = Date.now();
  const input = asObject(call.input);
  const action = normalizeText(input.action) || 'list';
  const query = normalizeText(input.query) || normalizeText(input.message) || getRequestText(context);
  const normalizedNotes = getContextNotes(context).map(summarizeMemoryItem).filter(Boolean);

  if (action === 'list' || action === 'search') {
    const rankedNotes = rankTextByQuery(normalizedNotes, query);
    return buildSuccess(call, 'notes', {
      action,
      query,
      notes: rankedNotes.slice(0, 10),
      totalNotes: normalizedNotes.length,
    }, {
      summary: rankedNotes.length
        ? 'Returned notes from current context.'
        : 'No note content was available in current context.',
      confidence: rankedNotes.length ? TOOL_CONFIDENCE.notes : 0.44,
    }, startedAt);
  }

  if (action === 'create') {
    const note = normalizeText(input.note) || query;
    return buildPlaceholderProviderResult(
      call,
      'notes',
      'Notes creation should be connected to persistent notes storage.',
      { action, note },
      startedAt,
    );
  }

  return buildFailure(call, 'notes', `Unsupported notes action: ${action}`, { action }, startedAt);
}
