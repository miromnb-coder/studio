type InsightPriority = 'low' | 'medium' | 'high';

export type ProactiveInsight = {
  id: string;
  title: string;
  summary: string;
  reason: string;
  priority: InsightPriority;
  contextPrompt: string;
  actionType?: 'open_chat' | 'create_savings_plan' | 'find_alternatives' | 'draft_cancellation' | 'review_subscription';
};

function toNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asObject(input: unknown): Record<string, unknown> {
  return typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};
}

function normalizeMonthlyAmount(sub: Record<string, unknown>): number {
  const amount =
    toNumber(sub.monthly_amount, Number.NaN) ||
    toNumber(sub.monthlyAmount, Number.NaN) ||
    toNumber(sub.amount, Number.NaN);
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const period = String(sub.period || sub.billing_cycle || '').toLowerCase();
  return period.includes('year') ? safeAmount / 12 : safeAmount;
}

function findPendingAction(history: Array<Record<string, unknown>>) {
  return history.find((event) => String(asObject(event.metadata).status || '').toLowerCase() === 'pending');
}

function wasRecentlySuggested(history: Array<Record<string, unknown>>, key: string): boolean {
  const now = Date.now();
  return history.some((event) => {
    if (String(event.event_type || '') !== 'proactive_insight') return false;
    const metadata = asObject(event.metadata);
    if (String(metadata.key || '') !== key) return false;
    const createdAt = new Date(String(event.created_at || '')).getTime();
    return Number.isFinite(createdAt) && now - createdAt < 1000 * 60 * 60 * 24 * 2;
  });
}

export function generateProactiveInsights(input: {
  profile: Record<string, unknown> | null;
  history: Array<Record<string, unknown>>;
}): ProactiveInsight[] {
  const { profile, history } = input;
  const insights: ProactiveInsight[] = [];
  const subs = Array.isArray(profile?.active_subscriptions) ? (profile!.active_subscriptions as Array<Record<string, unknown>>) : [];
  const unresolvedLeaks = Array.isArray(profile?.unresolved_leaks) ? (profile!.unresolved_leaks as Array<Record<string, unknown>>) : [];
  const gmail = asObject(asObject(profile?.last_analysis).gmail_integration);
  const trialRisks = Array.isArray(gmail.trial_risks) ? gmail.trial_risks.map((item) => String(item)).filter(Boolean) : [];

  const highestSub = [...subs]
    .map((sub, index) => ({
      id: String(sub.id || sub.subscription_id || sub.merchant || `sub-${index}`),
      merchant: String(sub.merchant || sub.name || 'Unknown'),
      monthlyCost: normalizeMonthlyAmount(sub),
      status: String(sub.status || 'active').toLowerCase(),
    }))
    .filter((sub) => sub.monthlyCost > 0 && !sub.status.includes('cancel'))
    .sort((a, b) => b.monthlyCost - a.monthlyCost)[0];

  if (highestSub && !wasRecentlySuggested(history, `highest-subscription-${highestSub.id}`)) {
    insights.push({
      id: `highest-subscription-${highestSub.id}`,
      title: `${highestSub.merchant} is your highest recurring charge`,
      summary: `$${Math.round(highestSub.monthlyCost)}/month is still active and unresolved.`,
      reason: 'Highest-cost unresolved recurring payment should be reviewed first for fastest impact.',
      priority: highestSub.monthlyCost >= 45 ? 'high' : 'medium',
      contextPrompt: `Review ${highestSub.merchant} ($${Math.round(highestSub.monthlyCost)}/month) and decide keep, downgrade, or cancel with concrete savings impact.`,
      actionType: 'review_subscription',
    });
  }

  const estimatedSavings = toNumber(profile?.estimated_savings, 0);
  if (estimatedSavings > 0 && !wasRecentlySuggested(history, 'unresolved-savings')) {
    insights.push({
      id: 'unresolved-savings',
      title: `You still have ~$${Math.round(estimatedSavings)}/month in open savings`,
      summary: 'No completed action has closed this savings gap yet.',
      reason: 'Existing opportunity is already known and should be converted into actions before new analysis.',
      priority: estimatedSavings >= 70 ? 'high' : 'medium',
      contextPrompt: `Create a concrete action plan to capture the remaining $${Math.round(estimatedSavings)}/month savings in priority order.`,
      actionType: 'create_savings_plan',
    });
  }

  if (trialRisks.length && !wasRecentlySuggested(history, 'gmail-trial-risk')) {
    insights.push({
      id: 'gmail-trial-risk',
      title: 'Potential trial or renewal risk detected from Gmail',
      summary: trialRisks[0],
      reason: 'Recent Gmail sync flagged a likely renewal risk that can become a recurring charge.',
      priority: 'high',
      contextPrompt: `Review this trial/renewal risk and draft a cancellation or reminder plan: ${trialRisks[0]}`,
      actionType: 'draft_cancellation',
    });
  }

  const pending = findPendingAction(history);
  if (pending && !wasRecentlySuggested(history, 'pending-finance-action')) {
    insights.push({
      id: 'pending-finance-action',
      title: 'A previous finance action is still pending',
      summary: String(pending.summary || pending.title || 'Pending action detected'),
      reason: 'Finishing pending actions compounds results faster than starting new tasks.',
      priority: 'medium',
      contextPrompt: `Resume and complete this pending finance action: ${String(pending.summary || pending.title || 'Pending action')}`,
      actionType: 'open_chat',
    });
  }

  if (unresolvedLeaks.length && !wasRecentlySuggested(history, 'unresolved-leaks')) {
    const topLeak = unresolvedLeaks[0];
    const amount = toNumber(topLeak.amount, 0);
    insights.push({
      id: 'unresolved-leaks',
      title: 'Unresolved leak remains open',
      summary: amount > 0 ? `At least $${Math.round(amount)}/month is still recoverable.` : 'Leak signal is unresolved.',
      reason: 'Unresolved leak signals indicate known waste that has not been closed.',
      priority: amount >= 40 ? 'high' : 'medium',
      contextPrompt: `Investigate unresolved leak and propose the fastest fix with savings estimate: ${JSON.stringify(topLeak)}`,
      actionType: 'find_alternatives',
    });
  }

  const score = (insight: ProactiveInsight) => (insight.priority === 'high' ? 3 : insight.priority === 'medium' ? 2 : 1);
  return insights.sort((a, b) => score(b) - score(a)).slice(0, 3);
}

export async function processInboundEvent() {
  return { ok: true };
}

export async function triggerProactiveFlow() {
  return { ok: true };
}

export async function scanForSignals(_userId: string, _content: string, _sourceId?: string) {
  return { ok: true };
}
