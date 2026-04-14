'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bot,
  ChevronRight,
  MessageCircle,
  Plus,
  Search,
  User,
} from 'lucide-react';
import { useAppStore } from '@/app/store/app-store';

type HomeTab = 'all' | 'agents' | 'unfinished';

type HomeRow = {
  id: string;
  title: string;
  preview: string;
  timestamp: string;
  rawUpdatedAt: string;
  kind: 'agent' | 'manual';
  unfinished: boolean;
};

const HOME_TABS: Array<{ id: HomeTab; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'agents', label: 'Agents' },
  { id: 'unfinished', label: 'Unfinished' },
];

export function KivoHomeScreen() {
  const router = useRouter();

  const hydrated = useAppStore((s) => s.hydrated);
  const hydrate = useAppStore((s) => s.hydrate);
  const user = useAppStore((s) => s.user);
  const conversationList = useAppStore((s) => s.conversationList);
  const messageState = useAppStore((s) => s.messageState);
  const draftState = useAppStore((s) => s.draftState);
  const activeConversationId = useAppStore((s) => s.activeConversationId);
  const createConversation = useAppStore((s) => s.createConversation);
  const openConversation = useAppStore((s) => s.openConversation);

  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<HomeTab>('all');

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrate, hydrated]);

  const formatRelativeTime = (iso: string) => {
    const delta = Date.now() - new Date(iso).getTime();
    const minutes = Math.max(1, Math.floor(delta / 60000));

    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(new Date(iso));
  };

  const rows = useMemo<HomeRow[]>(() => {
    return conversationList
      .map((conversation) => {
        const threadMessages = messageState[conversation.id] ?? [];
        const draftValue = draftState[conversation.id] ?? '';
        const hasAgent = threadMessages.some(
          (message) =>
            message.agent || message.agentMetadata?.operatorModules?.length,
        );
        const lastMessage = threadMessages[threadMessages.length - 1];
        const unfinished =
          Boolean(draftValue.trim()) || lastMessage?.role === 'user';

        return {
          id: conversation.id,
          title: conversation.title || 'Untitled conversation',
          preview: conversation.lastMessagePreview || 'No messages yet.',
          timestamp: formatRelativeTime(conversation.updatedAt),
          rawUpdatedAt: conversation.updatedAt,
          kind: hasAgent ? 'agent' : 'manual',
          unfinished,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.rawUpdatedAt).getTime() - new Date(a.rawUpdatedAt).getTime(),
      );
  }, [conversationList, draftState, messageState]);

  const filteredRows = useMemo(() => {
    let next = rows;

    if (tab === 'agents') next = next.filter((row) => row.kind === 'agent');
    if (tab === 'unfinished') next = next.filter((row) => row.unfinished);

    const q = search.trim().toLowerCase();
    if (!q) return next;

    return next.filter((row) =>
      `${row.title} ${row.preview}`.toLowerCase().includes(q),
    );
  }, [rows, search, tab]);

  const handleOpenConversation = (conversationId: string) => {
    openConversation(conversationId);
    router.push('/chat');
  };

  const handleNewChat = () => {
    const conversationId = createConversation();
    openConversation(conversationId);
    router.push('/chat');
  };

  const displayName =
    user?.displayName || user?.name || user?.email?.split('@')[0] || 'You';

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#2f3640]">
      <div className="mx-auto flex min-h-screen w-full max-w-[560px] flex-col bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.92),rgba(245,245,247,1)_58%)] shadow-[0_24px_80px_rgba(31,41,55,0.08)]">
        <header className="sticky top-0 z-30 border-b border-black/[0.04] bg-[rgba(245,245,247,0.78)] px-5 pb-3 pt-4 backdrop-blur-2xl">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.push('/settings')}
              aria-label="Open settings"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/[0.05] bg-white/60 text-[#3c4450] transition-all duration-200 ease-out hover:bg-white active:scale-[0.985]"
            >
              <User className="h-5 w-5" strokeWidth={1.9} />
            </button>

            <h1 className="text-[21px] font-medium tracking-[-0.04em] text-[#2f3640]">
              Home
            </h1>

            <button
              type="button"
              onClick={() => router.push('/history')}
              aria-label="Open conversations"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/[0.05] bg-white/60 text-[#3c4450] transition-all duration-200 ease-out hover:bg-white active:scale-[0.985]"
            >
              <Search className="h-5 w-5" strokeWidth={1.9} />
            </button>
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col px-5 pb-24 pt-5">
          <div className="mb-5">
            <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-[#9aa1ad]">
              Kivo
            </p>
            <h2 className="mt-2 text-[30px] font-medium tracking-[-0.05em] text-[#2f3640]">
              Welcome back, {displayName}
            </h2>
            <p className="mt-2 text-[14px] leading-6 text-[#7a8190]">
              Continue a conversation or start a new one.
            </p>
          </div>

          <div className="relative mb-4">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98a0ad]" strokeWidth={1.8} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search conversations"
              className="h-12 w-full rounded-full border border-black/[0.05] bg-white/80 pl-11 pr-4 text-[15px] text-[#38404a] shadow-[0_10px_24px_rgba(15,23,42,0.05)] outline-none transition-all duration-200 ease-out placeholder:text-[#98a0ad] focus:border-black/[0.08] focus:bg-white"
            />
          </div>

          <div className="mb-5 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {HOME_TABS.map((item) => {
              const active = item.id === tab;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`shrink-0 rounded-full border px-4 py-2.5 text-[13px] font-medium tracking-[-0.01em] transition-all duration-200 ease-out active:scale-[0.985] ${
                    active
                      ? 'border-black/[0.08] bg-white text-[#2f3640] shadow-[0_10px_24px_rgba(15,23,42,0.06)]'
                      : 'border-black/[0.04] bg-white/60 text-[#7c8493] hover:bg-white/85'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {filteredRows.length === 0 ? (
            <div className="flex min-h-[44vh] flex-1 items-center justify-center">
              <div className="max-w-[300px] text-center">
                <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full border border-black/[0.05] bg-white/80 text-[#7d8593] shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
                  <MessageCircle className="h-6 w-6" strokeWidth={1.8} />
                </div>
                <h2
                  className="text-[28px] font-normal leading-[1.08] tracking-[-0.05em] text-[#353b45]"
                  style={{ fontFamily: 'ui-serif, Georgia, Times, serif' }}
                >
                  No conversations
                </h2>
                <p className="mt-3 text-[14px] leading-6 text-[#7a8190]">
                  Start a new chat and it will appear here.
                </p>
                <button
                  type="button"
                  onClick={handleNewChat}
                  className="mt-5 inline-flex items-center rounded-full border border-black/[0.06] bg-white px-4 py-2.5 text-sm font-medium text-[#374151] shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition-all duration-200 ease-out hover:bg-white/90 active:scale-[0.985]"
                >
                  New chat
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredRows.map((row) => {
                const active = activeConversationId === row.id;

                return (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => handleOpenConversation(row.id)}
                    className={`flex w-full items-start gap-4 rounded-[22px] border px-4 py-4 text-left transition-all duration-200 ease-out active:scale-[0.992] ${
                      active
                        ? 'border-black/[0.08] bg-white shadow-[0_16px_34px_rgba(15,23,42,0.08)]'
                        : 'border-black/[0.05] bg-white/72 shadow-[0_10px_24px_rgba(15,23,42,0.05)] hover:bg-white hover:shadow-[0_16px_34px_rgba(15,23,42,0.07)]'
                    }`}
                  >
                    <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-black/[0.05] bg-[#f7f8fb] text-[#727b89]">
                      {row.kind === 'agent' ? (
                        <Bot className="h-5 w-5" strokeWidth={1.8} />
                      ) : (
                        <MessageCircle className="h-5 w-5" strokeWidth={1.8} />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="truncate text-[16px] font-medium tracking-[-0.02em] text-[#313843]">
                              {row.title}
                            </h3>

                            {row.unfinished ? (
                              <span className="shrink-0 rounded-full border border-black/[0.05] bg-[#f7f8fb] px-2.5 py-1 text-[11px] font-medium text-[#7a8190]">
                                Needs input
                              </span>
                            ) : null}
                          </div>

                          <p className="mt-1 line-clamp-2 text-[14px] leading-6 text-[#7b8391]">
                            {row.preview}
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <span className="text-[12px] font-medium tracking-[-0.01em] text-[#9aa1ad]">
                            {row.timestamp}
                          </span>
                          <ChevronRight className="h-5 w-5 text-[#a2a8b3]" strokeWidth={1.8} />
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </main>

        <button
          type="button"
          onClick={handleNewChat}
          aria-label="Start new chat"
          className="fixed bottom-8 right-5 z-40 inline-flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#20201d] text-white shadow-[0_18px_36px_rgba(17,17,17,0.18)] transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="h-6 w-6" strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}
