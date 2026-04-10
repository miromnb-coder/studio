import { AgentContextV8, AgentMessageV8, MemoryEnvelopeV8, ProductStateV8, RouteResultV8 } from './types';

function sanitizeHistory(history: unknown[] = []): AgentMessageV8[] {
  return history
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map((item) => {
      const role: AgentMessageV8['role'] = item.role === 'assistant' || item.role === 'system' ? item.role : 'user';
      return {
        role,
        content: typeof item.content === 'string' ? item.content.trim() : '',
      };
    })
    .filter((item) => item.content.length > 0)
    .slice(-6);
}

export function buildContextV8(params: {
  userId: string;
  message: string;
  history?: unknown[];
  memory?: MemoryEnvelopeV8 | null;
  route: RouteResultV8;
  productState: ProductStateV8;
}): AgentContextV8 {
  const safeMemory = params.memory || {};
  const includeFinance = params.route.intent === 'finance';

  return {
    user: {
      id: params.userId,
      message: params.message,
    },
    conversation: sanitizeHistory(params.history),
    memory: {
      summary: typeof safeMemory.summary === 'string' ? safeMemory.summary : 'No prior context available.',
      summaryType: safeMemory.summaryType === 'finance' ? 'finance' : 'general',
      financeProfile: includeFinance ? safeMemory.financeProfile || null : null,
      financeEvents: includeFinance ? safeMemory.financeEvents || [] : [],
      semanticMemories: params.route.intent === 'general' ? [] : safeMemory.semanticMemories || [],
    },
    environment: {
      gmailConnected: params.productState.gmailConnected,
      productState: params.productState,
      nowIso: new Date().toISOString(),
    },
  };
}
