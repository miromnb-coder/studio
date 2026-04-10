import { AgentContextV8, AgentMessageV8, MemoryEnvelopeV8, ProductStateV8, RouteResultV8 } from './types';
import { fetchRelevantUserMemory } from './tools/memory-store';

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
    .slice(-8);
}

export async function buildContextV8(params: {
  userId: string;
  message: string;
  history?: unknown[];
  memory?: MemoryEnvelopeV8 | null;
  route: RouteResultV8;
  productState: ProductStateV8;
}): Promise<AgentContextV8> {
  const safeMemory = params.memory || {};
  const includeFinance = params.route.intent === 'finance';
  const includeSemanticMemory = params.route.intent === 'memory' || params.route.intent === 'finance';
  const shouldFetchRelevantMemories = params.route.intent === 'memory' || params.route.intent === 'finance' || params.route.intent === 'coding';

  const relevantMemories = shouldFetchRelevantMemories
    ? await fetchRelevantUserMemory({
      userId: params.userId,
      query: params.message,
      limit: includeFinance ? 8 : 4,
      financeOnly: includeFinance,
    }).catch(() => [])
    : [];

  const filteredRelevantMemories = includeFinance
    ? relevantMemories
    : relevantMemories.filter((item) => (item.relevanceScore || 0) >= 0.82).slice(0, 3);

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
      semanticMemories: includeSemanticMemory ? safeMemory.semanticMemories || [] : [],
      relevantMemories: filteredRelevantMemories,
    },
    environment: {
      gmailConnected: params.productState.gmailConnected,
      productState: params.productState,
      nowIso: new Date().toISOString(),
    },
  };
}
