import { generateOperatorRecommendations } from '@/lib/operator/recommendations';
import { AgentContextV8, AgentMessageV8, DecisionContextV8, MemoryEnvelopeV8, ProductStateV8, RouteResultV8 } from './types';
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

function inferDecisionContext(params: {
  route: RouteResultV8;
  message: string;
  memorySummary: string;
  relevantMemories: AgentContextV8['memory']['relevantMemories'];
  conversation: AgentMessageV8[];
  recommendations: AgentContextV8['intelligence']['recommendations'];
  financeProfile: Record<string, unknown> | null;
}): DecisionContextV8 {
  const memoryTexts = params.relevantMemories.map((item) => String(item.content || ''));
  const corpus = [params.message, params.memorySummary, ...memoryTexts].join(' ').toLowerCase();

  const activeGoal = memoryTexts.find((text) => /save|sääst|saast|budget|debt payoff|emergency fund/i.test(text))
    || (/\bsave|budget|reduce spending|pay off\b/i.test(params.message) ? params.message.trim() : null);

  const knownConstraints = memoryTexts
    .filter((text) => /student|family|rent|income|fixed|tight|low budget|constraint|freelancer/i.test(text))
    .slice(0, 4);

  const recentActions = params.conversation
    .filter((item) => item.role === 'assistant' || item.role === 'user')
    .map((item) => item.content)
    .filter((text) => /cancel|downgrade|switched|reduced|cut|paid|saved/i.test(text))
    .slice(-3);

  const decisionHistory = memoryTexts
    .filter((text) => /prefer|chose|choice|long-term|cheap|stable|avoid risk/i.test(text))
    .slice(0, 4);

  const previousRecommendations = params.recommendations
    .map((rec) => rec.title)
    .filter(Boolean)
    .slice(0, 4);

  const pressureFromProfile = Number(params.financeProfile?.total_monthly_cost || 0) > Number(params.financeProfile?.monthly_income || 0)
    ? 'high'
    : 'unknown';

  const currentFinancialPressure: DecisionContextV8['currentFinancialPressure'] =
    /urgent|behind|late fee|overdrawn|stress|can't pay|cannot pay/.test(corpus)
      ? 'high'
      : /tight|careful|watch spending|constrained/.test(corpus)
        ? 'medium'
        : pressureFromProfile === 'high'
          ? 'high'
          : /comfortable|stable/.test(corpus)
            ? 'low'
            : 'unknown';

  const userPreferences = memoryTexts
    .filter((text) => /prefer|like|avoid|monthly|yearly|automation|manual/i.test(text))
    .slice(0, 5);

  return {
    activeGoal,
    knownConstraints,
    recentActions,
    decisionHistory,
    previousRecommendations,
    currentFinancialPressure,
    userPreferences,
  };
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

  const conversation = sanitizeHistory(params.history);
  const memorySummary = typeof safeMemory.summary === 'string' ? safeMemory.summary : 'No prior context available.';

  return {
    supabase: params.supabase,
    user: {
      id: params.userId,
      message: params.message,
    },
    conversation,
    memory: {
      summary: memorySummary,
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
    decisionContext: inferDecisionContext({
      route: params.route,
      message: params.message,
      memorySummary,
      relevantMemories: filteredRelevantMemories,
      conversation,
      recommendations,
      financeProfile: (financeProfile as Record<string, unknown> | null) || null,
    }),
    environment: {
      gmailConnected: params.productState.gmailConnected,
      productState: params.productState,
      nowIso: new Date().toISOString(),
    },
  };
}
