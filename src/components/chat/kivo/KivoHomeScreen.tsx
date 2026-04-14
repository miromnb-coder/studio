'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bot,
  ChevronRight,
  MessageCircle,
  Search,
  User,
  X,
} from 'lucide-react';
import { useAppStore } from '@/app/store/app-store';

type HomeTab = 'all' | 'agents' | 'manual' | 'scheduled' | 'favorites';

type HomeRow = {
  id: string;
  title: string;
  preview: string;
  timestamp: string;
  rawUpdatedAt: string;
  kind: 'agent' | 'manual' | 'scheduled';
  favorite: boolean;
};

const HOME_TABS: Array<{ id: HomeTab; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'agents', label: 'Agents' },
  { id: 'manual', label: 'Manual' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'favorites', label: 'Favorites' },
];

export function KivoHomeScreen() {
  const router = useRouter();

  const hydrated = useAppStore((s) => s.hydrated);
  const hydrate = useAppStore((s) => s.hydrate);
  const user = useAppStore((s) => s.user);
  const conversationList = useAppStore((s) => s.conversationList);
  const messageState = useAppStore((s) => s.messageState);
  const draftState = useAppStore((s) => s.draftState);
  const createConversation = useAppStore((s) => s.createConversation);
  const openConversation = useAppStore((s) => s.openConversation);

  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<HomeTab>('all');
  const [bannerVisible, setBannerVisible] = useState(true);

  if (!hydrated) {
    hydrate();
  }

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
      .map((conversation, index) => {
        const threadMessages = messageState[conversation.id] ?? [];
        const draftValue = draftState[conversation.id] ?? '';
        const hasAgent = threadMessages.some(
          (message) =>
            message.agent || message.agentMetadata?.operatorModules?.length,
        );
        const unfinished =
          Boolean(draftValue.trim()) ||
          threadMessages[threadMessages.length - 1]?.role === 'user';

        let kind: HomeRow['kind'] = 'manual';
        if (hasAgent) kind = 'agent';
        if (!hasAgent && unfinished) kind = 'scheduled';

        return {
          id: conversation.id,
          title: conversation.title || 'Untitled conversation',
          preview: conversation.lastMessagePreview || 'No messages yet.',
          timestamp: formatRelativeTime(conversation.updatedAt),
          rawUpdatedAt: conversation.updatedAt,
          kind,
          favorite: index < 2,
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
    if (tab === 'manual') next = next.filter((row) => row.kind === 'manual');
    if (tab === 'scheduled') next = next.filter((row) => row.kind === 'scheduled');
    if (tab === 'favorites') next = next.filter((row) => row.favorite);

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
    user?.displayName ||
    user?.name ||
    user?.email?.split('@')[0] ||
    'You';

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#2f3640]">
      <div className="mx-auto flex min-h-screen w-full max-w-[560px] flex-col bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.92),rgba(245,245,247,1)_58%)] shadow-[0_24px_80px_rgba(31,41,55,0.08)]">
        <header className="sticky top-0 z-30 bg-[rgba(245,245,247,0.82)] px-5 pb-3 pt-4 backdrop-blur-2xl">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.push('/settings')}
              aria-label="Open settings"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/[0.05] bg-white/60 text-[#3c4450] transition-all duration-200 ease-out hover:bg-white active:scale-[0.985]"
            >
              <User className="h-5 w-5" strokeWidth={1.9} />
            </button>

            <h1
              className="text-[22px] font-semibold tracking-[-0.05em] text-[#2f3640]"
              style={{ fontFamily: 'ui-serif, Georgia, Times, serif' }}
            >
              Kivo
            </h1>

            <button
              type="button"
              onClick={() => router.push('/history')}
              aria-label="Search or browse conversations"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/[0.05] bg-white/60 text-[#3c4450] transition-all duration-200 ease-out hover:bg-white active:scale-[0.985]"
            >
              <Search className="h-5 w-5" strokeWidth={1.9} />
            </button>
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col px-5 pb-24">
          {bannerVisible ? (
            <div className="mb-4 rounded-[26px] border border-black/[0.05] bg-white/80 px-5 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
              <div className="flex items-start gap-3">
                <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f7f8fb] text-[#667085]">
                  <Bot className="h-5 w-5" strokeWidth={1.8} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[16px] font-medium tracking-[-0.02em] text-[#313843]">
                    Kivo hub
                  </p>
                  <p className="mt-1 text-[14px] leading-6 text-[#7b8391]">
                    Continue conversations, open agents, or start a fresh chat.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setBannerVisible(false)}
                  aria-label="Dismiss banner"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#8e96a3] transition hover:bg-black/[0.03]"
                >
                  <X className="h-5 w-5" strokeWidth={1.9} />
                </button>
              </div>
            </div>
          ) : null}

          <div className="mb-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {HOME_TABS.map((item) => {
              const active = item.id === tab;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`shrink-0 rounded-full border px-5 py-3 text-[14px] font-medium tracking-[-0.02em] transition-all duration-200 ease-out active:scale-[0.985] ${
                    active
                      ? 'border-black bg-[#111111] text-white shadow-[0_8px_18px_rgba(17,17,17,0.18)]'
                      : 'border-black/[0.05] bg-white/70 text-[#8a919e] hover:bg-white'
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
                <h2 className="text-[28px] font-medium tracking-[-0.05em] text-[#353b45]">
                  Nothing here yet
                </h2>
                <p className="mt-2 text-[14px] leading-6 text-[#7a8190]">
                  Start a new conversation and it will appear in this space.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRows.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => handleOpenConversation(row.id)}
                  className="flex w-full items-start gap-4 rounded-[26px] border border-transparent px-1 py-3 text-left transition-all duration-200 ease-out hover:bg-white/45 active:scale-[0.992]"
                >
                  <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#ececef] text-[#3d434d]">
                    {row.kind === 'agent' ? (
                      <Bot className="h-6 w-6" strokeWidth={1.8} />
                    ) : (
                      <MessageCircle className="h-6 w-6" strokeWidth={1.8} />
                    )}
                  </div>

                  <div className="min-w-0 flex-1 border-b border-black/[0.05] pb-4">
                    {row.kind === 'agent' ? (
                      <div className="mb-1 flex items-center gap-2">
                        <span className="rounded-full bg-[#dff0ff] px-2.5 py-1 text-[12px] font-medium text-[#3f86cf]">
                          New
                        </span>
                      </div>
                    ) : null}

                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <h2 className="truncate text-[18px] font-medium tracking-[-0.03em] text-[#313843]">
                            {row.title}
                          </h2>
                          <span className="shrink-0 pt-0.5 text-[13px] text-[#9aa1ad]">
                            {row.timestamp}
                          </span>
                        </div>

                        <p className="mt-1 line-clamp-2 text-[15px] leading-6 text-[#7b8391]">
                          {row.preview}
                        </p>
                      </div>

                      <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-[#a0a7b3]" strokeWidth={1.8} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </main>

        <button
          type="button"
          onClick={handleNewChat}
          aria-label="Start new chat"
          className="fixed bottom-8 right-5 z-40 inline-flex h-[68px] w-[68px] items-center justify-center rounded-full bg-[#20201d] text-white shadow-[0_18px_36px_rgba(17,17,17,0.22)] transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]"
        >
          <MessageCircle className="h-7 w-7" strokeWidth={2} />
        </button>

        <div className="pointer-events-none fixed bottom-8 left-1/2 z-30 h-1.5 w-32 -translate-x-1/2 rounded-full bg-black/[0.06]" />

        <div className="pointer-events-none fixed left-0 right-0 top-0 h-10 bg-[linear-gradient(to_bottom,rgba(245,245,247,0.9),rgba(245,245,247,0))]" />

        <div className="px-5 pb-8">
          <p className="sr-only">{displayName}</p>
        </div>
      </div>
    </div>
  );
}
