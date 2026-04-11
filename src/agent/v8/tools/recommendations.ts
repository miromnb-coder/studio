import { generateOperatorRecommendations } from '@/lib/operator/recommendations';
import { shouldSuppressRecommendation } from '@/lib/operator/outcomes';
import { AgentContextV8, ToolResultV8 } from '../types';

function toRecommendationLimit(input: Record<string, unknown>): number {
  const requested = typeof input.limit === 'number' ? input.limit : 4;
  return Math.min(5, Math.max(3, Math.floor(requested)));
}

export async function generateRecommendationsTool(
  input: Record<string, unknown>,
  context: AgentContextV8,
): Promise<ToolResultV8> {
  const generated = generateOperatorRecommendations({
    userId: context.user.id,
    operatorAlerts: context.intelligence.operatorAlerts,
    financeProfile: (context.memory.financeProfile || null) as Record<string, unknown> | null,
    financeHistory: context.memory.financeEvents || [],
    gmailFinanceSummary: context.intelligence.gmailFinanceSummary,
    limit: toRecommendationLimit(input),
  });
  const outcomes = context.intelligence.outcomes || [];
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

  const recommendations = generated
    .filter((item) => !shouldSuppressRecommendation({ recommendationId: item.id, outcomes }))
    .sort((a, b) => {
      const aScore = scoreByRecommendation[a.id] || 0;
      const bScore = scoreByRecommendation[b.id] || 0;
      if (aScore !== bScore) return bScore - aScore;
      return (b.estimated_impact.monthly_savings || 0) - (a.estimated_impact.monthly_savings || 0);
    });

  return {
    ok: true,
    tool: 'generate_recommendations',
    output: {
      count: recommendations.length,
      recommendations,
    },
  };
}
