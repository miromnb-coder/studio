import type {
  AgentToolCall,
  AgentToolName,
  AgentToolResult,
  ExecutionMetadata,
} from './types';
import { TOOL_CONFIDENCE } from './helpers';

export function buildSuccess(
  call: AgentToolCall,
  tool: AgentToolName,
  data: Record<string, unknown>,
  meta: ExecutionMetadata = {},
  startedAt?: number,
): AgentToolResult {
  return {
    callId: call.callId,
    stepId: call.stepId,
    tool,
    ok: true,
    data: {
      ...data,
      meta,
    },
    latencyMs: typeof startedAt === 'number' ? Date.now() - startedAt : undefined,
  };
}

export function buildFailure(
  call: AgentToolCall,
  tool: AgentToolName,
  error: string,
  data: Record<string, unknown> = {},
  startedAt?: number,
): AgentToolResult {
  return {
    callId: call.callId,
    stepId: call.stepId,
    tool,
    ok: false,
    data,
    error,
    latencyMs: typeof startedAt === 'number' ? Date.now() - startedAt : undefined,
  };
}

export function buildMissingConnection(
  call: AgentToolCall,
  tool: AgentToolName,
  action: string,
  startedAt?: number,
): AgentToolResult {
  return buildFailure(
    call,
    tool,
    `${tool} is not connected.`,
    {
      action,
      canConnect: true,
      suggestedRoute: '/chat',
      suggestedConnector: tool === 'calendar' ? 'google-calendar' : tool,
    },
    startedAt,
  );
}

export function buildProviderFailure(
  call: AgentToolCall,
  tool: AgentToolName,
  provider: string,
  reason: string,
  startedAt?: number,
): AgentToolResult {
  return buildFailure(call, tool, `${provider} provider failure: ${reason}`, { provider }, startedAt);
}

export function buildEmptyResult(
  call: AgentToolCall,
  tool: AgentToolName,
  summary: string,
  data: Record<string, unknown> = {},
  startedAt?: number,
): AgentToolResult {
  return buildSuccess(
    call,
    tool,
    data,
    {
      summary,
      confidence: 0.4,
      nextAction: 'Refine the query or broaden search scope.',
    },
    startedAt,
  );
}

export function buildPlaceholderProviderResult(
  call: AgentToolCall,
  tool: AgentToolName,
  notes: string,
  extra: Record<string, unknown> = {},
  startedAt?: number,
): AgentToolResult {
  return buildSuccess(
    call,
    tool,
    {
      placeholder: true,
      receivedInput: call.input,
      ...extra,
    },
    {
      placeholder: true,
      requiresProvider: true,
      summary: notes,
      nextAction: 'Wire provider adapter and permission checks.',
      confidence: TOOL_CONFIDENCE[tool],
    },
    startedAt,
  );
}
