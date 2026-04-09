'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Crown, Zap, ShieldCheck, Sparkles } from 'lucide-react';
import { useAppStore } from '../store/app-store';
import { useUserEntitlements } from '../hooks/use-user-entitlements';

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
    <main className="screen app-bg">
      <section className="card-surface p-5">
        <div className="flex items-center gap-2 text-primary">
          <Crown className="h-5 w-5" />
          <h1 className="text-2xl font-semibold">Upgrade to Premium</h1>
        </div>
        <p className="mt-1 text-sm text-secondary">Get more daily intelligence runs, file tools, and a higher-throughput experience.</p>

        <div className="mt-4 grid gap-3">
          <article className="rounded-2xl border border-black/10 bg-[#f2f2f2] p-4">
            <p className="text-sm font-semibold">Free</p>
            <ul className="mt-2 space-y-1 text-sm text-secondary">
              <li>• 10 runs per day</li>
              <li>• Core chat tools</li>
              <li>• Standard queue</li>
            </ul>
          </article>

          <article className="rounded-2xl border border-black/10 bg-[#eceff8] p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <p className="text-sm font-semibold">Premium</p>
            </div>
            <ul className="mt-2 space-y-1 text-sm text-secondary">
              <li className="inline-flex items-center gap-1"><Zap className="h-3.5 w-3.5" /> 1000 runs per day</li>
              <li className="inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> File attachments in composer</li>
              <li>• Priority access to heavier workloads</li>
            </ul>
          </article>
        </div>

        <div className="mt-4 rounded-xl border border-black/10 bg-[#f7f7f7] px-3 py-2 text-sm text-secondary">
          Current plan: <span className="font-medium text-primary">{plan}</span> · Today: {usage.current}/{usage.limit} runs used.
        </div>

        {error ? <p className="mt-3 rounded-xl border border-[#dfc9c9] bg-[#f8eded] px-3 py-2 text-sm text-[#6e3030]">{error}</p> : null}

        <button
          type="button"
          disabled={isPremium || isUpgrading}
          onClick={() => void startUpgrade()}
          className="btn-primary tap-feedback mt-4 w-full px-4 py-2 text-sm disabled:opacity-60"
        >
          {isPremium ? 'You are on Premium' : isUpgrading ? 'Upgrading…' : 'Upgrade to Premium'}
        </button>
      </section>
    </main>
  );
}
