import { asObject, normalizeText, TOOL_CONFIDENCE } from './helpers';
import { buildPlaceholderProviderResult, buildSuccess } from './result-builders';
import { getRequestText } from './context';
import type { AgentContext, AgentToolCall, AgentToolResult } from './types';

export async function financeTool(
  call: AgentToolCall,
  context: AgentContext,
): Promise<AgentToolResult> {
  const startedAt = Date.now();
  const input = asObject(call.input);
  const action = normalizeText(input.action) || 'overview';
  const query = normalizeText(input.query) || normalizeText(input.message) || getRequestText(context);

  const ctx = context as AgentContext & {
    finance?: Record<string, unknown>;
    financeSummary?: Record<string, unknown>;
    request?: { metadata?: Record<string, unknown> };
  };

  const financeContext =
    ctx.finance ??
    ctx.financeSummary ??
    (typeof ctx.request?.metadata?.finance === 'object'
      ? (ctx.request.metadata.finance as Record<string, unknown>)
      : null);

  if (action === 'status') {
    return buildSuccess(call, 'finance', { action, available: Boolean(financeContext) }, {
      summary: 'Finance context inspected.',
      confidence: financeContext ? 0.74 : 0.42,
    }, startedAt);
  }

  if (financeContext) {
    return buildSuccess(call, 'finance', { action, query, financeContext }, {
      summary: 'Returned finance context from current request state.',
      nextAction: 'Replace with connector-driven financial analysis.',
      confidence: TOOL_CONFIDENCE.finance,
    }, startedAt);
  }

  return buildPlaceholderProviderResult(
    call,
    'finance',
    'Finance connectors and normalized schemas should be connected here.',
    { action, query },
    startedAt,
  );
}
