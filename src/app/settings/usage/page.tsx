'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, ChevronLeft, Download, Rocket, Trash2 } from 'lucide-react';

import KivoChatHeader from '@/components/chat/kivo/KivoChatHeader';
import { KivoChatSidebarArea, KIVO_CHAT_SIDEBAR_RAIL_WIDTH } from '@/components/chat/kivo/KivoChatSidebarArea';

const SIDEBAR_GAP = 12;

type UsageValues = {
  agentRuns: number;
  messages: number;
  tools: number;
  fileAnalyses: number;
  memoryItems: number;
};

const zeroUsage: UsageValues = {
  agentRuns: 0,
  messages: 0,
  tools: 0,
  fileAnalyses: 0,
  memoryItems: 0,
};

export default function UsagePage() {
  const router = useRouter();

  const [showSidebarRail, setShowSidebarRail] = useState(false);
  const [usage, setUsage] = useState<UsageValues>(zeroUsage);
  const [plan, setPlan] = useState('free');
  const [confirmReset, setConfirmReset] = useState(false);

  const contentLeftOffset = showSidebarRail ? KIVO_CHAT_SIDEBAR_RAIL_WIDTH + SIDEBAR_GAP : 0;

  useEffect(() => {
    try {
      const stats = JSON.parse(localStorage.getItem('kivo.stats') || '{}');
      const localUsage = JSON.parse(localStorage.getItem('kivo.usage') || '{}');
      const merged = {
        agentRuns: Number(localUsage.agentRuns ?? stats.agentRuns ?? 0),
        messages: Number(localUsage.messages ?? stats.messages ?? 0),
        tools: Number(localUsage.tools ?? stats.tools ?? 0),
        fileAnalyses: Number(localUsage.fileAnalyses ?? stats.fileAnalyses ?? 0),
        memoryItems: Number(localUsage.memoryItems ?? stats.memoryItems ?? 0),
      };
      setUsage(merged);
    } catch {
      setUsage(zeroUsage);
    }

    setPlan(localStorage.getItem('kivo.user.plan') === 'premium' ? 'premium' : 'free');
  }, []);

  const limits = useMemo(
    () =>
      plan === 'premium'
        ? { messages: 1200, agentRuns: 250, fileAnalyses: 80, automations: 10 }
        : { messages: 150, agentRuns: 20, fileAnalyses: 10, automations: 1 },
    [plan],
  );

  const usagePercent = useMemo(() => {
    const messagePct = Math.min(100, (usage.messages / Math.max(limits.messages, 1)) * 100);
    const runPct = Math.min(100, (usage.agentRuns / Math.max(limits.agentRuns, 1)) * 100);
    const filePct = Math.min(100, (usage.fileAnalyses / Math.max(limits.fileAnalyses, 1)) * 100);
    return Math.round((messagePct + runPct + filePct) / 3);
  }, [limits, usage]);

  function exportUsage() {
    const payload = {
      usage,
      plan,
      limits,
      usagePercent,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'kivo-usage-export.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  function resetUsage() {
    localStorage.removeItem('kivo.usage');
    localStorage.removeItem('kivo.stats');
    setUsage(zeroUsage);
    setConfirmReset(false);
  }

  return (
    <main className="relative min-h-[100dvh] overflow-x-hidden bg-[#F8F8F7] text-[#111318]">
      {showSidebarRail ? (
        <KivoChatSidebarArea
          hasMessages={false}
          userName="Miro"
          plan="free"
          recentChats={[]}
          onNewChat={() => router.push('/chat')}
          onSearch={() => router.push('/search')}
          onOpenAgents={() => router.push('/agents')}
          onOpenTools={() => router.push('/tools')}
          onOpenAlerts={() => router.push('/alerts')}
          onOpenSettings={() => router.push('/settings')}
          onQuickTask={() => router.push('/chat')}
          onAnalyzeFile={() => router.push('/analyze')}
          onPlanMyDay={() => router.push('/actions?type=planner')}
          onOpenGmail={() => router.push('/actions?tool=gmail')}
          onOpenCalendar={() => router.push('/actions?tool=google-calendar')}
          onOpenDrive={() => router.push('/tools?source=drive')}
          onOpenWeb={() => router.push('/tools?tool=browser-search')}
          onUpgrade={() => router.push('/upgrade')}
        />
      ) : null}

      <div className="min-h-[100dvh] transition-[padding-left] duration-300 ease-out" style={{ paddingLeft: contentLeftOffset }}>
        <div className="sticky top-0 z-40 border-b border-black/[0.035] bg-white/82 backdrop-blur-2xl">
          <KivoChatHeader hasMessages={false} isSidebarOpen={showSidebarRail} onSidebarToggle={() => setShowSidebarRail((open) => !open)} />
        </div>

        <section className="px-4 pb-28 pt-7 sm:px-5">
          <div className="mx-auto max-w-[980px]">
            <button onClick={() => router.push('/settings')} className="mb-6 inline-flex items-center gap-2 rounded-[14px] border border-black/[0.055] bg-white px-4 py-2.5 text-[13px] font-medium shadow-[0_8px_22px_rgba(15,23,42,0.025)]"><ChevronLeft className="h-4 w-4" />Back to Settings</button>
            <div className="mb-7"><h1 className="font-serif text-[44px] leading-none tracking-[-0.06em]">Usage</h1><p className="mt-2 text-[16px] text-black/50">Track your Kivo limits and activity.</p></div>

            <Card>
              <SectionHeader title="Usage summary" subtitle="Current totals loaded from local usage records." />
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <StatusPill label="Agent runs used" value={String(usage.agentRuns)} />
                <StatusPill label="Messages used" value={String(usage.messages)} />
                <StatusPill label="Tools used" value={String(usage.tools)} />
                <StatusPill label="File analyses" value={String(usage.fileAnalyses)} />
                <StatusPill label="Memory items" value={String(usage.memoryItems)} />
                <StatusPill label="Usage percent" value={`${usagePercent}%`} />
              </div>
            </Card>

            <Card>
              <SectionHeader title="Plan limits" subtitle="Limits based on your local plan setting." />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatusPill label="Messages" value={`${limits.messages}/mo`} />
                <StatusPill label="Agent runs" value={`${limits.agentRuns}/mo`} />
                <StatusPill label="File analysis" value={`${limits.fileAnalyses}/mo`} />
                <StatusPill label="Automations" value={String(limits.automations)} />
              </div>
            </Card>

            <Card>
              <SectionHeader title="Usage cards" subtitle="Detailed usage and remaining quota." />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <UsageCard label="Messages" used={usage.messages} limit={limits.messages} />
                <UsageCard label="Agent runs" used={usage.agentRuns} limit={limits.agentRuns} />
                <UsageCard label="File analyses" used={usage.fileAnalyses} limit={limits.fileAnalyses} />
              </div>
            </Card>

            <Card>
              <SectionHeader title="Actions" subtitle="Manage your plan and usage records." />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <ActionButton icon={<Rocket />} label="Upgrade plan" onClick={() => router.push('/upgrade')} />
                <ActionButton icon={<BarChart3 />} label="Open plan details" onClick={() => router.push('/settings/plan')} />
                <ActionButton icon={<Download />} label="Export usage" onClick={exportUsage} />
                <ActionButton icon={<Trash2 />} label="Reset local usage" onClick={() => setConfirmReset(true)} danger />
              </div>
            </Card>
          </div>
        </section>
      </div>

      {confirmReset ? <ConfirmModal title="Reset local usage?" desc="This clears local usage and stats records for this device." actionLabel="Reset usage" onCancel={() => setConfirmReset(false)} onConfirm={resetUsage} /> : null}
    </main>
  );
}

function Card({ children }: { children: ReactNode }) { return <div className="mb-5 rounded-[28px] border border-black/[0.055] bg-white/90 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.04)]">{children}</div>; }
function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) { return <div className="mb-5"><h2 className="text-[18px] font-semibold tracking-[-0.035em]">{title}</h2><p className="mt-1 text-[13px] text-black/45">{subtitle}</p></div>; }
function StatusPill({ label, value }: { label: string; value: string }) { return <div className="rounded-[18px] border border-black/[0.055] bg-white px-4 py-3"><div className="text-[12px] text-black/45">{label}</div><div className="mt-1 text-[16px] font-semibold tracking-[-0.03em]">{value}</div></div>; }
function UsageCard({ label, used, limit }: { label: string; used: number; limit: number }) {
  const safeLimit = Math.max(limit, 1);
  const percent = Math.min(100, Math.round((used / safeLimit) * 100));
  const remaining = Math.max(0, limit - used);
  return (
    <div className="rounded-[20px] border border-black/[0.055] bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.018)]">
      <div className="text-[14px] font-semibold tracking-[-0.03em]">{label}</div>
      <div className="mt-1 text-[13px] text-black/55">{used} / {limit}</div>
      <div className="mt-3 h-2 w-full rounded-full bg-black/10"><div className="h-2 rounded-full bg-[#111318]" style={{ width: `${percent}%` }} /></div>
      <div className="mt-2 text-[12px] text-black/45">Remaining: {remaining}</div>
    </div>
  );
}
function ActionButton({ icon, label, onClick, danger = false }: { icon: ReactNode; label: string; onClick: () => void; danger?: boolean }) { return <button onClick={onClick} className={["inline-flex items-center justify-center gap-3 rounded-[17px] border border-black/[0.055] bg-white px-5 py-4 text-[14px] font-medium shadow-[0_8px_22px_rgba(15,23,42,0.018)]", danger ? 'text-red-500' : ''].join(' ')}><span className="[&>svg]:h-5 [&>svg]:w-5">{icon}</span>{label}</button>; }
function ConfirmModal({ title, desc, actionLabel, onCancel, onConfirm }: { title: string; desc: string; actionLabel: string; onCancel: () => void; onConfirm: () => void; }) { return <div className="fixed inset-0 z-[80] flex items-end bg-black/25 p-4 backdrop-blur-sm sm:items-center sm:justify-center"><div className="w-full rounded-[28px] bg-white p-5 shadow-[0_24px_80px_rgba(0,0,0,0.18)] sm:max-w-[420px]"><div className="text-[20px] font-semibold tracking-[-0.04em]">{title}</div><p className="mt-2 text-[14px] leading-[1.45] text-black/50">{desc}</p><div className="mt-6 grid grid-cols-2 gap-3"><button onClick={onCancel} className="rounded-[16px] bg-black/[0.045] px-4 py-3 text-[14px] font-medium">Cancel</button><button onClick={onConfirm} className="rounded-[16px] bg-[#111318] px-4 py-3 text-[14px] font-medium text-white">{actionLabel}</button></div></div></div>; }
