'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  Bot,
  ChevronRight,
  MessageCircle,
  Plus,
  Search,
  Settings2,
  Sparkles,
  User,
} from 'lucide-react';
import { useAppStore } from '@/app/store/app-store';
import { KivoReferralSuccessToast } from './KivoReferralSuccessToast';

type HomeTab = 'all' | 'agents' | 'unfinished' | 'today';

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
  { id: 'today', label: 'Today' },
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
  const enqueuePromptAndGoToChat = useAppStore(
    (s) => s.enqueuePromptAndGoToChat,
  );
  const alerts = useAppStore((s) => s.alerts);
  const isAgentResponding = useAppStore((s) => s.isAgentResponding);

  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<HomeTab>('all');

  const [referralToastOpen, setReferralToastOpen] = useState(false);
  const [referralToastTitle, setReferralToastTitle] = useState('');
  const [referralToastDetail, setReferralToastDetail] = useState('');

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrate, hydrated]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    const referral = url.searchParams.get('referral');
    const rewardType = url.searchParams.get('referralRewardType');
    const rewardAmount = url.searchParams.get('referralRewardAmount');
    const rewardLabel = url.searchParams.get('referralRewardLabel');

    if (referral !== 'success') return;

    let detail = 'Your referral reward was added successfully.';

    if (rewardLabel?.trim()) {
      detail = rewardLabel;
    } else if (rewardType === 'bonus_runs' && rewardAmount) {
      detail = `+${rewardAmount} bonus runs added`;
    } else if (rewardType === 'plus_days' && rewardAmount) {
      detail = `${rewardAmount} days of Plus were added`;
    }

    setReferralToastTitle('Invite successful');
    setReferralToastDetail(detail);
    setReferralToastOpen(true);

    const timeout = window.setTimeout(() => {
      setReferralToastOpen(false);
    }, 3200);

    url.searchParams.delete('referral');
    url.searchParams.delete('referralRewardType');
    url.searchParams.delete('referralRewardAmount');
    url.searchParams.delete('referralRewardLabel');

    router.replace(`${url.pathname}${url.search}${url.hash}`, { scroll: false });

    return () => {
      window.clearTimeout(timeout);
    };
  }, [router]);

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
          new Date(b.rawUpdatedAt).getTime() -
          new Date(a.rawUpdatedAt).getTime(),
      );
  }, [conversationList, draftState, messageState]);

  const filteredRows = useMemo(() => {
    let next = rows;

    if (tab === 'agents') next = next.filter((row) => row.kind === 'agent');
    if (tab === 'unfinished') next = next.filter((row) => row.unfinished);
    if (tab === 'today') {
      next = next.filter((row) => {
        const updatedAt = new Date(row.rawUpdatedAt);
        const now = new Date();
        return (
          updatedAt.getFullYear() === now.getFullYear() &&
          updatedAt.getMonth() === now.getMonth() &&
          updatedAt.getDate() === now.getDate()
        );
      });
    }

    const q = search.trim().toLowerCase();
    if (!q) return next;

    return next.filter((row) =>
      `${row.title} ${row.preview}`.toLowerCase().includes(q),
    );
  }, [rows, search, tab]);

  const latestConversation = rows[0] ?? null;
  const unfinishedCount = rows.filter((row) => row.unfinished).length;
  const agentConversationCount = rows.filter((row) => row.kind === 'agent').length;
  const activeAlertCount = alerts.filter((alert) => !alert.resolved).length;
  const estimatedMoneySaved = 84;

  const displayName =
    (user as { displayName?: string; name?: string; email?: string } | null)
      ?.displayName ||
    user?.name ||
    user?.email?.split('@')[0] ||
    'You';

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const statusLabel = isAgentResponding ? 'Working' : 'Ready';

  const heroSubtext = latestConversation?.unfinished
    ? 'Pick up where you left off or open Operator for the next best move.'
    : 'Pick a starting point or let Kivo guide your next move.';

  const focusTitle = latestConversation
    ? latestConversation.unfinished
      ? `Resume ${latestConversation.title}`
      : 'Open Operator for the next best move'
    : 'Open Operator for the next best move';

  const focusDescription =
    activeAlertCount > 0
      ? `${activeAlertCount} active item${activeAlertCount > 1 ? 's' : ''} may need your attention.`
      : latestConversation
        ? 'Review what matters, see your momentum, or continue your flow.'
        : 'Start with a new chat or let Kivo guide your next move.';

  const handleOpenConversation = (conversationId: string) => {
    openConversation(conversationId);
    router.push('/chat');
  };

  const handleNewChat = () => {
    const conversationId = createConversation();
    openConversation(conversationId);
    router.push('/chat');
  };

  const handleQuickPrompt = (prompt: string) => {
    enqueuePromptAndGoToChat(prompt);
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#f7f8fb] text-[#222a36]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_42%,#f5f7fb_100%)]" />
        <div className="absolute inset-x-0 top-0 h-[220px] bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.98)_0%,rgba(255,255,255,0.46)_48%,rgba(255,255,255,0)_82%)]" />
        <div className="absolute left-1/2 top-[10%] h-[260px] w-[260px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.98)_0%,rgba(247,249,253,0.48)_56%,rgba(247,249,253,0)_100%)] blur-[30px]" />
        <div className="absolute left-1/2 bottom-[-80px] h-[280px] w-[120%] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(238,242,248,0.8)_0%,rgba(238,242,248,0.22)_54%,rgba(238,242,248,0)_100%)] blur-[34px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-[560px] flex-col">
        <header className="sticky top-0 z-30 border-b border-black/[0.035] bg-white/78 px-5 pb-3 pt-4 backdrop-blur-2xl">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.push('/settings')}
              aria-label="Open settings"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/92 text-[#3a4350] shadow-[0_8px_18px_rgba(15,23,42,0.045)] transition-all duration-200 ease-out hover:bg-white active:scale-[0.985]"
            >
              <User className="h-5 w-5" strokeWidth={1.9} />
            </button>

            <h1 className="text-[21px] font-semibold tracking-[-0.045em] text-[#202734]">
              Workspace
            </h1>

            <button
              type="button"
              onClick={() => router.push('/history')}
              aria-label="Open search"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/92 text-[#3a4350] shadow-[0_8px_18px_rgba(15,23,42,0.045)] transition-all duration-200 ease-out hover:bg-white active:scale-[0.985]"
            >
              <Search className="h-5 w-5" strokeWidth={1.9} />
            </button>
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col px-5 pb-28 pt-6">
          <section>
            <div className="max-w-[420px]">
              <p className="text-[18px] font-medium tracking-[-0.03em] text-[#6f7b8f]">
                {greeting}
              </p>

              <h2
                className="mt-2 text-[36px] font-normal leading-[1.02] tracking-[-0.06em] text-[#1f2734]"
                style={{ fontFamily: 'ui-serif, Georgia, Times, serif' }}
              >
                What do you want to move forward today?
              </h2>

              <p className="mt-4 max-w-[420px] text-[16px] leading-7 tracking-[-0.015em] text-[#758092]">
                {heroSubtext}
              </p>
            </div>
          </section>

          <section className="mt-7 grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={handleNewChat}
              className="flex min-h-[132px] flex-col items-start justify-between rounded-[30px] border border-[#232427] bg-[linear-gradient(180deg,#17181b_0%,#08090c_100%)] px-5 py-5 text-left text-white shadow-[0_18px_36px_rgba(10,10,12,0.18)] transition-all duration-200 ease-out hover:scale-[1.01] active:scale-[0.99]"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white">
                <Sparkles className="h-5 w-5" strokeWidth={2} />
              </span>

              <div className="flex w-full items-end justify-between gap-3">
                <div>
                  <div className="text-[17px] font-semibold tracking-[-0.025em]">
                    New chat
                  </div>
                  <div className="mt-1 text-[13px] text-white/72">
                    Start something fresh
                  </div>
                </div>

                <ChevronRight className="h-5 w-5 shrink-0 text-white/82" strokeWidth={2.1} />
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                if (latestConversation) {
                  handleOpenConversation(latestConversation.id);
                  return;
                }
                router.push('/operator');
              }}
              className="flex min-h-[132px] flex-col items-start justify-between rounded-[30px] border border-black/[0.04] bg-white/88 px-5 py-5 text-left shadow-[0_14px_30px_rgba(15,23,42,0.05)] transition-all duration-200 ease-out hover:bg-white active:scale-[0.99]"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#eef3fb] text-[#6f84a8]">
                <Activity className="h-5 w-5" strokeWidth={2} />
              </span>

              <div className="flex w-full items-end justify-between gap-3">
                <div>
                  <div className="text-[17px] font-semibold tracking-[-0.025em] text-[#232c38]">
                    Continue
                  </div>
                  <div className="mt-1 text-[13px] text-[#7b8697]">
                    {latestConversation ? 'Pick up where you left off' : 'Open your workspace'}
                  </div>
                </div>

                <ChevronRight className="h-5 w-5 shrink-0 text-[#7e8898]" strokeWidth={2.1} />
              </div>
            </button>
          </section>

          <section className="mt-5">
            <div className="relative overflow-hidden rounded-[34px] border border-black/[0.04] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,250,253,0.82))] p-5 shadow-[0_18px_38px_rgba(15,23,42,0.055)]">
              <div className="pointer-events-none absolute right-[-24px] top-1/2 h-[170px] w-[170px] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(236,230,255,0.82)_0%,rgba(236,230,255,0.28)_48%,rgba(236,230,255,0)_100%)] blur-[12px]" />

              <div className="relative flex items-start justify-between gap-5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[#7f4cff]">
                    <Sparkles className="h-4.5 w-4.5" strokeWidth={2} />
                    <span className="text-[12px] font-semibold uppercase tracking-[0.12em]">
                      Focus now
                    </span>
                  </div>

                  <h3 className="mt-4 max-w-[320px] text-[30px] font-semibold leading-[1.05] tracking-[-0.055em] text-[#1f2734]">
                    {focusTitle}
                  </h3>

                  <p className="mt-3 max-w-[360px] text-[15px] leading-7 tracking-[-0.012em] text-[#717d8f]">
                    {focusDescription}
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      if (latestConversation?.unfinished) {
                        handleOpenConversation(latestConversation.id);
                        return;
                      }
                      router.push('/operator');
                    }}
                    className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-[#111318] px-5 text-[14px] font-semibold tracking-[-0.015em] text-white shadow-[0_10px_24px_rgba(0,0,0,0.14)] transition-all duration-200 ease-out hover:-translate-y-[1px] hover:bg-black active:translate-y-0 active:scale-[0.985]"
                  >
                    Open Operator
                  </button>
                </div>

                <div className="hidden shrink-0 items-center justify-center sm:flex">
                  <div className="flex h-[120px] w-[120px] items-center justify-center rounded-full border border-white/70 bg-white/56 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                    <div className="flex h-[74px] w-[74px] items-center justify-center rounded-full border border-[#e4d9ff] bg-[radial-gradient(circle,rgba(255,255,255,0.98)_0%,rgba(244,239,255,0.9)_100%)] text-[#6f4cff] shadow-[0_0_0_8px_rgba(120,90,255,0.04)]">
                      <ChevronRight className="h-7 w-7" strokeWidth={2.1} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-5">
            <div className="grid grid-cols-3 gap-3 rounded-[28px] border border-black/[0.04] bg-white/86 px-4 py-4 shadow-[0_14px_30px_rgba(15,23,42,0.045)]">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#eef3fb] text-[#6f84a8]">
                  <MessageCircle className="h-5 w-5" strokeWidth={1.9} />
                </span>
                <div>
                  <div className="text-[13px] text-[#7d8797]">Conversations</div>
                  <div className="mt-0.5 text-[16px] font-semibold tracking-[-0.02em] text-[#202734]">
                    {conversationList.length}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 border-x border-black/[0.05] px-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#eef6f1] text-[#6c9778]">
                  <Bot className="h-5 w-5" strokeWidth={1.9} />
                </span>
                <div>
                  <div className="text-[13px] text-[#7d8797]">State</div>
                  <div className="mt-0.5 text-[16px] font-semibold tracking-[-0.02em] text-[#202734]">
                    {statusLabel}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pl-1">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#f3eefc] text-[#8362c5]">
                  <Activity className="h-5 w-5" strokeWidth={1.9} />
                </span>
                <div>
                  <div className="text-[13px] text-[#7d8797]">Money saved</div>
                  <div className="mt-0.5 text-[16px] font-semibold tracking-[-0.02em] text-[#202734]">
                    €{estimatedMoneySaved}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-5">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[#98a0ad]"
                strokeWidth={1.9}
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search conversations..."
                className="h-13 w-full rounded-full border border-black/[0.04] bg-white/86 pl-11 pr-12 text-[15px] text-[#38404a] shadow-[0_10px_22px_rgba(15,23,42,0.04)] outline-none transition-all duration-200 ease-out placeholder:text-[#98a0ad] focus:border-black/[0.06] focus:bg-white"
              />
              <button
                type="button"
                onClick={() => router.push('/history')}
                aria-label="Open filters"
                className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[#7f8898] transition-all duration-200 ease-out hover:bg-black/[0.03]"
              >
                <Settings2 className="h-4.5 w-4.5" strokeWidth={1.9} />
              </button>
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {HOME_TABS.map((item) => {
                const active = item.id === tab;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id)}
                    className={`shrink-0 rounded-full px-5 py-2.5 text-[14px] font-medium tracking-[-0.015em] transition-all duration-200 ease-out active:scale-[0.985] ${
                      active
                        ? 'bg-[#0f1116] text-white shadow-[0_10px_22px_rgba(0,0,0,0.12)]'
                        : 'bg-white/84 text-[#7a8291] shadow-[0_8px_16px_rgba(15,23,42,0.03)] hover:bg-white'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="mt-7 min-h-0 flex-1">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[28px] font-semibold tracking-[-0.05em] text-[#202734]">
                Recent chats
              </h3>

              <button
                type="button"
                onClick={() => router.push('/history')}
                className="inline-flex items-center gap-1 text-[15px] font-medium text-[#71809a] transition-colors hover:text-[#44506a]"
              >
                See all
                <ChevronRight className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>

            {filteredRows.length === 0 ? (
              <div className="flex min-h-[30vh] items-center justify-center rounded-[32px] border border-black/[0.04] bg-white/84 p-8 text-center shadow-[0_18px_36px_rgba(15,23,42,0.045)]">
                <div className="max-w-[300px]">
                  <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#f5f7fb] text-[#7d8593] shadow-[0_10px_22px_rgba(15,23,42,0.04)]">
                    <MessageCircle className="h-6 w-6" strokeWidth={1.8} />
                  </div>

                  <h2
                    className="text-[28px] font-normal leading-[1.08] tracking-[-0.05em] text-[#353b45]"
                    style={{ fontFamily: 'ui-serif, Georgia, Times, serif' }}
                  >
                    No conversations
                  </h2>

                  <p className="mt-3 text-[14px] leading-6 text-[#7d8391]">
                    Start a new chat and it will appear here.
                  </p>

                  <button
                    type="button"
                    onClick={handleNewChat}
                    className="mt-5 inline-flex items-center rounded-full bg-white px-4 py-2.5 text-sm font-medium text-[#374151] shadow-[0_10px_22px_rgba(15,23,42,0.04)] transition-all duration-200 ease-out hover:bg-white active:scale-[0.985]"
                  >
                    New chat
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRows.slice(0, 6).map((row) => {
                  const active = activeConversationId === row.id;

                  return (
                    <button
                      key={row.id}
                      type="button"
                      onClick={() => handleOpenConversation(row.id)}
                      className={`flex w-full items-start gap-4 rounded-[28px] border px-4 py-4 text-left transition-all duration-200 ease-out active:scale-[0.992] ${
                        active
                          ? 'border-black/[0.05] bg-white shadow-[0_18px_34px_rgba(15,23,42,0.06)]'
                          : 'border-black/[0.04] bg-white/82 shadow-[0_12px_24px_rgba(15,23,42,0.04)] hover:bg-white hover:shadow-[0_16px_30px_rgba(15,23,42,0.05)]'
                      }`}
                    >
                      <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f6f8fb] text-[#727b89]">
                        {row.kind === 'agent' ? (
                          <Bot className="h-5 w-5" strokeWidth={1.8} />
                        ) : (
                          <MessageCircle className="h-5 w-5" strokeWidth={1.8} />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="truncate text-[17px] font-semibold tracking-[-0.02em] text-[#232c38]">
                                {row.title}
                              </h4>

                              {row.unfinished ? (
                                <span className="shrink-0 rounded-full bg-[#edf3fb] px-2.5 py-1 text-[11px] font-medium text-[#6f87a8]">
                                  Unfinished
                                </span>
                              ) : row.kind === 'agent' ? (
                                <span className="shrink-0 rounded-full bg-[#f8eee5] px-2.5 py-1 text-[11px] font-medium text-[#af7b58]">
                                  Agent
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
                            <ChevronRight
                              className="h-5 w-5 text-[#a2a8b3]"
                              strokeWidth={1.8}
                            />
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </main>

        <button
          type="button"
          onClick={handleNewChat}
          aria-label="Start new chat"
          className="fixed bottom-8 right-5 z-40 inline-flex h-[62px] w-[62px] items-center justify-center rounded-full bg-[#14161b] text-white shadow-[0_20px_38px_rgba(17,17,17,0.2)] transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="h-6 w-6" strokeWidth={2.2} />
        </button>

        <KivoReferralSuccessToast
          open={referralToastOpen}
          title={referralToastTitle}
          detail={referralToastDetail}
          onClose={() => setReferralToastOpen(false)}
        />
      </div>
    </div>
  );
}
