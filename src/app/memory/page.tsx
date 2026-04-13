'use client';

import { useEffect, useMemo, useState } from 'react';
import { Pin, Search } from 'lucide-react';
import { useAppStore } from '../store/app-store';
import { AppShell, PremiumCard, ProductPageHeader, SectionHeader } from '../components/premium-ui';
import { EmptyIllustration } from '../components/product-sections';

export default function MemoryPage() {
  const hydrated = useAppStore((s) => s.hydrated);
  const hydrate = useAppStore((s) => s.hydrate);
  const history = useAppStore((s) => s.history);
  const enqueuePromptAndGoToChat = useAppStore((s) => s.enqueuePromptAndGoToChat);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrate, hydrated]);

  const filtered = useMemo(
    () => history.filter((item) => `${item.title} ${item.description}`.toLowerCase().includes(query.toLowerCase())).slice(0, 8),
    [history, query],
  );

  return (
    <AppShell>
      <ProductPageHeader pageTitle="Memory" pageSubtitle="Knowledge center with searchable history" />
      <div className="space-y-3">
        <PremiumCard className="p-4">
          <SectionHeader title="Search memory" subtitle="Find facts, threads, and decisions quickly" />
          <label className="flex items-center gap-2 rounded-[14px] border border-[#e4e7ed] bg-[#fafbfc] px-3 py-2.5">
            <Search className="h-4 w-4 text-[#7a818d]" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search saved facts or prior threads" className="w-full bg-transparent text-sm text-[#111111] outline-none placeholder:text-[#9299a4]" />
          </label>
        </PremiumCard>

        <PremiumCard className="space-y-2 p-4">
          <SectionHeader title="Pinned threads" subtitle="Always-on memory for active projects" />
          <button type="button" onClick={() => enqueuePromptAndGoToChat('Continue my weekly planning thread.')} className="tap-feedback flex w-full items-center justify-between rounded-[16px] border border-[#e7eaf0] bg-[#fcfcfd] p-3 text-left">
            <span>
              <p className="text-sm font-semibold text-[#111111]">Weekly planning system</p>
              <p className="text-xs text-[#636a76]">Last updated yesterday • 4 pending actions</p>
            </span>
            <Pin className="h-4 w-4 text-[#111111]" />
          </button>
        </PremiumCard>

        <PremiumCard className="space-y-2 p-4">
          <SectionHeader title="Search results" subtitle="Recent memory items and saved facts" />
          {filtered.length === 0 ? (
            <EmptyIllustration title="No memory found" message="Try another keyword or create a new thread in chat." />
          ) : (
            filtered.map((item) => (
              <button key={item.id} onClick={() => enqueuePromptAndGoToChat(item.prompt ?? item.title)} type="button" className="tap-feedback block w-full rounded-[16px] border border-[#e7eaf0] bg-[#fcfcfd] px-3 py-2.5 text-left">
                <p className="text-sm font-semibold text-[#111111]">{item.title}</p>
                <p className="text-xs text-[#636a76]">{item.description}</p>
              </button>
            ))
          )}
        </PremiumCard>
      </div>
    </AppShell>
  );
}
