'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Bot,
  ChevronRight,
  Clock3,
  MessageCircle,
  Plus,
  Search,
  Sparkles,
  User,
} from 'lucide-react';
import { useAppStore } from '@/app/store/app-store';
import { KivoReferralSuccessToast } from './KivoReferralSuccessToast';

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

  const displayName =
    (user as { displayName?: string; name?: string; email?: string } | null)
      ?.displayName ||
    user?.name ||
    user?.email?.split('@')[0] ||
    'You';

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
    <div className="min-h-screen overflow-hidden bg-[#f5f6f8] text-[#2f3640]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#f8f8fa_0%,#f4f5f8_34%,#eef2f7_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.9),transparent_34%),radial-gradient(circle_at_82%_16%,rgba(222,232,249,0.52),transparent_28%),radial-gradient(circle_at_58%_76%,rgba(226,231,242,0.5),transparent_30%)]" />
        <div
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              'radial-gradient(rgba(132,144,166,0.22) 0.75px, transparent 0.75px)',
            backgroundSize: '16px 16px',
            backgroundPosition: 'center top',
          }}
        />
        <div className="absolute left-1/2 top-[8%] h-[320px] w-[320px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.85)_0%,rgba(255,255,255,0.18)_55%,rgba(255,255,255,0)_100%)] blur-[28px]" />
        <div className="absolute bottom-[-80px] left-[-10%] h-[280px] w-[130%] rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(223,230,241,0.65)_0%,rgba(223,230,241,0.26)_45%,rgba(223,230,241,0)_100%)] blur-[28px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-[560px] flex-col">
        <header className="sticky top-0 z-30 border-b border-white/55 bg-[rgba(245,246,248,0.72)] px-5 pb-3 pt-4 backdrop-blur-2xl">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.push('/settings')}
              aria-label="Open settings"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-[rgba(255,255,255,0.62)] text-[#3c4450] shadow-[0_8px_20px_rgba(15,23,42,0.05)] transition-all duration-200 ease-out hover:bg-white active:scale-[0.985]"
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
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-[rgba(255,255,255,0.62)] text-[#3c4450] shadow-[0_8px_20px_rgba(15,23,42,0.05)] transition-all duration-200 ease-out hover:bg-white active:scale-[0.985]"
            >
              <Search className="h-5 w-5" strokeWidth={1.9} />
            </button>
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col px-5 pb-28 pt-5">
          <section className="rounded-[34px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(248,249,252,0.62))] p-5 shadow-[0_18px_44px_rgba(15,23,42,0.06)] backdrop-blur-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-[rgba(255,255,255,0.58)] px-3 py-1 text-[12px] font-medium tracking-[0.12em] text-[#8f98a8] shadow-[0_6px_16px_rgba(15,23,42,0.04)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#9aa7bb]" />
                  KIVO
                </div>

                <h2 className="mt-4 text-[34px] font-medium tracking-[-0.06em] text-[#28303a]">
                  Welcome back, {displayName}
                </h2>

                <p className="mt-3 max-w-[420px] text-[15px] leading-7 text-[#727c8d]">
                  Your workspace is ready. Continue where you left off or start
                  something new.
                </p>
              </div>

              <div className="hidden h-12 w-12 rounded-full border border-white/70 bg-[rgba(255,255,255,0.55)] shadow-[0_8px_18px_rgba(15,23,42,0.04)] sm:block" />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleNewChat}
                className="flex min-h-[88px] flex-col items-start justify-between rounded-[26px] border border-[#c9daf5] bg-[linear-gradient(180deg,#b8d0f3_0%,#a7c3ec_100%)] px-4 py-4 text-left text-white shadow-[0_18px_34px_rgba(93,134,196,0.24)] transition-all duration-200 ease-out hover:scale-[1.01] active:scale-[0.99]"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/16">
                  <Sparkles className="h-4.5 w-4.5" strokeWidth={2} />
                </span>
                <div>
                  <div className="text-[15px] font-semibold tracking-[-0.02em]">
                    New chat
                  </div>
                  <div className="mt-1 text-[12px] text-white/82">
                    Start something fresh
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  latestConversation
                    ? handleOpenConversation(latestConversation.id)
                    : handleNewChat()
                }
                className="flex min-h-[88px] flex-col items-start justify-between rounded-[26px] border border-white/80 bg-[rgba(255,255,255,0.68)] px-4 py-4 text-left shadow-[0_14px_30px_rgba(15,23,42,0.05)] transition-all duration-200 ease-out hover:bg-white/86 active:scale-[0.99]"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#f1f4f8] text-[#576171]">
                  <ArrowRight className="h-4.5 w-4.5" strokeWidth={2} />
                </span>
                <div>
                  <div className="text-[15px] font-semibold tracking-[-0.02em] text-[#2f3640]">
                    Continue latest
                  </div>
                  <div className="mt-1 text-[12px] text-[#7f8794]">
                    Pick up where you left off
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleQuickPrompt('Review my current priorities and tell me what matters most right now.')
                }
                className="flex min-h-[84px] flex-col items-start justify-between rounded-[24px] border border-white/75 bg-[rgba(255,255,255,0.62)] px-4 py-4 text-left shadow-[0_12px_24px_rgba(15,23,42,0.045)] transition-all duration-200 ease-out hover:bg-white/84 active:scale-[0.99]"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#eef3fb] text-[#6d85a7]">
                  <Clock3 className="h-4 w-4" strokeWidth={2} />
                </span>
                <div className="text-[15px] font-medium tracking-[-0.02em] text-[#313843]">
                  Review priorities
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleQuickPrompt('Continue planning and give me the next best step.')
                }
                className="flex min-h-[84px] flex-col items-start justify-between rounded-[24px] border border-white/75 bg-[rgba(255,255,255,0.62)] px-4 py-4 text-left shadow-[0_12px_24px_rgba(15,23,42,0.045)] transition-all duration-200 ease-out hover:bg-white/84 active:scale-[0.99]"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#f3edf9] text-[#8f72b0]">
                  <Bot className="h-4 w-4" strokeWidth={2} />
                </span>
                <div className="text-[15px] font-medium tracking-[-0.02em] text-[#313843]">
                  Continue planning
                </div>
              </button>
            </div>
          </section>

          <section className="mt-4">
            <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {[
                'Summarize my day',
                'Find priorities',
                'Analyze spending',
                'Continue planning',
              ].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleQuickPrompt(item)}
                  className="shrink-0 rounded-full border border-white/75 bg-[rgba(255,255,255,0.64)] px-4 py-2.5 text-[13px] font-medium tracking-[-0.01em] text-[#677180] shadow-[0_8px_18px_rgba(15,23,42,0.04)] transition-all duration-200 ease-out hover:bg-white/86 active:scale-[0.985]"
                >
                  {item}
                </button>
              ))}
            </div>
          </section>

          <section className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-[28px] border border-white/75 bg-[rgba(255,255,255,0.62)] p-4 shadow-[0_16px_34px_rgba(15,23,42,0.05)] backdrop-blur-2xl">
              <div className="flex items-center gap-2 text-[#6d84a7]">
                <MessageCircle className="h-5 w-5" strokeWidth={1.9} />
                <h3 className="text-[15px] font-semibold tracking-[-0.02em] text-[#313843]">
                  Workspace
                </h3>
              </div>

              <div className="mt-4 space-y-2 text-[14px] text-[#5f6876]">
                <div className="flex items-center justify-between">
                  <span>Conversations</span>
                  <span className="font-medium text-[#2f3640]">
                    {conversationList.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Unfinished</span>
                  <span className="font-medium text-[#2f3640]">
                    {unfinishedCount}
                  </span>
                </div>
                <div className="pt-1 text-[13px] text-[#8b93a1]">
                  {latestConversation
                    ? `Last active ${latestConversation.timestamp} ago`
                    : 'Ready to start'}
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/75 bg-[rgba(255,255,255,0.62)] p-4 shadow-[0_16px_34px_rgba(15,23,42,0.05)] backdrop-blur-2xl">
              <div className="flex items-center gap-2 text-[#7d89b4]">
                <Bot className="h-5 w-5" strokeWidth={1.9} />
                <h3 className="text-[15px] font-semibold tracking-[-0.02em] text-[#313843]">
                  Kivo status
                </h3>
              </div>

              <div className="mt-4 space-y-2.5 text-[14px] text-[#5f6876]">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#9fc8a3]" />
                  <span>{isAgentResponding ? 'Working' : 'Ready'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#b8d28f]" />
                  <span>Memory active</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#9ebfcb]" />
                  <span>{agentConversationCount || 0} agent threads</span>
                </div>
              </div>
            </div>

            <div className="col-span-2 rounded-[30px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.7),rgba(248,249,252,0.58))] p-4 shadow-[0_18px_36px_rgba(15,23,42,0.055)] backdrop-blur-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-[#8f76b0]">
                    <Sparkles className="h-5 w-5" strokeWidth={1.9} />
                    <h3 className="text-[15px] font-semibold tracking-[-0.02em] text-[#313843]">
                      Focus now
                    </h3>
                  </div>

                  <p className="mt-3 text-[24px] font-medium leading-[1.14] tracking-[-0.05em] text-[#2f3640]">
                    {latestConversation
                      ? latestConversation.unfinished
                        ? `Resume ${latestConversation.title}`
                        : 'Start a fresh operator session'
                      : 'Start your first Kivo thread'}
                  </p>

                  <p className="mt-2 max-w-[360px] text-[14px] leading-6 text-[#7a8190]">
                    {activeAlertCount > 0
                      ? `${activeAlertCount} active item${activeAlertCount > 1 ? 's' : ''} may need your attention.`
                      : latestConversation
                        ? 'Get back to your workspace and continue from where you left off.'
                        : 'Open a new chat and let Kivo help with your next step.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    latestConversation
                      ? handleOpenConversation(latestConversation.id)
                      : handleNewChat()
                  }
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/80 bg-[rgba(255,255,255,0.8)] text-[#576171] shadow-[0_8px_20px_rgba(15,23,42,0.05)] transition-all duration-200 ease-out hover:bg-white active:scale-[0.985]"
                >
                  <ArrowRight className="h-5 w-5" strokeWidth={2} />
                </button>
              </div>
            </div>
          </section>

          <section className="mt-5">
            <div className="relative mb-4">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98a0ad]"
                strokeWidth={1.8}
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search conversations"
                className="h-12 w-full rounded-full border border-white/80 bg-[rgba(255,255,255,0.72)] pl-11 pr-4 text-[15px] text-[#38404a] shadow-[0_10px_24px_rgba(15,23,42,0.05)] outline-none transition-all duration-200 ease-out placeholder:text-[#98a0ad] focus:border-black/[0.06] focus:bg-white"
              />
            </div>

            <div className="mb-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {HOME_TABS.map((item) => {
                const active = item.id === tab;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id)}
                    className={`shrink-0 rounded-full border px-4 py-2.5 text-[13px] font-medium tracking-[-0.01em] transition-all duration-200 ease-out active:scale-[0.985] ${
                      active
                        ? 'border-white/90 bg-white text-[#2f3640] shadow-[0_10px_24px_rgba(15,23,42,0.06)]'
                        : 'border-white/70 bg-[rgba(255,255,255,0.56)] text-[#7c8493] hover:bg-white/84'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="min-h-0 flex-1">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[28px] font-medium tracking-[-0.05em] text-[#313843]">
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
              <div className="flex min-h-[34vh] items-center justify-center rounded-[32px] border border-white/75 bg-[rgba(255,255,255,0.6)] p-8 text-center shadow-[0_18px_36px_rgba(15,23,42,0.05)] backdrop-blur-2xl">
                <div className="max-w-[300px]">
                  <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/80 bg-[rgba(255,255,255,0.75)] text-[#7d8593] shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
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
                    className="mt-5 inline-flex items-center rounded-full border border-white/80 bg-white px-4 py-2.5 text-sm font-medium text-[#374151] shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition-all duration-200 ease-out hover:bg-white/92 active:scale-[0.985]"
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
                      className={`flex w-full items-start gap-4 rounded-[26px] border px-4 py-4 text-left transition-all duration-200 ease-out active:scale-[0.992] ${
                        active
                          ? 'border-white/90 bg-white shadow-[0_18px_36px_rgba(15,23,42,0.07)]'
                          : 'border-white/75 bg-[rgba(255,255,255,0.62)] shadow-[0_12px_28px_rgba(15,23,42,0.045)] hover:bg-white/84 hover:shadow-[0_18px_34px_rgba(15,23,42,0.06)]'
                      }`}
                    >
                      <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/80 bg-[#f7f8fb] text-[#727b89]">
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
                              <h4 className="truncate text-[16px] font-medium tracking-[-0.02em] text-[#313843]">
                                {row.title}
                              </h4>

                              {row.unfinished ? (
                                <span className="shrink-0 rounded-full border border-[#d6e2f6] bg-[#edf3fb] px-2.5 py-1 text-[11px] font-medium text-[#6f87a8]">
                                  Unfinished
                                </span>
                              ) : row.kind === 'agent' ? (
                                <span className="shrink-0 rounded-full border border-[#ecd8c8] bg-[#f6eadf] px-2.5 py-1 text-[11px] font-medium text-[#b07a58]">
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
          className="fixed bottom-8 right-5 z-40 inline-flex h-[62px] w-[62px] items-center justify-center rounded-full bg-[#20201d] text-white shadow-[0_20px_38px_rgba(17,17,17,0.2)] transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]"
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
