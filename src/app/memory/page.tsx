'use client';

import { useEffect, useMemo, useState } from 'react';
import { Pin, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '../store/app-store';
import { AppShell, PremiumCard, ProductPageHeader, SectionHeader } from '../components/premium-ui';
import { EmptyIllustration } from '../components/product-sections';

export default function MemoryPage() {
  const router = useRouter();
  const hydrated = useAppStore((s) => s.hydrated);
  const hydrate = useAppStore((s) => s.hydrate);
  const history = useAppStore((s) => s.history);
  const conversationList = useAppStore((s) => s.conversationList);
  const openConversation = useAppStore((s) => s.openConversation);
  const [query, setQuery] = useState('');
  const [savedConversationIds, setSavedConversationIds] = useState<string[]>([]);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrate, hydrated]);

  useEffect(() => {
    const raw = window.localStorage.getItem('kivo_saved_conversations_v1');
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) setSavedConversationIds(parsed.filter((item) => typeof item === 'string'));
  }, []);

  const pinnedThreads = useMemo(
    () => conversationList.filter((conv) => savedConversationIds.includes(conv.id)).slice(0, 6),
    [conversationList, savedConversationIds],
  );

  const memoryResults = useMemo(() => {
    const q = query.toLowerCase();
    const conversationMatches = conversationList
      .filter((item) => `${item.title} ${item.lastMessagePreview}`.toLowerCase().includes(q))
      .map((item) => ({ id: item.id, title: item.title, description: item.lastMessagePreview || 'Conversation', type: 'conversation' as const }));

    const historyMatches = history
      .filter((item) => `${item.title} ${item.description} ${item.type}`.toLowerCase().includes(q))
      .map((item) => ({ id: item.id, title: item.title, description: item.description, type: 'memory' as const, prompt: item.prompt }));

    return [...conversationMatches, ...historyMatches].slice(0, 16);
  }, [conversationList, history, query]);

  return (
    <AppShell>
      <ProductPageHeader pageTitle="Memory" pageSubtitle="Search conversations, pinned threads, and memory entries" />
      <div className="space-y-3">
        <PremiumCard className="p-4">
          <SectionHeader title="Search memory" subtitle="Find facts, threads, and decisions quickly" />
          <label className="flex items-center gap-2 rounded-[14px] border border-[#e4e7ed] bg-[#fafbfc] px-3 py-2.5">
            <Search className="h-4 w-4 text-[#7a818d]" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search conversations, pinned threads, memory, decisions" className="w-full bg-transparent text-sm text-[#111111] outline-none placeholder:text-[#9299a4]" />
          </label>
        </PremiumCard>

        <PremiumCard className="space-y-2 p-4">
          <SectionHeader title="Pinned threads" subtitle="Tap to open instantly" />
          {pinnedThreads.length === 0 ? (
            <p className="text-xs text-[#636a76]">No pinned threads yet. Save a conversation from chat drawer first.</p>
          ) : pinnedThreads.map((thread) => (
            <button key={thread.id} type="button" onClick={() => { openConversation(thread.id); router.push('/chat'); }} className="tap-feedback flex w-full items-center justify-between rounded-[16px] border border-[#e7eaf0] bg-[#fcfcfd] p-3 text-left">
              <span>
                <p className="text-sm font-semibold text-[#111111]">{thread.title}</p>
                <p className="text-xs text-[#636a76]">{thread.lastMessagePreview || 'No messages yet'}</p>
              </span>
              <Pin className="h-4 w-4 text-[#111111]" />
            </button>
          ))}
        </PremiumCard>

        <PremiumCard className="space-y-2 p-4">
          <SectionHeader title="Search results" subtitle="Conversations, memory entries, and saved context" />
          {memoryResults.length === 0 ? (
            <EmptyIllustration title="No memory found" message="No matching conversations or memory entries." />
          ) : (
            memoryResults.map((item) => (
              <button key={item.id} onClick={() => {
                if (item.type === 'conversation') {
                  openConversation(item.id);
                  router.push('/chat');
                  return;
                }
                router.push('/chat');
              }} type="button" className="tap-feedback block w-full rounded-[16px] border border-[#e7eaf0] bg-[#fcfcfd] px-3 py-2.5 text-left">
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
