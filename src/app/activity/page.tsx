'use client';

import { useEffect, useState } from 'react';
import { AppShell, PremiumCard, SectionHeader } from '../components/premium-ui';

type IntelligenceDigest = {
  score: number;
  weekly: {
    completed_actions: number;
    new_leaks_found: number;
    potential_monthly_savings: number;
  };
  monthly: {
    completed_actions: number;
    realized_monthly_impact: number;
    missed_opportunities: number;
    action_completion_rate: number;
    next_month_forecast: number;
  };
  highlights: string[];
};

type PersonalizationSnapshot = {
  profile_summary: string;
  price_sensitivity: 'low' | 'medium' | 'high';
  preferred_tone: 'supportive' | 'direct' | 'analytical';
  completion_behavior: 'executor' | 'explorer' | 'needs_nudges';
  reminder_timing: 'morning' | 'afternoon' | 'evening';
  focus_categories: string[];
};

export default function ActivityPage() {
  const [digest, setDigest] = useState<IntelligenceDigest | null>(null);
  const [personalization, setPersonalization] = useState<PersonalizationSnapshot | null>(null);

  useEffect(() => {
    const load = async () => {
      const [digestRes, personalizationRes] = await Promise.all([
        fetch('/api/operator/intelligence', { cache: 'no-store' }),
        fetch('/api/operator/personalization', { cache: 'no-store' }),
      ]);

      if (digestRes.ok) {
        const data = await digestRes.json();
        setDigest(data.digest || null);
      }
      if (personalizationRes.ok) {
        const data = await personalizationRes.json();
        setPersonalization(data.personalization || null);
      }
    };

    void load();
  }, []);

  return (
    <AppShell>
      <PremiumCard className="space-y-4 p-5">
        <SectionHeader title="Continuous Operator Intelligence" subtitle="Predictive signals, adaptive personalization, and recurring optimization." />
        <PremiumCard className="bg-white/[0.02] p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-400">Monthly financial score</p>
          <p className="mt-1 text-3xl font-semibold text-zinc-100">{digest?.score ?? '—'}</p>
          <p className="text-sm text-zinc-400">Updated from alert quality, completion velocity, and realized impact.</p>
        </PremiumCard>

        <div className="grid gap-3 md:grid-cols-2">
          <PremiumCard className="p-4">
            <p className="text-sm font-semibold text-zinc-100">Weekly savings review</p>
            <p className="mt-1 text-sm text-zinc-400">Completed actions: {digest?.weekly.completed_actions ?? 0}</p>
            <p className="text-sm text-zinc-400">New leaks found: {digest?.weekly.new_leaks_found ?? 0}</p>
            <p className="text-sm text-zinc-400">Potential monthly savings: ${Math.round(digest?.weekly.potential_monthly_savings ?? 0)}</p>
          </PremiumCard>
          <PremiumCard className="p-4">
            <p className="text-sm font-semibold text-zinc-100">Next month forecast</p>
            <p className="mt-1 text-sm text-zinc-400">Recurring forecast: ${Math.round(digest?.monthly.next_month_forecast ?? 0)}</p>
            <p className="text-sm text-zinc-400">Realized monthly impact: ${Math.round(digest?.monthly.realized_monthly_impact ?? 0)}</p>
            <p className="text-sm text-zinc-400">Missed opportunities: {digest?.monthly.missed_opportunities ?? 0}</p>
          </PremiumCard>
        </div>

        <PremiumCard className="p-4">
          <p className="text-sm font-semibold text-zinc-100">What Kivo learned about you</p>
          <p className="mt-1 text-sm text-zinc-400">{personalization?.profile_summary || 'Not enough activity yet.'}</p>
          {personalization?.focus_categories?.length ? (
            <p className="mt-1 text-xs text-zinc-500">Focus categories: {personalization.focus_categories.join(', ')}</p>
          ) : null}
        </PremiumCard>

        <PremiumCard className="p-4">
          <p className="text-sm font-semibold text-zinc-100">Operator highlights</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-300">
            {(digest?.highlights || ['No highlights yet.']).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </PremiumCard>
      </PremiumCard>
    </AppShell>
  );
}
