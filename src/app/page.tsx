'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bell, LogOut, Mail, Sparkles, Wallet, AlertTriangle } from 'lucide-react';
import { useAppStore } from './store/app-store';
import { createClient } from '@/lib/supabase/client';
import { DashboardHero } from './components/dashboard/DashboardHero';
import { ProactiveInsights } from './components/dashboard/ProactiveInsights';
import { SubscriptionsList } from './components/dashboard/SubscriptionsList';
import { SavingsChart } from './components/dashboard/SavingsChart';
import { OpportunitiesList } from './components/dashboard/OpportunitiesList';
import { RecentActivity } from './components/dashboard/RecentActivity';
import type { DashboardPayload, DashboardInsight, OpportunityItem, SubscriptionItem } from './components/dashboard/types';
import {
  AIOrb,
  AIStatusPill,
  AnimatedNumber,
  AppShell,
  EmptyState,
  PremiumCard,
  SectionHeader,
  SmartButton,
  StatCard,
  ActionRow,
} from './components/premium-ui';

const emptyState: DashboardPayload = {
  stats: { monthlyTotal: 0, estimatedSavings: 0, activeSubscriptions: 0 },
  subscriptions: [],
  topOpportunities: [],
  recentActions: [],
  proactiveInsights: [],
  savingsSeries: [],
  profileSummary: '',
};

class DashboardSectionBoundary extends React.Component<{ title: string; children: ReactNode }, { hasError: boolean }> {
  constructor(props: { title: string; children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error(`DASHBOARD_SECTION_ERROR:${this.props.title}`, error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <PremiumCard className="p-4">
          <h2 className="text-base font-semibold text-[#22262c]">{this.props.title}</h2>
          <p className="mt-2 text-sm text-[#8791a0]">This section is temporarily unavailable. Try refreshing the page.</p>
        </PremiumCard>
      );
    }

    return this.props.children;
  }
}

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
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    if (!user?.id) {
      setData(emptyState);
      setDashboardError(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setDashboardError(null);
      const response = await fetch(`/api/finance/dashboard?userId=${encodeURIComponent(user.id)}`, { cache: 'no-store' });

      if (!response.ok) {
        setData(emptyState);
        setDashboardError('We could not load your dashboard data right now.');
        setLoading(false);
        return;
      }

      const payload = (await response.json()) as DashboardPayload;
      setData({ ...emptyState, ...payload });
      setLoading(false);
    } catch (error) {
      console.error('HOME_DASHBOARD_FETCH_ERROR:', error);
      setData(emptyState);
      setDashboardError('We could not load your dashboard data right now.');
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrate, hydrated]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const refreshDashboard = () => {
      void loadDashboard();
    };
    window.addEventListener('finance:data-updated', refreshDashboard);
    window.addEventListener('focus', refreshDashboard);
    window.addEventListener('storage', refreshDashboard);
    return () => {
      window.removeEventListener('finance:data-updated', refreshDashboard);
      window.removeEventListener('focus', refreshDashboard);
      window.removeEventListener('storage', refreshDashboard);
    };
  }, [loadDashboard]);

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
  const showLoadingState = Boolean(user?.id) && loading;
  const primaryPrompt = hasData
    ? 'Continue from my highest impact opportunity and tell me the fastest next step.'
    : 'Analyze my subscriptions and create my first savings plan.';

  return (
    <AppShell>
      <header className="mb-4 rounded-[26px] border border-[#dde1e8] bg-white p-4 shadow-sm backdrop-blur-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-[#8791a0]">Welcome back, {user?.name || 'there'}</p>
            <h1 className="text-3xl font-semibold tracking-[-0.03em] text-[#22262c]">Kivo command center</h1>
            <button onClick={editName} type="button" className="mt-1 text-xs text-[#8791a0]">Edit profile name</button>
          </div>
          <div className="flex items-center gap-1">
            <Link href="/alerts" className="rounded-full border border-[#d6dce6] bg-white p-2 text-[#4e5662]"><Bell className="h-4 w-4" /></Link>
            <button type="button" onClick={logout} className="rounded-full border border-[#d6dce6] bg-white p-2 text-[#4e5662]"><LogOut className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="mt-3"><AIStatusPill status={loading ? 'Analyzing' : 'Ready'} /></div>
      </header>

      {!user?.id ? (
        <EmptyState
          title="Sign in to activate Premium Intelligence"
          message="Your operator syncs signals from your secure account and surfaces your next best actions."
          action={<Link href="/login"><SmartButton>Go to login</SmartButton></Link>}
        />
      ) : showLoadingState ? (
        <PremiumCard className="shimmer space-y-2 p-6 text-center">
          <AIOrb />
          <h2 className="text-xl font-semibold text-[#22262c]">Loading mission control</h2>
          <p className="text-sm text-[#8791a0]">Pulling your savings, tasks, and alerts.</p>
        </PremiumCard>
      ) : dashboardError ? (
        <EmptyState
          title="Dashboard unavailable"
          message={dashboardError}
          action={<SmartButton onClick={() => window.location.reload()}>Retry loading dashboard</SmartButton>}
        />
      ) : !hasData && !loading ? (
        <EmptyState
          title="Your first intelligence report is one step away"
          message="Run your first analysis and we’ll generate priorities, opportunities, and savings actions instantly."
          action={<SmartButton onClick={() => openInChat('Paste your subscriptions to analyze and build my first savings dashboard.')}>Run first analysis</SmartButton>}
        />
      ) : (
        <section className="space-y-4">
          <PremiumCard className="space-y-4 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#8791a0]">Start here</p>
                <p className="mt-1 text-sm text-[#4e5662]">One tap to get your next best financial move.</p>
                <p className="mt-3 text-xs uppercase tracking-wide text-zinc-500">Potential monthly savings</p>
                <AnimatedNumber value={data.stats.estimatedSavings} />
              </div>
              <AIOrb className="h-16 w-16" />
            </div>
            <p className="text-sm text-[#8791a0]">Top recommendation: Review your highest monthly subscription stack and remove duplicates.</p>
            <SmartButton onClick={() => openInChat(primaryPrompt)}>Open next recommendation</SmartButton>
          </PremiumCard>

          <div className="grid grid-cols-2 gap-3">
            <StatCard title="Total monthly spend" value={<AnimatedNumber value={data.stats.monthlyTotal} />} />
            <StatCard title="Active subscriptions" value={<span className="text-3xl font-semibold text-[#22262c]">{data.stats.activeSubscriptions}</span>} />
          </div>

          <PremiumCard className="p-4">
            <SectionHeader title="Priority right now" subtitle="Top 3 moves with highest impact" />
            <div className="space-y-2">
              {data.topOpportunities.slice(0, 3).map((item) => (
                <ActionRow key={item.id} title={item.title} description={item.summary} icon={<AlertTriangle className="h-4 w-4" />} onClick={() => openOpportunity(item)} />
              ))}
            </div>
          </PremiumCard>

          <PremiumCard className="p-4">
            <SectionHeader title="Quick actions" />
            <div className="grid grid-cols-2 gap-2.5">
              <ActionRow title="Check Gmail" description="Scan latest finance emails" icon={<Mail className="h-4 w-4" />} onClick={() => openInChat('Check Gmail for billing and subscription changes.')} />
              <ActionRow title="Optimize spending" description="Find reduction opportunities" icon={<Wallet className="h-4 w-4" />} onClick={() => openInChat('Optimize my current spending and list immediate wins.')} />
              <ActionRow title="Ask AI" description="Get strategic guidance" icon={<Sparkles className="h-4 w-4" />} onClick={() => openInChat('What should I improve this month?')} />
              <ActionRow title="Review alerts" description="Prioritize high-risk items" icon={<Bell className="h-4 w-4" />} onClick={() => router.push('/alerts')} />
            </div>
          </PremiumCard>

          <DashboardSectionBoundary title="Control center summary"><DashboardHero monthlySavings={data.stats.estimatedSavings} monthlyCost={data.stats.monthlyTotal} activeSubscriptions={data.stats.activeSubscriptions} loading={loading} /></DashboardSectionBoundary>
          <DashboardSectionBoundary title="Proactive insights"><ProactiveInsights insights={data.proactiveInsights} onOpenInsight={openInsight} /></DashboardSectionBoundary>
          <DashboardSectionBoundary title="Active subscriptions"><SubscriptionsList subscriptions={data.subscriptions} onOpenSubscription={openSubscription} /></DashboardSectionBoundary>
          <DashboardSectionBoundary title="Savings over time"><SavingsChart points={data.savingsSeries.map((point) => ({ date: point.label, savings: point.value }))} /></DashboardSectionBoundary>
          <DashboardSectionBoundary title="Top opportunities"><OpportunitiesList opportunities={data.topOpportunities} onOpenOpportunity={openOpportunity} /></DashboardSectionBoundary>
          <DashboardSectionBoundary title="Recent activity"><RecentActivity actions={data.recentActions} /></DashboardSectionBoundary>
        </section>
      )}
    </AppShell>
  );
}
