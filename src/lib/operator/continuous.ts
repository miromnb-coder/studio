import type { OperatorAlertRecord } from './alerts';

type OutcomeRow = {
  status: string | null;
  estimated_monthly_impact: number | null;
  realized_impact: number | null;
  completed_at: string | null;
  updated_at: string;
};

function toNumber(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function daysAgo(iso: string): number {
  const ts = new Date(iso).getTime();
  if (!Number.isFinite(ts)) return Number.POSITIVE_INFINITY;
  return Math.round((Date.now() - ts) / (1000 * 60 * 60 * 24));
}

export function buildContinuousOptimizationDigest(params: {
  alerts: OperatorAlertRecord[];
  outcomes: OutcomeRow[];
  financeProfile: Record<string, unknown> | null;
}) {
  const alerts = params.alerts.filter((item) => item.status === 'active');
  const outcomes = params.outcomes;

  const weeklyCompleted = outcomes.filter((item) => item.status === 'completed' && item.completed_at && daysAgo(item.completed_at) <= 7);
  const monthlyCompleted = outcomes.filter((item) => item.status === 'completed' && item.completed_at && daysAgo(item.completed_at) <= 30);
  const monthlyRealized = monthlyCompleted.reduce((sum, item) => sum + toNumber(item.realized_impact, toNumber(item.estimated_monthly_impact, 0)), 0);

  const leaksFound = alerts.filter((item) => ['possible_unused_subscription', 'duplicate_subscription', 'price_increase', 'better_alternative'].includes(item.type));
  const leaksValue = leaksFound.reduce(
    (sum, item) => sum + toNumber(item.metadata?.potential_monthly_savings, toNumber(item.metadata?.monthly_delta, toNumber(item.metadata?.monthly_amount, 0))),
    0,
  );

  const monthlyTotal = toNumber(params.financeProfile?.total_monthly_cost, 0);
  const forecastNextMonth = Math.max(0, Math.round((monthlyTotal - monthlyRealized) * 100) / 100);
  const actionRate = outcomes.length ? Math.round((monthlyCompleted.length / outcomes.length) * 100) : 0;

  const scoreBase = 100;
  const score = Math.max(
    0,
    Math.min(
      100,
      Math.round(scoreBase - alerts.length * 4 + monthlyCompleted.length * 6 + Math.min(15, monthlyRealized / 5) + Math.min(8, actionRate / 12)),
    ),
  );

  return {
    score,
    weekly: {
      completed_actions: weeklyCompleted.length,
      new_leaks_found: leaksFound.length,
      potential_monthly_savings: Math.round(leaksValue * 100) / 100,
    },
    monthly: {
      completed_actions: monthlyCompleted.length,
      realized_monthly_impact: Math.round(monthlyRealized * 100) / 100,
      missed_opportunities: outcomes.filter((item) => item.status === 'ignored').length,
      action_completion_rate: actionRate,
      next_month_forecast: forecastNextMonth,
    },
    highlights: [
      `Weekly savings review: ${leaksFound.length} active leak signals worth about $${Math.round(leaksValue)}/month.`,
      `Completed actions this month: ${monthlyCompleted.length}.`,
      `Next-month recurring forecast: $${forecastNextMonth.toFixed(0)}.`,
    ],
  };
}
