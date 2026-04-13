'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Crown, Gem, Sparkles, Zap } from 'lucide-react';
import { useAppStore } from '../store/app-store';
import { useUserEntitlements } from '../hooks/use-user-entitlements';
import { AppShell, PremiumCard, ProductPageHeader, SectionHeader, SmartButton } from '../components/premium-ui';
import { MetricGrid } from '../components/product-sections';

export default function UpgradePage() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const { plan, usage, refresh } = useUserEntitlements();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPremium = useMemo(() => plan === 'PREMIUM', [plan]);

  const startUpgrade = async () => {
    if (!user) {
      router.push('/login?next=/upgrade');
      return;
    }
    setError(null);
    setIsUpgrading(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, planId: 'PREMIUM' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Upgrade failed.');
      await refresh();
      router.push('/chat');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upgrade failed. Please try again.');
      setIsUpgrading(false);
    }
  };

  return (
    <AppShell>
      <ProductPageHeader pageTitle="Upgrade" pageSubtitle="Premium plans for power users and teams" />
      <div className="space-y-3">
        <PremiumCard className="overflow-hidden p-0">
          <div className="bg-gradient-to-br from-[#111111] to-[#2a2a2d] p-5 text-white">
            <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-white/80"><Gem className="h-3.5 w-3.5" /> Premium Intelligence</p>
            <h2 className="mt-2 text-2xl font-semibold">Ship faster with Kivo Pro</h2>
            <p className="mt-1 text-sm text-white/80">Higher limits, smarter automations, and priority execution quality.</p>
          </div>
          <div className="p-4">
            <MetricGrid items={[
              { label: 'Runs', value: usage.unlimited ? '∞' : String(usage.limit), detail: 'daily limit' },
              { label: 'Used', value: String(usage.current), detail: 'today' },
              { label: 'Plan', value: isPremium ? 'Pro' : 'Free', detail: 'current' },
            ]} />
          </div>
        </PremiumCard>

        <PremiumCard className="space-y-2 p-4">
          <SectionHeader title="Plan comparison" subtitle="Clear benefits and usage limits" />
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-[16px] border border-[#e7eaf0] bg-[#fcfcfd] p-3">
              <p className="inline-flex items-center gap-1 text-sm font-semibold text-[#111111]"><Crown className="h-4 w-4" /> Free</p>
              <p className="mt-2 text-xs text-[#616773]">10 runs/day · core tools · standard queue</p>
            </div>
            <div className="rounded-[16px] border border-[#111111] bg-[#111111] p-3 text-white">
              <p className="inline-flex items-center gap-1 text-sm font-semibold"><Sparkles className="h-4 w-4" /> Premium</p>
              <p className="mt-2 text-xs text-white/80">1000 runs/day · attachments · priority execution</p>
            </div>
          </div>
          <ul className="space-y-1 text-sm text-[#111111]">
            <li className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Advanced memory and workflow automations</li>
            <li className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Premium connectors and richer context windows</li>
            <li className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Priority model orchestration and faster response times</li>
          </ul>
        </PremiumCard>

        {error ? <p className="rounded-xl border border-[#f0d0d0] bg-[#fff5f5] px-3 py-2 text-sm text-[#913c3c]">{error}</p> : null}

        <SmartButton type="button" disabled={isPremium || isUpgrading} onClick={() => void startUpgrade()} className="w-full">
          <Zap className="mr-2 h-4 w-4" /> {isPremium ? 'You are on Premium' : isUpgrading ? 'Upgrading…' : 'Upgrade to Premium'}
        </SmartButton>
      </div>
    </AppShell>
  );
}
