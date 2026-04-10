'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CircleDollarSign, Mail, TrendingUp, WalletCards } from 'lucide-react';
import { useAppStore } from '../store/app-store';

type DashboardPayload = {
  stats: {
    monthlyTotal: number;
    estimatedSavings: number;
    activeSubscriptions: number;
  };
  topSavingsOpportunities: Array<{
    merchant: string;
    amount: number;
    reason: string;
    urgency: string;
  }>;
  recentActions: Array<{
    title: string;
    summary: string;
    date: string;
  }>;
  proactiveInsights: Array<{
    id: string;
    title: string;
    summary: string;
    reason: string;
    priority: 'low' | 'medium' | 'high';
  }>;
  timeline: Array<{
    date: string;
    label: string;
    type: string;
  }>;
  profileSummary: string;
  gmailImport: {
    lastSyncedAt: string | null;
    emailsAnalyzed: number;
    subscriptionsFound: number;
    recurringPaymentsFound: number;
    summary: string;
  };
};

const emptyState: DashboardPayload = {
  stats: { monthlyTotal: 0, estimatedSavings: 0, activeSubscriptions: 0 },
  topSavingsOpportunities: [],
  recentActions: [],
  proactiveInsights: [],
  timeline: [],
  profileSummary: '',
  gmailImport: {
    lastSyncedAt: null,
    emailsAnalyzed: 0,
    subscriptionsFound: 0,
    recurringPaymentsFound: 0,
    summary: '',
  },
};

const formatDate = (iso: string) => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export default function MoneyPage() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const enqueuePromptAndGoToChat = useAppStore((s) => s.enqueuePromptAndGoToChat);
  const [data, setData] = useState<DashboardPayload>(emptyState);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) {
      setData(emptyState);
      setLoading(false);
      return;
    }

    setLoading(true);
    const response = await fetch(`/api/finance/dashboard?userId=${encodeURIComponent(user.id)}`, { cache: 'no-store' });
    if (!response.ok) {
      setData(emptyState);
      setLoading(false);
      return;
    }
    const payload = (await response.json()) as DashboardPayload;
    setData({ ...emptyState, ...payload, gmailImport: { ...emptyState.gmailImport, ...(payload.gmailImport || {}) } });
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const refresh = () => {
      void load();
    };

    window.addEventListener('finance:data-updated', refresh as EventListener);
    return () => {
      window.removeEventListener('finance:data-updated', refresh as EventListener);
    };
  }, [load]);

  const headline = useMemo(() => {
    if (loading) return 'Loading finance intelligence…';
    if (!user?.id) return 'Sign in to load your finance memory.';
    if (data.profileSummary) return data.profileSummary;
    return 'Your dashboard updates automatically as the agent analyzes your finances.';
  }, [data.profileSummary, loading, user?.id]);

  const openAction = (prompt: string) => {
    enqueuePromptAndGoToChat(prompt);
    router.push('/chat');
  };

  return (
    <main className="screen app-bg">
      <header className="card-surface mb-4 px-6 pt-6 pb-4">
        <h1 className="text-[2rem] font-semibold tracking-tight text-primary">Money Intelligence</h1>
        <p className="text-sm text-secondary">Persistent finance dashboard powered by your memory profile.</p>
      </header>

      <section className="space-y-4">
        <article className="card-elevated p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#c9ced6]">Finance Summary</p>
          <p className="mt-2 text-sm text-secondary">{headline}</p>
        </article>

        <article className="card-surface p-5">
          <div className="flex items-center gap-2 text-xs text-secondary"><Mail className="h-4 w-4" /> Gmail import status</div>
          <p className="mt-2 text-sm text-primary">
            Last sync: {data.gmailImport.lastSyncedAt ? formatDate(data.gmailImport.lastSyncedAt) : 'Never'} · Emails analyzed: {data.gmailImport.emailsAnalyzed}
          </p>
          <p className="mt-1 text-xs text-secondary">
            Subscriptions found: {data.gmailImport.subscriptionsFound} · Recurring payments: {data.gmailImport.recurringPaymentsFound}
          </p>
          {data.gmailImport.summary ? <p className="mt-2 text-xs text-secondary">{data.gmailImport.summary}</p> : null}
        </article>

        <div className="grid grid-cols-2 gap-3">
          <article className="card-surface p-4">
            <div className="flex items-center gap-2 text-xs text-secondary"><WalletCards className="h-4 w-4" /> Monthly total</div>
            <p className="mt-2 text-2xl font-semibold text-primary">${Math.round(data.stats.monthlyTotal)}</p>
          </article>
          <article className="card-surface p-4">
            <div className="flex items-center gap-2 text-xs text-secondary"><TrendingUp className="h-4 w-4" /> Potential savings</div>
            <p className="mt-2 text-2xl font-semibold text-primary">${Math.round(data.stats.estimatedSavings)}</p>
          </article>
        </div>

        <article className="card-surface p-5">
          <h2 className="mb-3 text-lg font-semibold text-primary">Proactive insights</h2>
          <div className="space-y-2">
            {data.proactiveInsights.length === 0 ? (
              <p className="rounded-xl bg-[#f2f2f2] px-3 py-3 text-sm text-secondary">No high-priority insights yet.</p>
            ) : (
              data.proactiveInsights.map((insight) => (
                <div key={insight.id} className="card-interactive rounded-2xl px-3 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-primary">{insight.title}</p>
                    <span className="badge">{insight.priority}</span>
                  </div>
                  <p className="mt-1 text-xs text-secondary">{insight.summary}</p>
                  <p className="mt-1 text-[11px] text-[#5a5a5a]">{insight.reason}</p>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="card-surface p-5">
          <h2 className="mb-3 text-lg font-semibold text-primary">Top savings opportunities</h2>
          <div className="space-y-2">
            {data.topSavingsOpportunities.slice(0, 5).map((item) => (
              <div key={`${item.merchant}-${item.amount}`} className="card-interactive rounded-2xl px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-primary">{item.merchant}</p>
                  <p className="text-sm text-primary">${Math.round(item.amount)}/mo</p>
                </div>
                <p className="text-xs text-secondary">{item.reason}</p>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => openAction('Create a prioritized savings plan based on my top opportunities.')}
            className="btn-primary mt-3 px-4 py-2 text-sm"
          >
            Create savings plan
          </button>
        </article>

        <article className="card-surface p-5">
          <h2 className="mb-3 text-lg font-semibold text-primary">Recent finance actions</h2>
          <div className="space-y-2">
            {data.recentActions.length === 0 ? (
              <p className="rounded-xl bg-[#f2f2f2] px-3 py-3 text-sm text-secondary">No finance actions yet.</p>
            ) : (
              data.recentActions.map((action) => (
                <div key={`${action.title}-${action.date}`} className="rounded-xl bg-[#f2f2f2] px-3 py-3">
                  <p className="text-sm font-medium text-primary">{action.title}</p>
                  <p className="text-xs text-secondary">{action.summary || 'Completed.'}</p>
                  <p className="mt-1 text-[11px] text-secondary">{formatDate(action.date)}</p>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="card-surface p-5">
          <h2 className="mb-3 text-lg font-semibold text-primary">Savings timeline</h2>
          <div className="space-y-2">
            {data.timeline.length === 0 ? (
              <p className="rounded-xl bg-[#f2f2f2] px-3 py-3 text-sm text-secondary">Timeline will populate after finance actions.</p>
            ) : (
              data.timeline.map((point) => (
                <div key={`${point.date}-${point.label}`} className="flex items-center justify-between rounded-xl bg-[#f2f2f2] px-3 py-2">
                  <p className="text-xs text-primary">{point.label}</p>
                  <p className="text-[11px] text-secondary">{formatDate(point.date)}</p>
                </div>
              ))
            )}
          </div>
          <p className="mt-3 text-xs text-secondary">Active subscriptions: {data.stats.activeSubscriptions}</p>
        </article>

        <article className="card-surface p-5">
          <div className="flex items-center gap-2 text-secondary"><CircleDollarSign className="h-4 w-4" />Uses finance_profiles + finance_history for persistent analysis.</div>
          <div className="mt-2 flex items-center gap-2 text-secondary"><AlertTriangle className="h-4 w-4" />Insights are selective (top 1-3 only) to avoid noise.</div>
        </article>
      </section>
    </main>
  );
}
