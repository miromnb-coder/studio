import { NextResponse } from 'next/server';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';

type DashboardInsight = {
  id: string;
  title: string;
  detail: string;
  severity: 'low' | 'medium' | 'high';
  contextPrompt: string;
};

type SubscriptionItem = {
  id: string;
  name: string;
  monthlyCost: number;
  status: 'active' | 'issue';
  rawStatus: string;
};

type OpportunityItem = {
  id: string;
  title: string;
  detail: string;
  monthlyImpact: number;
  contextPrompt: string;
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
  if (period.includes('year') || period.includes('annual')) return safeAmount / 12;
  return safeAmount;
}

function getSubscriptionStatus(sub: Record<string, unknown>): { status: 'active' | 'issue'; rawStatus: string } {
  const rawStatus = String(sub.status || 'active').toLowerCase();
  const reason = String(sub.reason || '').toLowerCase();
  const urgency = String(sub.urgency || '').toLowerCase();

  if (
    rawStatus.includes('issue') ||
    rawStatus.includes('trial') ||
    rawStatus.includes('duplicate') ||
    reason.includes('duplicate') ||
    reason.includes('unused') ||
    urgency === 'high'
  ) {
    return { status: 'issue', rawStatus: rawStatus || 'issue' };
  }

  return { status: 'active', rawStatus: rawStatus || 'active' };
}

function buildSubscriptions(profile: Record<string, unknown> | null): SubscriptionItem[] {
  const subs = Array.isArray(profile?.active_subscriptions) ? (profile!.active_subscriptions as Array<Record<string, unknown>>) : [];

  return subs
    .map((sub, index) => {
      const { status, rawStatus } = getSubscriptionStatus(sub);
      return {
        id: String(sub.id || sub.subscription_id || sub.merchant || sub.name || `sub-${index}`),
        name: String(sub.merchant || sub.name || 'Unknown subscription'),
        monthlyCost: Math.round(normalizeMonthlyAmount(sub) * 100) / 100,
        status,
        rawStatus,
      };
    })
    .filter((sub) => !sub.rawStatus.includes('cancel'))
    .sort((a, b) => b.monthlyCost - a.monthlyCost);
}

function parsePotentialSavings(row: Record<string, unknown>): number {
  const metadata = asObject(row.metadata);
  const direct =
    toNumber(metadata.estimated_savings, Number.NaN) ||
    toNumber(metadata.estimatedMonthlySavings, Number.NaN) ||
    toNumber(metadata.savings_monthly, Number.NaN) ||
    toNumber(metadata.monthly_savings, Number.NaN) ||
    toNumber(metadata.savings, Number.NaN) ||
    toNumber(metadata.amount, Number.NaN);

  if (Number.isFinite(direct)) return Math.max(0, direct);

  const summary = String(row.summary || row.title || '');
  const regex = /(?:\$|€|£)\s*(\d+(?:\.\d+)?)/g;
  const matches = [...summary.matchAll(regex)].map((match) => Number(match[1]));
  if (!matches.length) return 0;
  return Math.max(0, Math.max(...matches));
}

function buildSavingsSeries(
  history: Array<Record<string, unknown>>,
  estimatedSavings: number,
): Array<{ label: string; value: number }> {
  const chronological = [...history].reverse();
  const points = chronological.map((row) => {
    const date = new Date(String(row.created_at || ''));
    const label = Number.isNaN(date.getTime())
      ? 'Update'
      : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const eventType = String(row.event_type || '').toLowerCase();
    const candidate = parsePotentialSavings(row);
    const isSavingsSignal =
      eventType.includes('saving') || eventType.includes('opportun') || eventType.includes('analysis') || candidate > 0;

    return {
      label,
      value: isSavingsSignal ? candidate : 0,
    };
  });

  const reduced = points.slice(-6);
  const maxValue = Math.max(estimatedSavings, ...reduced.map((point) => point.value));

  if (!reduced.length) {
    return [
      { label: 'Now', value: Math.max(0, estimatedSavings) },
    ];
  }

  return reduced.map((point, idx) => ({
    label: point.label,
    value: idx === reduced.length - 1 ? Math.max(point.value, estimatedSavings, maxValue * 0.45) : point.value,
  }));
}

function buildInsights(
  profile: Record<string, unknown> | null,
  history: Array<Record<string, unknown>>,
  subscriptions: SubscriptionItem[],
): DashboardInsight[] {
  const insights: DashboardInsight[] = [];
  const estimatedSavings = toNumber(profile?.estimated_savings, 0);

  if (estimatedSavings > 0) {
    insights.push({
      id: 'savings-open',
      title: `You can still save about $${Math.round(estimatedSavings)}/month`,
      detail: 'Ask the operator to prioritize the fastest, lowest-effort savings actions first.',
      severity: estimatedSavings >= 60 ? 'high' : 'medium',
      contextPrompt: `Create a ranked savings action plan to recover $${Math.round(estimatedSavings)} per month. Focus on quick wins first.`,
    });
  }

  const topSubscription = subscriptions[0];
  if (topSubscription && topSubscription.monthlyCost > 0) {
    insights.push({
      id: 'highest-subscription',
      title: `${topSubscription.name} is your highest recurring cost`,
      detail: `$${Math.round(topSubscription.monthlyCost)}/month. Check if downgrade or alternatives can reduce this spend.`,
      severity: topSubscription.monthlyCost >= 40 ? 'high' : 'medium',
      contextPrompt: `Review ${topSubscription.name} at $${Math.round(topSubscription.monthlyCost)}/month and suggest downgrade or replacement options with concrete savings.`,
    });
  }

  const issueSubscription = subscriptions.find((sub) => sub.status === 'issue');
  if (issueSubscription) {
    insights.push({
      id: `issue-${issueSubscription.id}`,
      title: `${issueSubscription.name} may need attention`,
      detail: `Status signal: ${issueSubscription.rawStatus || 'issue detected'}. Validate whether this charge is still needed.`,
      severity: 'medium',
      contextPrompt: `Investigate why ${issueSubscription.name} is flagged as "${issueSubscription.rawStatus}" and recommend the safest next action.`,
    });
  }

  if (insights.length < 3) {
    const pendingAction = history.find((event) => {
      const metadata = asObject(event.metadata);
      return String(metadata.status || '').toLowerCase() === 'pending';
    });

    if (pendingAction) {
      insights.push({
        id: 'pending-action',
        title: 'A finance action is still pending',
        detail: String(pendingAction.summary || pendingAction.title || 'Finish the pending action to lock in results.'),
        severity: 'low',
        contextPrompt: `Resume this pending finance action: ${String(pendingAction.summary || pendingAction.title || 'pending task')}.`,
      });
    }
  }

  return insights.slice(0, 3);
}

function buildOpportunities(subscriptions: SubscriptionItem[]): OpportunityItem[] {
  return subscriptions
    .filter((subscription) => subscription.monthlyCost > 0)
    .slice(0, 3)
    .map((subscription, index) => {
      const isIssue = subscription.status === 'issue';
      const title = isIssue
        ? `Resolve potential waste in ${subscription.name}`
        : `Optimize ${subscription.name} monthly spend`;
      const detail = isIssue
        ? `This subscription has a flagged status (${subscription.rawStatus}). Verifying usage could recover up to $${Math.round(subscription.monthlyCost)}/month.`
        : `At $${Math.round(subscription.monthlyCost)}/month, a lower tier or alternative may reduce recurring cost.`;

      return {
        id: `${subscription.id}-${index}`,
        title,
        detail,
        monthlyImpact: subscription.monthlyCost,
        contextPrompt: isIssue
          ? `I want to investigate ${subscription.name}. It's flagged as ${subscription.rawStatus} and costs $${Math.round(subscription.monthlyCost)}/month. Give me the exact next steps.`
          : `Find ways to lower my ${subscription.name} cost (${Math.round(subscription.monthlyCost)}/month) with minimal disruption.`,
      };
    });
}

function buildLegacyTopSavings(subscriptions: SubscriptionItem[]) {
  return subscriptions.slice(0, 5).map((subscription) => ({
    merchant: subscription.name,
    amount: subscription.monthlyCost,
    reason:
      subscription.status === 'issue'
        ? `Flagged as ${subscription.rawStatus}; review for possible cancellation or duplicate billing.`
        : 'Recurring expense with optimization potential.',
    urgency: subscription.status === 'issue' ? 'high' : 'medium',
  }));
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
    }

    const supabase = await createSupabaseServerClient();

    const [profileResult, historyResult] = await Promise.all([
      supabase.from('finance_profiles').select('*').eq('user_id', userId).maybeSingle(),
      supabase
        .from('finance_history')
        .select('event_type,title,summary,metadata,created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(24),
    ]);

    const profile = (profileResult.data || null) as Record<string, unknown> | null;
    const history = (historyResult.data || []) as Array<Record<string, unknown>>;
    const subscriptions = buildSubscriptions(profile);

    const monthlyTotal = toNumber(profile?.total_monthly_cost, 0);
    const estimatedSavings = toNumber(profile?.estimated_savings, 0);

    return NextResponse.json({
      stats: {
        monthlyTotal,
        estimatedSavings,
        activeSubscriptions: subscriptions.length,
      },
      subscriptions,
      topOpportunities: buildOpportunities(subscriptions),
      topSavingsOpportunities: buildLegacyTopSavings(subscriptions),
      recentActions: history.slice(0, 6).map((row) => ({
        title: String(row.title || row.event_type || 'Finance action'),
        summary: String(row.summary || ''),
        date: String(row.created_at || ''),
      })),
      proactiveInsights: buildInsights(profile, history, subscriptions),
      savingsSeries: buildSavingsSeries(history, estimatedSavings),
      timeline: history
        .slice(0, 12)
        .map((row) => ({
          date: row.created_at,
          label: row.title || row.event_type || 'Finance update',
          type: row.event_type || 'event',
        }))
        .reverse(),
      profileSummary: String(profile?.memory_summary || ''),
    });
  } catch (error) {
    console.error('FINANCE_DASHBOARD_ROUTE_ERROR:', error);
    return NextResponse.json({ error: 'DASHBOARD_FETCH_FAILED' }, { status: 500 });
  }
}
