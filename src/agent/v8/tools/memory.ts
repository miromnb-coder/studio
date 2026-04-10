import { AgentContextV8, ToolResultV8 } from '../types';

function normalizeArray(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    : [];
}

export async function retrieveStructuredMemoryTool(
  _input: Record<string, unknown>,
  context: AgentContextV8,
): Promise<ToolResultV8> {
  return {
    ok: true,
    tool: 'retrieve_structured_memory',
    output: {
      summary: context.memory.summary,
      summaryType: context.memory.summaryType,
      financeProfile: context.memory.financeProfile || {},
      financeEvents: normalizeArray(context.memory.financeEvents),
    },
  };
}

export async function retrieveSemanticMemoryTool(
  _input: Record<string, unknown>,
  context: AgentContextV8,
): Promise<ToolResultV8> {
  return {
    ok: true,
    tool: 'retrieve_semantic_memory',
    output: {
      semanticMemories: normalizeArray(context.memory.semanticMemories),
      summary: context.memory.summary,
    },
  };
}

export async function persistMemoryTool(
  input: Record<string, unknown>,
  context: AgentContextV8,
): Promise<ToolResultV8> {
  return {
    ok: true,
    tool: 'persist_memory',
    output: {
      source: typeof input.source === 'string' ? input.source : 'general',
      persisted: Boolean(context.user.message && context.user.message.length > 10),
      reason: 'Persistence delegated to API smart-memory pipeline.',
    },
  };
}
