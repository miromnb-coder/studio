'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Crown, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { useAppStore } from '../store/app-store';
import { useUserEntitlements } from '../hooks/use-user-entitlements';
import { AppShell, PremiumCard, SectionHeader, SmartButton } from '../components/premium-ui';

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

      if (!response.ok) {
        setError(data?.error || 'Upgrade failed. Please try again.');
        setIsUpgrading(false);
        return;
      }

      await refresh();
      router.push('/chat');
    } catch {
      setError('Upgrade failed. Please try again.');
      setIsUpgrading(false);
    }
  };

  return (
    <AppShell>
      <PremiumCard className="space-y-4 p-5">
        <SectionHeader title="Upgrade" subtitle="Unlock higher throughput and expanded automation capabilities." />

        <div className="grid gap-3">
          <PremiumCard className="space-y-2 p-4">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#22262c]"><Crown className="h-4 w-4" /> Free</p>
            <ul className="space-y-1 text-sm text-[#7a838f]">
              <li>• 10 runs per day</li>
              <li>• Core chat tools</li>
              <li>• Standard queue</li>
            </ul>
          </PremiumCard>

          <PremiumCard className="space-y-2 border-[#cfd6e1] bg-[#eef1f7] p-4">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#22262c]"><Sparkles className="h-4 w-4" /> Premium</p>
            <ul className="space-y-1 text-sm text-[#5f6877]">
              <li className="inline-flex items-center gap-1"><Zap className="h-3.5 w-3.5" /> 1000 runs per day</li>
              <li className="inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> File attachments in composer</li>
              <li>• Priority access to heavier workloads</li>
            </ul>
          </PremiumCard>
        </div>

        <PremiumCard className="p-4 text-sm text-[#7a838f]">
          Current plan: <span className="font-medium text-[#22262c]">{plan}</span> · Today: {usage.unlimited ? `Unlimited (Dev Mode) • ${usage.current} runs today` : `${usage.current}/${usage.limit} runs used`}.
        </PremiumCard>

        {error ? <p className="rounded-xl border border-[#dfc9c9] bg-[#f8eded] px-3 py-2 text-sm text-[#6e3030]">{error}</p> : null}

        <SmartButton type="button" disabled={isPremium || isUpgrading} onClick={() => void startUpgrade()} className="w-full" variant={isPremium ? 'secondary' : 'primary'}>
          {isPremium ? 'You are on Premium' : isUpgrading ? 'Upgrading…' : 'Upgrade to Premium'}
        </SmartButton>
      </PremiumCard>
    </AppShell>
  );
}
