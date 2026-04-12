'use client';

import { useEffect, useMemo } from 'react';
import { ArrowUpRight, Bookmark, Clock3 } from 'lucide-react';
import { useAppStore, type HistoryEntry } from '../store/app-store';
import { AppShell, PremiumCard, ProductPageHeader, SectionHeader } from '../components/premium-ui';

type GroupLabel = 'Today' | 'Yesterday' | 'Older';

const toDayStart = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

const getGroupLabel = (createdAt: string): GroupLabel => {
  const eventDay = toDayStart(new Date(createdAt));
  const today = toDayStart(new Date());
  const yesterday = today - 24 * 60 * 60 * 1000;
  if (eventDay === today) return 'Today';
  if (eventDay === yesterday) return 'Yesterday';
  return 'Older';
};

const toMeaningful = (entry: HistoryEntry) => ({
  ...entry,
  title: entry.title.replace(/^user message sent:?\s*/i, '').replace(/^supervisor task started:?\s*/i, '').trim() || 'Untitled work item',
});

export default function MemoryPage() {
  const hydrated = useAppStore((s) => s.hydrated);
  const hydrate = useAppStore((s) => s.hydrate);
  const history = useAppStore((s) => s.history);
  const enqueuePromptAndGoToChat = useAppStore((s) => s.enqueuePromptAndGoToChat);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrate, hydrated]);

  const grouped = useMemo(() => {
    const groups: Record<GroupLabel, HistoryEntry[]> = { Today: [], Yesterday: [], Older: [] };
    history.map(toMeaningful).forEach((entry) => groups[getGroupLabel(entry.createdAt)].push(entry));
    return groups;
  }, [history]);

  const continueItems = history.slice(0, 3).map(toMeaningful);

  return (
    <AppShell>
      <ProductPageHeader pageTitle="Memory" pageSubtitle="Meaningful work you can continue" />

      <div className="space-y-3">
        <PremiumCard className="space-y-2 p-4">
          <SectionHeader title="Continue where you left off" subtitle="Recent threads with unfinished momentum" />
          {continueItems.length ? continueItems.map((item) => (
            <button
              key={item.id}
              onClick={() => enqueuePromptAndGoToChat(item.prompt ?? `Continue: ${item.title}`)}
              type="button"
              className="flex w-full items-center justify-between rounded-[16px] border border-[#d9dde4] bg-[#f8f9fb] px-3.5 py-3"
            >
              <span className="text-left">
                <p className="text-sm font-semibold text-[#2b3341]">{item.title}</p>
                <p className="text-xs text-[#6f7786]">{item.description}</p>
              </span>
              <ArrowUpRight className="h-4 w-4 text-[#7a838f]" />
            </button>
          )) : <p className="text-sm text-[#7a838f]">No memory items yet. Start in Chat and Kivo will build your memory timeline.</p>}
        </PremiumCard>

        {(['Today', 'Yesterday', 'Older'] as GroupLabel[]).map((label) => (
          <PremiumCard key={label} className="space-y-2 p-4">
            <SectionHeader title={label} subtitle={label === 'Older' ? 'Saved conversations and project threads' : 'Recent work sessions'} />
            {grouped[label].length ? grouped[label].map((item) => (
              <button key={item.id} type="button" onClick={() => enqueuePromptAndGoToChat(item.prompt ?? item.title)} className="block w-full rounded-[16px] border border-[#d9dde4] bg-[#f8f9fb] px-3.5 py-3 text-left">
                <p className="text-sm font-semibold text-[#2b3341]">{item.title}</p>
                <p className="text-xs text-[#6f7786]">{item.description}</p>
                <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-[#8a93a1]"><Clock3 className="h-3.5 w-3.5" /> {new Date(item.createdAt).toLocaleString()}</p>
              </button>
            )) : <p className="text-sm text-[#7a838f]">No entries yet.</p>}
          </PremiumCard>
        ))}

        <PremiumCard className="space-y-1.5 p-4">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#2b3341]"><Bookmark className="h-4 w-4" /> Saved threads</p>
          <p className="text-xs text-[#6f7786]">Pin important projects like “Weekly savings plan”, “Client onboarding notes”, and “Decision journal” in chat to keep them here.</p>
        </PremiumCard>
      </div>
    </AppShell>
  );
}
