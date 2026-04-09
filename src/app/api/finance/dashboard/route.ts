import { NextResponse } from 'next/server';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';

type DashboardInsight = {
  id: string;
  title: string;
  detail: string;
  severity: 'low' | 'medium' | 'high';
};

function toNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function buildInsights(profile: Record<string, unknown> | null, history: Array<Record<string, unknown>>): DashboardInsight[] {
  const insights: DashboardInsight[] = [];
  const subs = Array.isArray(profile?.active_subscriptions) ? (profile!.active_subscriptions as Array<Record<string, unknown>>) : [];
  const estimatedSavings = toNumber(profile?.estimated_savings, 0);

  if (estimatedSavings > 0) {
    insights.push({
      id: 'savings-open',
      title: 'Unclaimed savings available',
      detail: `You still have about ${Math.round(estimatedSavings)} in monthly savings potential.`,
      severity: estimatedSavings >= 100 ? 'high' : 'medium',
    });
  }

  const topSub = [...subs]
    .map((sub) => ({
      merchant: String(sub.merchant || sub.name || 'Unknown'),
      amount: toNumber(sub.monthly_amount, toNumber(sub.amount, 0)),
      status: String(sub.status || 'active').toLowerCase(),
    }))
    .filter((sub) => sub.status !== 'cancelled')
    .sort((a, b) => b.amount - a.amount)[0];

  if (topSub && topSub.amount > 0) {
    insights.push({
      id: 'highest-subscription',
      title: `Highest recurring cost: ${topSub.merchant}`,
      detail: `${Math.round(topSub.amount)} per month. Consider alternatives or cancellation.`,
      severity: topSub.amount >= 50 ? 'high' : 'medium',
    });
  }

  const unresolvedAction = history.find((event) => {
    const metadata = (event.metadata || {}) as Record<string, unknown>;
    return String(metadata.status || '').toLowerCase() === 'pending';
  });

  if (unresolvedAction) {
    insights.push({
      id: 'pending-action',
      title: 'Pending finance action',
      detail: String(unresolvedAction.summary || unresolvedAction.title || 'A previous finance action is still pending.'),
      severity: 'medium',
    });
  }

  return insights.slice(0, 3);
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
        .limit(20),
    ]);

    const profile = (profileResult.data || null) as Record<string, unknown> | null;
    const history = (historyResult.data || []) as Array<Record<string, unknown>>;
    const subscriptions = Array.isArray(profile?.active_subscriptions)
      ? (profile!.active_subscriptions as Array<Record<string, unknown>>)
      : [];

    const monthlyTotal = toNumber(profile?.total_monthly_cost, 0);
    const estimatedSavings = toNumber(profile?.estimated_savings, 0);

    const timeline = history
      .slice(0, 12)
      .map((row) => ({
        date: row.created_at,
        label: row.title || row.event_type || 'Finance update',
        type: row.event_type || 'event',
      }))
      .reverse();

    return NextResponse.json({
      stats: {
        monthlyTotal,
        estimatedSavings,
        activeSubscriptions: subscriptions.filter((sub) => String(sub.status || 'active').toLowerCase() !== 'cancelled').length,
      },
      topSavingsOpportunities: subscriptions
        .map((sub) => ({
          merchant: String(sub.merchant || sub.name || 'Unknown'),
          amount: toNumber(sub.monthly_amount, toNumber(sub.amount, 0)),
          reason: String(sub.reason || 'Recurring expense'),
          urgency: String(sub.urgency || 'medium'),
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5),
      recentActions: history.slice(0, 6).map((row) => ({
        title: String(row.title || row.event_type || 'Finance action'),
        summary: String(row.summary || ''),
        date: String(row.created_at || ''),
      })),
      proactiveInsights: buildInsights(profile, history),
      timeline,
      profileSummary: String(profile?.memory_summary || ''),
    });
  } catch (error) {
    console.error('FINANCE_DASHBOARD_ROUTE_ERROR:', error);
    return NextResponse.json({ error: 'DASHBOARD_FETCH_FAILED' }, { status: 500 });
  }
}
