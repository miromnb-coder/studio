'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bell, LogOut } from 'lucide-react';
import { useAppStore } from './store/app-store';
import { createClient } from '@/lib/supabase/client';
import { DashboardHero } from './components/dashboard/DashboardHero';
import { ProactiveInsights } from './components/dashboard/ProactiveInsights';
import { SubscriptionsList } from './components/dashboard/SubscriptionsList';
import { SavingsChart } from './components/dashboard/SavingsChart';
import { OpportunitiesList } from './components/dashboard/OpportunitiesList';
import { RecentActivity } from './components/dashboard/RecentActivity';
import type { DashboardPayload, DashboardInsight, OpportunityItem, SubscriptionItem } from './components/dashboard/types';

const emptyState: DashboardPayload = {
  stats: { monthlyTotal: 0, estimatedSavings: 0, activeSubscriptions: 0 },
  subscriptions: [],
  topOpportunities: [],
  recentActions: [],
  proactiveInsights: [],
  savingsSeries: [],
  profileSummary: '',
};

export default function HomePage() {
  const router = useRouter();
  const hydrated = useAppStore((s) => s.hydrated);
  const hydrate = useAppStore((s) => s.hydrate);
  const user = useAppStore((s) => s.user);
  const enqueuePromptAndGoToChat = useAppStore((s) => s.enqueuePromptAndGoToChat);
  const updateUserName = useAppStore((s) => s.updateUserName);
  const clearUser = useAppStore((s) => s.clearUser);
  const supabase = useMemo(() => createClient(), []);

  const [data, setData] = useState<DashboardPayload>(emptyState);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrate, hydrated]);

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      if (!user?.id) {
        if (mounted) {
          setData(emptyState);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      const response = await fetch(`/api/finance/dashboard?userId=${encodeURIComponent(user.id)}`, { cache: 'no-store' });
      if (!mounted) return;

      if (!response.ok) {
        setData(emptyState);
        setLoading(false);
        return;
      }

      const payload = (await response.json()) as DashboardPayload;
      setData({ ...emptyState, ...payload });
      setLoading(false);
    };

    void loadDashboard();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const editName = () => {
    const nextName = window.prompt('Edit name', user?.name || '');
    if (!nextName?.trim()) return;

    updateUserName(nextName.trim());
    if (user?.id) {
      void supabase.from('profiles').upsert(
        {
          id: user.id,
          full_name: nextName.trim(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
      );
    }
    void supabase.auth.updateUser({ data: { full_name: nextName.trim() } });
  };

  const logout = async () => {
    await supabase.auth.signOut();
    clearUser();
    window.location.href = '/login';
  };

  const openInChat = useCallback(
    (prompt: string) => {
      enqueuePromptAndGoToChat(prompt);
      router.push('/chat');
    },
    [enqueuePromptAndGoToChat, router],
  );

  const openInsight = (insight: DashboardInsight) => openInChat(insight.contextPrompt);

  const openSubscription = (subscription: SubscriptionItem) => {
    openInChat(
      `Review my ${subscription.name} subscription (${Math.round(subscription.monthlyCost)}/month, status: ${subscription.rawStatus}). Tell me if I should keep, downgrade, or cancel.`,
    );
  };

  const openOpportunity = (item: OpportunityItem) => openInChat(item.contextPrompt);

  const hasData = data.subscriptions.length > 0 || data.recentActions.length > 0 || data.proactiveInsights.length > 0;

  return (
    <main className="screen app-bg pb-24">
      <section className="mb-4 flex items-center justify-between rounded-2xl bg-[#f7f7f7] px-4 py-3">
        <div>
          <p className="text-lg font-semibold text-primary">Operator Dashboard</p>
          <button onClick={editName} type="button" className="text-xs text-secondary">{user?.name || 'Set your name'}</button>
        </div>
        <div className="flex items-center gap-1">
          <Link href="/alerts" className="tap-feedback rounded-full p-2 text-secondary"><Bell className="h-5 w-5" /></Link>
          <button type="button" onClick={logout} className="tap-feedback rounded-full p-2 text-secondary"><LogOut className="h-5 w-5" /></button>
        </div>
      </section>

      {!user?.id ? (
        <section className="card-elevated p-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-primary">Sign in to activate your control center</h1>
          <p className="mt-2 text-sm text-secondary">Your subscriptions and savings intelligence load from your secure Supabase profile.</p>
          <Link href="/login" className="btn-primary mt-4 inline-flex px-4 py-2 text-sm">Go to login</Link>
        </section>
      ) : !hasData && !loading ? (
        <section className="card-elevated dashboard-reveal space-y-4 p-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-primary">Your dashboard is ready for first analysis</h1>
          <p className="text-sm text-secondary">Paste your subscriptions to analyze, and the operator will build savings actions automatically.</p>
          <button
            type="button"
            className="btn-primary mx-auto inline-flex px-4 py-2 text-sm"
            onClick={() => openInChat('Paste your subscriptions to analyze and build my first savings dashboard.')}
          >
            Paste your subscriptions to analyze
          </button>
        </section>
      ) : (
        <section className="space-y-4">
          <DashboardHero
            monthlySavings={data.stats.estimatedSavings}
            monthlyCost={data.stats.monthlyTotal}
            activeSubscriptions={data.stats.activeSubscriptions}
            loading={loading}
          />

          <ProactiveInsights insights={data.proactiveInsights} onOpenInsight={openInsight} />

          <SubscriptionsList subscriptions={data.subscriptions} onOpenSubscription={openSubscription} />

          <SavingsChart points={data.savingsSeries} />

          <OpportunitiesList opportunities={data.topOpportunities} onOpenOpportunity={openOpportunity} />

          <RecentActivity actions={data.recentActions} />
        </section>
      )}
    </main>
  );
}
