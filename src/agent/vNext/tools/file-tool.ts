import { getRequestText } from './context';
import { asObject, normalizeText } from './helpers';
import { buildPlaceholderProviderResult } from './result-builders';
import type { AgentContext, AgentToolCall, AgentToolResult } from './types';

export async function fileTool(
  call: AgentToolCall,
  context: AgentContext,
): Promise<AgentToolResult> {
  const startedAt = Date.now();
  const input = asObject(call.input);
  const action = normalizeText(input.action) || 'inspect';
  const query = normalizeText(input.query) || normalizeText(input.message) || getRequestText(context);

  return buildPlaceholderProviderResult(
    call,
    'file',
    'Secure file retrieval and parsing should be wired here.',
    {
      action,
      query,
      suggestedShape: {
        fileName: 'string',
        mimeType: 'string',
        summary: 'string',
        extractedText: 'string',
      },
    },
    startedAt,
  );
}
