'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bookmark,
  Bot,
  Clock3,
  MessageSquare,
  Search,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '@/app/store/app-store';
import { KivoChatHeader } from './KivoChatHeader';

type HistoryFilter = 'all' | 'recent' | 'saved' | 'unfinished' | 'agents';

type HistoryRow = {
  id: string;
  title: string;
  preview: string;
  timestamp: string;
  rawUpdatedAt: string;
  badge?: string;
  hasAgent: boolean;
  unfinished: boolean;
  isSaved: boolean;
};

const FILTERS: Array<{ id: HistoryFilter; label: string; icon: React.ReactNode }> = [
  { id: 'all', label: 'All', icon: <MessageSquare className="h-4 w-4" strokeWidth={1.8} /> },
  { id: 'recent', label: 'Recent', icon: <Clock3 className="h-4 w-4" strokeWidth={1.8} /> },
  { id: 'saved', label: 'Saved', icon: <Bookmark className="h-4 w-4" strokeWidth={1.8} /> },
  { id: 'unfinished', label: 'Unfinished', icon: <Sparkles className="h-4 w-4" strokeWidth={1.8} /> },
  { id: 'agents', label: 'Agents', icon: <Bot className="h-4 w-4" strokeWidth={1.8} /> },
];

export function KivoHistoryScreen() {
  const router = useRouter();

  const hydrated = useAppStore((s) => s.hydrated);
  const hydrate = useAppStore((s) => s.hydrate);
  const conversationList = useAppStore((s) => s.conversationList);
  const messageState = useAppStore((s) => s.messageState);
  const draftState = useAppStore((s) => s.draftState);
  const activeConversationId = useAppStore((s) => s.activeConversationId);
  const openConversation = useAppStore((s) => s.openConversation);

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<HistoryFilter>('all');
  const [savedConversationIds, setSavedConversationIds] = useState<string[]>([]);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrate, hydrated]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('kivo_saved_conversations_v1');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setSavedConversationIds(parsed.filter((item) => typeof item === 'string'));
      }
    } catch {
      // ignore malformed local state
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      'kivo_saved_conversations_v1',
      JSON.stringify(savedConversationIds),
    );
  }, [savedConversationIds]);

  const formatRelativeTime = (iso: string) => {
    const delta = Date.now() - new Date(iso).getTime();
    const minutes = Math.max(1, Math.floor(delta / 60000));

    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(new Date(iso));
  };

  const rows = useMemo<HistoryRow[]>(() => {
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
        const running = Boolean(lastMessage?.isStreaming);
        const saved = savedConversationIds.includes(conversation.id);

        return {
          id: conversation.id,
          title: conversation.title || 'Untitled conversation',
          preview: conversation.lastMessagePreview || 'No messages yet.',
          timestamp: formatRelativeTime(conversation.updatedAt),
          rawUpdatedAt: conversation.updatedAt,
          badge: hasAgent
            ? running
              ? 'Running'
              : unfinished
                ? 'Needs Input'
                : 'Agent'
            : saved
              ? 'Saved'
              : unfinished
                ? 'Needs Input'
                : undefined,
          hasAgent,
          unfinished,
          isSaved: saved,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.rawUpdatedAt).getTime() - new Date(a.rawUpdatedAt).getTime(),
      );
  }, [conversationList, draftState, messageState, savedConversationIds]);

  const filteredRows = useMemo(() => {
    let next = rows;

    if (filter === 'recent') next = next.slice(0, 8);
    if (filter === 'saved') next = next.filter((row) => row.isSaved);
    if (filter === 'unfinished') next = next.filter((row) => row.unfinished);
    if (filter === 'agents') next = next.filter((row) => row.hasAgent);

    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return next;

    return next.filter((row) =>
      `${row.title} ${row.preview} ${row.badge ?? ''}`
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [filter, query, rows]);

  const openRow = (conversationId: string) => {
    openConversation(conversationId);
    router.push('/chat');
  };

  const toggleSaved = (conversationId: string) => {
    setSavedConversationIds((prev) =>
      prev.includes(conversationId)
        ? prev.filter((id) => id !== conversationId)
        : [conversationId, ...prev],
    );
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#2f3640]">
      <div className="mx-auto flex min-h-screen w-full max-w-[560px] flex-col bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.92),rgba(245,245,247,1)_58%)] shadow-[0_24px_80px_rgba(31,41,55,0.08)]">
        <KivoChatHeader />

        <main className="flex min-h-0 flex-1 flex-col px-5 pb-8 pt-5">
          <div className="mb-5">
            <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-[#9aa1ad]">
              History
            </p>
            <h1 className="mt-2 text-[32px] font-medium tracking-[-0.05em] text-[#2f3640]">
              Conversations
            </h1>
            <p className="mt-2 text-[14px] leading-6 text-[#7a8190]">
              Reopen recent threads, continue unfinished work, and keep your saved chats close.
            </p>
          </div>

          <div className="relative mb-4">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98a0ad]" strokeWidth={1.8} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search conversations"
              className="h-12 w-full rounded-full border border-black/[0.05] bg-white/80 pl-11 pr-4 text-[15px] text-[#38404a] shadow-[0_10px_24px_rgba(15,23,42,0.05)] outline-none transition-all duration-200 ease-out placeholder:text-[#98a0ad] focus:border-black/[0.08] focus:bg-white"
            />
          </div>

          <div className="mb-5 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {FILTERS.map((item) => {
              const active = filter === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-[13px] font-medium tracking-[-0.01em] transition-all duration-200 ease-out active:scale-[0.985] ${
                    active
                      ? 'border-black/[0.08] bg-white text-[#2f3640] shadow-[0_10px_24px_rgba(15,23,42,0.06)]'
                      : 'border-black/[0.04] bg-white/60 text-[#7c8493] hover:bg-white/85'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              );
            })}
          </div>

          {filteredRows.length === 0 ? (
            <div className="flex min-h-[46vh] flex-1 items-center justify-center">
              <div className="max-w-[320px] text-center">
                <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full border border-black/[0.05] bg-white/80 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
                  <MessageSquare className="h-6 w-6 text-[#7d8593]" strokeWidth={1.8} />
                </div>
                <h2
                  className="text-[28px] font-normal leading-[1.08] tracking-[-0.05em] text-[#353b45]"
                  style={{ fontFamily: 'ui-serif, Georgia, Times, serif' }}
                >
                  No conversations yet
                </h2>
                <p className="mt-3 text-[14px] leading-6 text-[#7a8190]">
                  Start a new chat in Kivo and your conversations will appear here.
                </p>
                <button
                  type="button"
                  onClick={() => router.push('/chat')}
                  className="mt-5 inline-flex items-center rounded-full border border-black/[0.06] bg-white px-4 py-2.5 text-sm font-medium text-[#374151] shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition-all duration-200 ease-out hover:bg-white/90 active:scale-[0.985]"
                >
                  Open chat
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRows.map((row) => {
                const active = activeConversationId === row.id;

                return (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => openRow(row.id)}
                    className={`group block w-full rounded-[28px] border p-4 text-left transition-all duration-200 ease-out active:scale-[0.992] ${
                      active
                        ? 'border-black/[0.08] bg-white shadow-[0_16px_34px_rgba(15,23,42,0.08)]'
                        : 'border-black/[0.05] bg-white/72 shadow-[0_10px_24px_rgba(15,23,42,0.05)] hover:bg-white hover:shadow-[0_16px_34px_rgba(15,23,42,0.07)]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-black/[0.05] bg-[#f7f8fb] text-[#727b89]">
                        {row.hasAgent ? (
                          <Bot className="h-5 w-5" strokeWidth={1.8} />
                        ) : (
                          <MessageSquare className="h-5 w-5" strokeWidth={1.8} />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h2 className="truncate text-[16px] font-medium tracking-[-0.02em] text-[#313843]">
                                {row.title}
                              </h2>

                              {row.badge ? (
                                <span className="shrink-0 rounded-full border border-black/[0.05] bg-[#f7f8fb] px-2.5 py-1 text-[11px] font-medium text-[#7a8190]">
                                  {row.badge}
                                </span>
                              ) : null}
                            </div>

                            <p className="mt-2 line-clamp-2 text-[14px] leading-6 text-[#7b8391]">
                              {row.preview}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleSaved(row.id);
                            }}
                            aria-label={row.isSaved ? 'Remove from saved' : 'Save conversation'}
                            className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all duration-200 ease-out active:scale-[0.985] ${
                              row.isSaved
                                ? 'border-black/[0.08] bg-white text-[#2f3640]'
                                : 'border-black/[0.05] bg-white/70 text-[#98a0ad] hover:bg-white'
                            }`}
                          >
                            <Bookmark
                              className="h-4.5 w-4.5"
                              strokeWidth={1.9}
                              fill={row.isSaved ? 'currentColor' : 'none'}
                            />
                          </button>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-[12px] font-medium tracking-[-0.01em] text-[#9aa1ad]">
                            {row.timestamp}
                          </span>

                          {active ? (
                            <span className="rounded-full border border-black/[0.05] bg-[#f7f8fb] px-2.5 py-1 text-[11px] font-medium text-[#6d7684]">
                              Open
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
