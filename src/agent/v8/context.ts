import { generateOperatorRecommendations } from '@/lib/operator/recommendations';
import { AgentContextV8, AgentMessageV8, MemoryEnvelopeV8, ProductStateV8, RouteResultV8 } from './types';
import { fetchRelevantUserMemory } from './tools/memory-store';
import type { SupabaseClient } from '@supabase/supabase-js';

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

function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

export async function buildContextV8(params: {
  supabase: SupabaseClient;
  userId: string;
  message: string;
  history?: unknown[];
  memory?: MemoryEnvelopeV8 | null;
  route: RouteResultV8;
  productState: ProductStateV8;
  operatorAlerts?: AgentContextV8['intelligence']['operatorAlerts'];
  userProfileIntelligence?: AgentContextV8['intelligence']['userProfile'];
}): Promise<AgentContextV8> {
  const safeMemory = params.memory || {};
  const includeFinance = params.route.intent === 'finance';
  const includeSemanticMemory = params.route.intent === 'memory' || params.route.intent === 'finance';
  const shouldFetchRelevantMemories = true;

  const relevantMemories = shouldFetchRelevantMemories
    ? await fetchRelevantUserMemory({
      supabase: params.supabase,
      userId: params.userId,
      query: params.message,
      limit: includeFinance ? 8 : 4,
      financeOnly: includeFinance,
    }).catch(() => [])
    : [];

  const filteredRelevantMemories = includeFinance || params.route.intent === 'memory'
    ? relevantMemories
    : relevantMemories.filter((item) => (item.relevanceScore || 0) >= 0.82).slice(0, 3);

  const financeProfile = includeFinance ? safeMemory.financeProfile || null : null;
  const financeEvents = includeFinance ? safeMemory.financeEvents || [] : [];
  const gmailFinanceSummary = asObject(asObject(asObject(financeProfile)?.last_analysis)?.gmail_import);
  const recommendations = params.route.wantsRecommendations
    ? generateOperatorRecommendations({
      userId: params.userId,
      operatorAlerts: params.operatorAlerts || [],
      financeProfile: financeProfile as Record<string, unknown> | null,
      financeHistory: financeEvents,
      gmailFinanceSummary,
      limit: 5,
    })
    : [];

  return {
    user: {
      id: params.userId,
      message: params.message,
    },
    conversation: sanitizeHistory(params.history),
    memory: {
      summary: typeof safeMemory.summary === 'string' ? safeMemory.summary : 'No prior context available.',
      summaryType: safeMemory.summaryType === 'finance' ? 'finance' : 'general',
      financeProfile,
      financeEvents,
      semanticMemories: includeSemanticMemory ? safeMemory.semanticMemories || [] : [],
      relevantMemories: filteredRelevantMemories,
    },
    intelligence: {
      operatorAlerts: params.operatorAlerts || [],
      recommendations,
      userProfile: params.userProfileIntelligence || null,
      gmailFinanceSummary,
    },
    environment: {
      gmailConnected: params.productState.gmailConnected,
      productState: params.productState,
      nowIso: new Date().toISOString(),
    },
  };
}
