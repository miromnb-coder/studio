import { generateOperatorRecommendations } from '@/lib/operator/recommendations';
import { AgentContextV8, ToolResultV8 } from '../types';

function toRecommendationLimit(input: Record<string, unknown>): number {
  const requested = typeof input.limit === 'number' ? input.limit : 4;
  return Math.min(5, Math.max(3, Math.floor(requested)));
}

export async function generateRecommendationsTool(
  input: Record<string, unknown>,
  context: AgentContextV8,
): Promise<ToolResultV8> {
  const recommendations = generateOperatorRecommendations({
    userId: context.user.id,
    operatorAlerts: context.intelligence.operatorAlerts,
    financeProfile: (context.memory.financeProfile || null) as Record<string, unknown> | null,
    financeHistory: context.memory.financeEvents || [],
    gmailFinanceSummary: context.intelligence.gmailFinanceSummary,
    limit: toRecommendationLimit(input),
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
