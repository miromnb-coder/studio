'use client';

import { useMemo, useState } from 'react';
import { PauseCircle, PlayCircle, ShieldBan, Timer, TrendingUp } from 'lucide-react';
import { AppShell, PremiumCard, ProductPageHeader, SectionHeader, SmartButton } from '../components/premium-ui';
import { ActionTile, MetricGrid } from '../components/product-sections';

export default function FocusPage() {
  const [running, setRunning] = useState(false);
  const [minutes, setMinutes] = useState(45);

  const stats = useMemo(
    () => [
      { label: 'Focus', value: '3h 20m', detail: 'today' },
      { label: 'Sessions', value: '5', detail: 'completed' },
      { label: 'Drift', value: '-18%', detail: 'vs week' },
    ],
    [],
  );

  return (
    <AppShell>
      <ProductPageHeader pageTitle="Focus" pageSubtitle="Deep work center for calm execution" />
      <div className="space-y-3">
        <PremiumCard className="space-y-4 p-4">
          <SectionHeader title="Session timer" subtitle="Run intentional blocks with AI support" />
          <div className="rounded-[20px] border border-[#e6e9ef] bg-gradient-to-b from-white to-[#f8f9fb] p-4 text-center">
            <p className="text-xs uppercase tracking-[0.16em] text-[#727985]">Current block</p>
            <p className="mt-1 text-4xl font-semibold tracking-tight text-[#111111]">{minutes}:00</p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <SmartButton variant="secondary" onClick={() => setMinutes((v) => Math.max(15, v - 5))}>-5m</SmartButton>
              <SmartButton onClick={() => setRunning((v) => !v)}>{running ? <><PauseCircle className="mr-2 h-4 w-4" /> Pause</> : <><PlayCircle className="mr-2 h-4 w-4" /> Start</>}</SmartButton>
              <SmartButton variant="secondary" onClick={() => setMinutes((v) => Math.min(90, v + 5))}>+5m</SmartButton>
            </div>
          </div>
          <MetricGrid items={stats} />
        </PremiumCard>

        <PremiumCard className="space-y-2 p-4">
          <SectionHeader title="Distraction blocking" subtitle="Guardrails for premium deep-work sessions" />
          <ActionTile title="Block social + shopping" description="Auto-block 12 distracting domains during focus sessions." icon={ShieldBan} onClick={() => setRunning(true)} />
          <ActionTile title="Route notifications" description="Only urgent alerts from tasks and calendar are allowed." icon={Timer} onClick={() => setRunning(true)} />
        </PremiumCard>

        <PremiumCard className="space-y-2 p-4">
          <SectionHeader title="Productivity trend" subtitle="How your attention quality is evolving" />
          <div className="rounded-[16px] border border-[#e7eaf0] bg-[#fcfcfd] p-3">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#111111]"><TrendingUp className="h-4 w-4" /> Focus quality improved across mornings.</p>
            <p className="mt-1 text-xs text-[#636a76]">Your strongest window is 8:30 AM – 11:00 AM. Kivo recommends booking planning and decision work there.</p>
          </div>
        </PremiumCard>
      </div>
    </AppShell>
  );
}
