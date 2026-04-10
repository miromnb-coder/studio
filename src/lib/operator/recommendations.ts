import type { OperatorAlertRecord } from './alerts';

export type RecommendationType =
  | 'cost_reduction'
  | 'consolidation'
  | 'anomaly_review'
  | 'subscription_cleanup'
  | 'savings_opportunity'
  | 'behavior_improvement'
  | 'priority_action';

export type RecommendationPriority = 'low' | 'medium' | 'high' | 'critical';

export type OperatorRecommendation = {
  id: string;
  user_id: string;
  type: RecommendationType;
  priority: RecommendationPriority;
  title: string;
  summary: string;
  reasoning: string;
  estimated_impact: {
    currency: 'USD';
    monthly_savings?: number;
    yearly_savings?: number;
    risk_reduction?: 'low' | 'medium' | 'high';
    time_savings_hours_month?: number;
  };
  confidence: number;
  suggested_actions: string[];
  source: string;
  created_at: string;
  updated_at: string;
};

type FinanceSubscription = {
  merchant: string;
  monthly_amount: number;
  usage_score?: number;
  status?: string;
};

type RecommendationInput = {
  userId: string;
  operatorAlerts: OperatorAlertRecord[];
  financeProfile: Record<string, unknown> | null;
  financeHistory: Array<Record<string, unknown>>;
  gmailFinanceSummary: Record<string, unknown> | null;
  limit?: number;
};

function asArray(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
    : [];
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function toNum(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function monthlyAmount(sub: Record<string, unknown>): number {
  const amount = toNum(sub.monthly_amount, toNum(sub.monthlyAmount, toNum(sub.amount, 0)));
  const period = String(sub.period || sub.billing_cycle || '').toLowerCase();
  if ((period.includes('year') || period.includes('annual')) && amount > 0) return amount / 12;
  return amount;
}

function normalizeSubscriptions(financeProfile: Record<string, unknown> | null): FinanceSubscription[] {
  const subscriptions = asArray(financeProfile?.active_subscriptions);
  return subscriptions
    .map((sub) => ({
      merchant: String(sub.merchant || sub.name || sub.provider || 'Unknown service').trim(),
      monthly_amount: Math.round(monthlyAmount(sub) * 100) / 100,
      usage_score: Number.isFinite(toNum(sub.usage_score, Number.NaN)) ? toNum(sub.usage_score, Number.NaN) : undefined,
      status: String(sub.status || '').toLowerCase(),
    }))
    .filter((sub) => sub.monthly_amount > 0);
}

function clampConfidence(value: number): number {
  return Math.max(0.35, Math.min(0.98, Math.round(value * 100) / 100));
}

function priorityFromSignals(impact: number, urgency: number, confidence: number): RecommendationPriority {
  const composite = impact * 0.45 + urgency * 0.35 + confidence * 0.2;
  if (composite >= 0.86) return 'critical';
  if (composite >= 0.72) return 'high';
  if (composite >= 0.55) return 'medium';
  return 'low';
}

function buildRecommendationId(userId: string, key: string): string {
  return `${userId}:${key}`;
}

function mapAlertRecommendation(alert: OperatorAlertRecord, userId: string, now: string): OperatorRecommendation | null {
  const monthlyAmount = toNum(alert.metadata?.monthly_amount, toNum(alert.metadata?.monthly_total, 0));
  const potentialSavings = toNum(alert.metadata?.potential_monthly_savings, monthlyAmount);
  const daysLeft = toNum(alert.metadata?.days_left, Number.NaN);
  const confidence = clampConfidence(
    alert.severity === 'high'
      ? 0.9
      : alert.severity === 'medium'
        ? 0.8
        : 0.68,
  );

  if (alert.type === 'duplicate_subscription') {
    const savings = monthlyAmount > 0 ? monthlyAmount / 2 : 0;
    return {
      id: buildRecommendationId(userId, `consolidate:${alert.dedupe_key}`),
      user_id: userId,
      type: 'consolidation',
      priority: priorityFromSignals(Math.min(1, savings / 60), 0.7, confidence),
      title: 'Consolidate overlapping subscriptions',
      summary: `You appear to have overlapping charges that could be merged or removed.` ,
      reasoning: alert.summary,
      estimated_impact: {
        currency: 'USD',
        monthly_savings: Math.round(savings * 100) / 100,
        yearly_savings: Math.round(savings * 12 * 100) / 100,
      },
      confidence,
      suggested_actions: [
        'Compare plan owners and active seats for the duplicate merchant.',
        'Keep the plan with highest usage and cancel or downgrade the redundant one.',
      ],
      source: `operator_alerts:${alert.id}`,
      created_at: now,
      updated_at: now,
    };
  }

  if (alert.type === 'possible_unused_subscription') {
    return {
      id: buildRecommendationId(userId, `cleanup:${alert.dedupe_key}`),
      user_id: userId,
      type: 'subscription_cleanup',
      priority: priorityFromSignals(Math.min(1, monthlyAmount / 40), 0.58, confidence),
      title: `Review low-value subscription: ${alert.title.replace(/^Possible unused subscription:\s*/i, '')}`,
      summary: 'A subscription shows weak value signals and should be explicitly validated.',
      reasoning: alert.summary,
      estimated_impact: {
        currency: 'USD',
        monthly_savings: Math.round(monthlyAmount * 100) / 100,
        yearly_savings: Math.round(monthlyAmount * 12 * 100) / 100,
      },
      confidence,
      suggested_actions: ['Confirm usage in the last 30 days.', 'Cancel or pause if no critical dependency exists.'],
      source: `operator_alerts:${alert.id}`,
      created_at: now,
      updated_at: now,
    };
  }

  if (alert.type === 'unusual_recurring_charge' || alert.type === 'price_increase') {
    return {
      id: buildRecommendationId(userId, `review:${alert.dedupe_key}`),
      user_id: userId,
      type: 'anomaly_review',
      priority: priorityFromSignals(Math.min(1, monthlyAmount / 70), alert.severity === 'high' ? 0.9 : 0.72, confidence),
      title: alert.type === 'price_increase' ? 'Negotiate or downgrade increased plan' : 'Verify unusual recurring charge',
      summary: 'A billing anomaly deserves a direct review to avoid silent cost drift.',
      reasoning: alert.summary,
      estimated_impact: {
        currency: 'USD',
        monthly_savings: monthlyAmount > 0 ? Math.round(monthlyAmount * 0.3 * 100) / 100 : undefined,
        yearly_savings: monthlyAmount > 0 ? Math.round(monthlyAmount * 3.6 * 100) / 100 : undefined,
        risk_reduction: alert.severity === 'high' ? 'high' : 'medium',
      },
      confidence,
      suggested_actions: [
        'Check the invoice line item and plan details.',
        'If unexpected, contact support or block the charge source.',
      ],
      source: `operator_alerts:${alert.id}`,
      created_at: now,
      updated_at: now,
    };
  }

  if (alert.type === 'trial_ending') {
    return {
      id: buildRecommendationId(userId, `trial:${alert.dedupe_key}`),
      user_id: userId,
      type: 'priority_action',
      priority: priorityFromSignals(0.5, Number.isFinite(daysLeft) && daysLeft <= 3 ? 0.95 : 0.78, confidence),
      title: 'Handle trial renewal before charge hits',
      summary: 'A free trial is close to renewal and needs a go/no-go decision.',
      reasoning: alert.summary,
      estimated_impact: {
        currency: 'USD',
        risk_reduction: 'high',
      },
      confidence,
      suggested_actions: ['Decide now whether to keep the trial service.', 'Cancel before renewal if you do not need it.'],
      source: `operator_alerts:${alert.id}`,
      created_at: now,
      updated_at: now,
    };
  }

  if (alert.type === 'savings_opportunity') {
    return {
      id: buildRecommendationId(userId, `savings:${alert.dedupe_key}`),
      user_id: userId,
      type: 'savings_opportunity',
      priority: priorityFromSignals(Math.min(1, potentialSavings / 75), 0.62, confidence),
      title: 'Run focused savings pass on highest-impact items',
      summary: 'Your current signals indicate meaningful recurring savings potential.',
      reasoning: alert.summary,
      estimated_impact: {
        currency: 'USD',
        monthly_savings: Math.round(potentialSavings * 100) / 100,
        yearly_savings: Math.round(potentialSavings * 12 * 100) / 100,
      },
      confidence,
      suggested_actions: [
        'Start with duplicate and unused subscriptions first.',
        'Then renegotiate or downgrade recent price-increase merchants.',
      ],
      source: `operator_alerts:${alert.id}`,
      created_at: now,
      updated_at: now,
    };
  }

  return null;
}

function deriveProfileRecommendations(input: RecommendationInput, now: string): OperatorRecommendation[] {
  const subscriptions = normalizeSubscriptions(input.financeProfile);
  if (!subscriptions.length) return [];

  const sorted = [...subscriptions].sort((a, b) => b.monthly_amount - a.monthly_amount);
  const top = sorted.slice(0, 3);
  const topTotal = top.reduce((sum, item) => sum + item.monthly_amount, 0);
  const monthlyTotal = toNum(input.financeProfile?.total_monthly_cost, sorted.reduce((s, item) => s + item.monthly_amount, 0));
  const concentration = monthlyTotal > 0 ? topTotal / monthlyTotal : 0;

  const recommendations: OperatorRecommendation[] = [];

  if (concentration >= 0.58 && top.length >= 2) {
    recommendations.push({
      id: buildRecommendationId(input.userId, 'priority:concentration'),
      user_id: input.userId,
      type: 'priority_action',
      priority: priorityFromSignals(concentration, 0.65, 0.78),
      title: 'Prioritize top-cost services first',
      summary: 'Most recurring spend is concentrated in a few subscriptions.',
      reasoning: `Top ${top.length} services account for ${(concentration * 100).toFixed(0)}% of recurring spend.`,
      estimated_impact: {
        currency: 'USD',
        monthly_savings: Math.round(topTotal * 0.15 * 100) / 100,
        yearly_savings: Math.round(topTotal * 1.8 * 100) / 100,
      },
      confidence: 0.78,
      suggested_actions: [
        `Audit ${top[0].merchant} and ${top[1].merchant} first.`,
        'Check downgrade tiers before cancelling critical services.',
      ],
      source: 'finance_profiles.active_subscriptions',
      created_at: now,
      updated_at: now,
    });
  }

  const weakValue = subscriptions
    .filter((sub) => typeof sub.usage_score === 'number' && sub.usage_score <= 0.35)
    .sort((a, b) => b.monthly_amount - a.monthly_amount)
    .slice(0, 2);

  if (weakValue.length > 0) {
    const monthly = weakValue.reduce((sum, item) => sum + item.monthly_amount, 0);
    recommendations.push({
      id: buildRecommendationId(input.userId, 'behavior:review_low_usage'),
      user_id: input.userId,
      type: 'behavior_improvement',
      priority: priorityFromSignals(Math.min(1, monthly / 50), 0.55, 0.74),
      title: 'Set a monthly low-usage cleanup habit',
      summary: 'A recurring cleanup cadence can prevent low-value spend creep.',
      reasoning: `${weakValue.length} subscriptions have low usage signals with roughly $${monthly.toFixed(2)}/month at risk.`,
      estimated_impact: {
        currency: 'USD',
        monthly_savings: Math.round(monthly * 100) / 100,
        yearly_savings: Math.round(monthly * 12 * 100) / 100,
        time_savings_hours_month: 0.5,
      },
      confidence: 0.74,
      suggested_actions: [
        'Review low-usage subscriptions once per month.',
        'Cancel or pause one low-value subscription each cycle.',
      ],
      source: 'finance_profiles.active_subscriptions',
      created_at: now,
      updated_at: now,
    });
  }

  return recommendations;
}

function dedupeRecommendations(recommendations: OperatorRecommendation[]): OperatorRecommendation[] {
  const seen = new Set<string>();
  const deduped: OperatorRecommendation[] = [];

  for (const recommendation of recommendations) {
    const dedupeKey = `${recommendation.type}:${recommendation.title.toLowerCase()}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    deduped.push(recommendation);
  }

  return deduped;
}

function sortRecommendations(recommendations: OperatorRecommendation[]): OperatorRecommendation[] {
  const priorityWeight: Record<RecommendationPriority, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  return [...recommendations].sort((a, b) => {
    const aWeight = priorityWeight[a.priority] * 100 + a.confidence * 10;
    const bWeight = priorityWeight[b.priority] * 100 + b.confidence * 10;
    return bWeight - aWeight;
  });
}

export function generateOperatorRecommendations(input: RecommendationInput): OperatorRecommendation[] {
  const now = new Date().toISOString();
  const alertDerived = input.operatorAlerts
    .filter((alert) => alert.status === 'active')
    .map((alert) => mapAlertRecommendation(alert, input.userId, now))
    .filter((item): item is OperatorRecommendation => Boolean(item));

  const profileDerived = deriveProfileRecommendations(input, now);
  const combined = dedupeRecommendations([...alertDerived, ...profileDerived]);
  const sorted = sortRecommendations(combined);

  const limit = Math.min(5, Math.max(3, input.limit || 4));
  return sorted.slice(0, limit);
}
