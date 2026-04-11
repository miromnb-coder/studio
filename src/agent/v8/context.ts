import { generateOperatorRecommendations } from '@/lib/operator/recommendations';
import { shouldSuppressRecommendation } from '@/lib/operator/outcomes';
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
  outcomes: AgentContextV8['intelligence']['outcomes'];
  financeProfile: Record<string, unknown> | null;
}): DecisionContextV8 {
  const memoryTexts = params.relevantMemories.map((item) => String(item.content || ''));
  const corpus = [params.message, params.memorySummary, ...memoryTexts].join(' ').toLowerCase();

  const activeGoal = memoryTexts.find((text) => /save|sääst|saast|budget|debt payoff|emergency fund/i.test(text))
    || (/\bsave|budget|reduce spending|pay off\b/i.test(params.message) ? params.message.trim() : null);

  const knownConstraints = memoryTexts
    .filter((text) => /student|family|rent|income|fixed|tight|low budget|constraint|freelancer/i.test(text))
    .slice(0, 4);
  if (params.route.goal.emotionalTone === 'overwhelmed') knownConstraints.unshift('User may be cognitively overloaded; keep plans simple.');

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
  const successfulRecommendationIds = params.outcomes
    .filter((item) => item.status === 'accepted' || item.status === 'completed')
    .map((item) => item.recommendation_id)
    .filter(Boolean)
    .slice(0, 8);
  const deprioritizedRecommendationIds = params.outcomes
    .filter((item) => item.status === 'ignored')
    .map((item) => item.recommendation_id)
    .filter(Boolean)
    .slice(0, 8);

  const pressureFromProfile = Number(params.financeProfile?.total_monthly_cost || 0) > Number(params.financeProfile?.monthly_income || 0)
    ? 'high'
    : 'unknown';
  const repeatedIgnores = deprioritizedRecommendationIds.length >= 3;

  const currentFinancialPressure: DecisionContextV8['currentFinancialPressure'] =
    /urgent|behind|late fee|overdrawn|stress|can't pay|cannot pay/.test(corpus)
      ? 'high'
      : /tight|careful|watch spending|constrained/.test(corpus)
        ? 'medium'
        : pressureFromProfile === 'high'
          ? 'high'
          : repeatedIgnores
            ? 'medium'
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
    successfulRecommendationIds,
    deprioritizedRecommendationIds,
    currentFinancialPressure,
    userPreferences,
  };
}

function rankRecommendationsFromOutcomes(
  recommendations: AgentContextV8['intelligence']['recommendations'],
  outcomes: AgentContextV8['intelligence']['outcomes'],
) {
  if (!recommendations.length || !outcomes.length) return recommendations;
  const scoreByRecommendation = outcomes.reduce<Record<string, number>>((acc, outcome) => {
    if (!outcome.recommendation_id) return acc;
    const delta = outcome.status === 'completed' || outcome.status === 'accepted'
      ? 2
      : outcome.status === 'postponed'
        ? -0.5
        : outcome.status === 'ignored'
          ? -2
          : 0;
    acc[outcome.recommendation_id] = (acc[outcome.recommendation_id] || 0) + delta;
    return acc;
  }, {});

  return [...recommendations].sort((a, b) => {
    const aScore = scoreByRecommendation[a.id] || 0;
    const bScore = scoreByRecommendation[b.id] || 0;
    if (aScore !== bScore) return bScore - aScore;
    return (b.estimated_impact.monthly_savings || 0) - (a.estimated_impact.monthly_savings || 0);
  });
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
  outcomes?: AgentContextV8['intelligence']['outcomes'];
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
  const outcomes = params.outcomes || [];
  const rawRecommendations = params.route.wantsRecommendations
    ? generateOperatorRecommendations({
      userId: params.userId,
      operatorAlerts: params.operatorAlerts || [],
      financeProfile: financeProfile as Record<string, unknown> | null,
      financeHistory: financeEvents,
      gmailFinanceSummary,
      limit: 5,
    })
    : [];
  const unsortedRecommendations = rawRecommendations.filter(
    (item) => !shouldSuppressRecommendation({ recommendationId: item.id, outcomes }),
  );
  const recommendations = rankRecommendationsFromOutcomes(unsortedRecommendations, outcomes);

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
      outcomes,
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
      outcomes,
      financeProfile: (financeProfile as Record<string, unknown> | null) || null,
    }),
    environment: {
      gmailConnected: params.productState.gmailConnected,
      productState: params.productState,
      nowIso: new Date().toISOString(),
    },
  };
}
