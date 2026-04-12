'use client';

import { useEffect, useMemo } from 'react';
import { Clock3, RotateCcw } from 'lucide-react';
import { useAppStore, type HistoryEntry } from '../store/app-store';
import { AppShell, PremiumCard, SectionHeader, SmartButton } from '../components/premium-ui';

type GroupLabel = 'Today' | 'Yesterday' | 'Earlier';

const toDayStart = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

const getGroupLabel = (createdAt: string): GroupLabel => {
  const eventDay = toDayStart(new Date(createdAt));
  const today = toDayStart(new Date());
  const yesterday = today - 24 * 60 * 60 * 1000;
  if (eventDay === today) return 'Today';
  if (eventDay === yesterday) return 'Yesterday';
  return 'Earlier';
};

export default function HistoryPage() {
  const hydrated = useAppStore((s) => s.hydrated);
  const hydrate = useAppStore((s) => s.hydrate);
  const history = useAppStore((s) => s.history);
  const enqueuePromptAndGoToChat = useAppStore((s) => s.enqueuePromptAndGoToChat);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrate, hydrated]);

  const grouped = useMemo(() => {
    const groups: Record<GroupLabel, HistoryEntry[]> = { Today: [], Yesterday: [], Earlier: [] };
    history.forEach((entry) => groups[getGroupLabel(entry.createdAt)].push(entry));
    return groups;
  }, [history]);

  return (
    <AppShell>
      <PremiumCard className="space-y-4 p-5">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-[#d9dde4] bg-[#f8f9fb] p-2.5 text-[#59606d]"><Clock3 className="h-5 w-5" /></div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-[#22262c]">Conversations</h1>
            <p className="text-sm text-[#7a838f]">Review timeline events and jump back into context instantly.</p>
          </div>
        </div>

        {history.length === 0 ? (
          <PremiumCard className="p-5 text-sm text-[#7a838f]">No timeline yet. Chat, alerts, and agent actions appear here.</PremiumCard>
        ) : (
          <div className="space-y-4">
            {(['Today', 'Yesterday', 'Earlier'] as GroupLabel[]).map((label) => (
              <PremiumCard key={label} className="space-y-2.5 p-4">
                <SectionHeader title={label} subtitle="Tap any item to continue in chat." />
                <div className="space-y-2">
                  {grouped[label].length === 0 ? (
                    <p className="rounded-[16px] border border-[#d9dde4] bg-[#f7f8fa] px-3 py-3 text-xs text-[#8791a0]">No entries</p>
                  ) : (
                    grouped[label].map((entry) => (
                      <button
                        key={entry.id}
                        onClick={() => enqueuePromptAndGoToChat(entry.prompt ?? `Continue this context: ${entry.title}. ${entry.description}`)}
                        type="button"
                        className="w-full rounded-[18px] border border-[#d9dde4] bg-[#f8f9fb] px-3.5 py-3 text-left shadow-[0_8px_18px_rgba(66,72,88,0.05)] transition hover:border-[#cfd5df]"
                      >
                        <p className="text-sm font-semibold text-[#22262c]">{entry.title}</p>
                        <p className="text-xs text-[#7a838f]">{entry.description}</p>
                        <p className="mt-1.5 text-[11px] text-[#8b95a3]">{new Date(entry.createdAt).toLocaleString()}</p>
                      </button>
                    ))
                  )}
                </div>
              </PremiumCard>
            ))}
          </div>
        )}

        <SmartButton variant="secondary" onClick={() => enqueuePromptAndGoToChat('Summarize my recent timeline and recommend next actions.')}>
          <RotateCcw className="mr-2 h-4 w-4" /> Continue from timeline
        </SmartButton>
      </PremiumCard>
    </AppShell>
  );
}
