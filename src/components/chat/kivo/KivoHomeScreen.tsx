'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  Bot,
  CalendarDays,
  ChevronRight,
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

  const estimatedMoneySaved = 84;
  const momentumSubtitle =
    unfinishedCount > 0
      ? `${unfinishedCount} unfinished • €${estimatedMoneySaved} saved`
      : `Everything moving • €${estimatedMoneySaved} saved`;

  const operatorSubtitle = isAgentResponding
    ? 'Kivo is actively working now'
    : activeAlertCount > 0
      ? `${activeAlertCount} active item${activeAlertCount > 1 ? 's' : ''} need review`
      : 'Fresh suggestions are ready';

  const flowSubtitle = latestConversation
    ? latestConversation.unfinished
      ? 'Next best step is ready'
      : 'Plan your next focused move'
    : 'Shape your next session';

  return (
    <div className="min-h-screen overflow-hidden bg-[#f7f7f5] text-[#2d3440]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#fbfbf9_0%,#f7f7f5_36%,#f1f3f6_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_10%,rgba(255,255,255,0.96),transparent_28%),radial-gradient(circle_at_82%_14%,rgba(219,227,241,0.6),transparent_28%),radial-gradient(circle_at_58%_74%,rgba(228,233,242,0.56),transparent_34%)]" />
        <div
          className="absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              'radial-gradient(rgba(124,136,158,0.24) 0.7px, transparent 0.7px)',
            backgroundSize: '16px 16px',
            backgroundPosition: 'center top',
          }}
        />
        <div className="absolute left-1/2 top-[6%] h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.95)_0%,rgba(255,255,255,0.26)_58%,rgba(255,255,255,0)_100%)] blur-[32px]" />
        <div className="absolute -left-[6%] top-[28%] h-[260px] w-[60%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(240,244,251,0.78)_0%,rgba(240,244,251,0.18)_62%,rgba(240,244,251,0)_100%)] blur-[34px]" />
        <div className="absolute bottom-[-120px] left-[-10%] h-[320px] w-[130%] rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(221,228,239,0.72)_0%,rgba(221,228,239,0.28)_46%,rgba(221,228,239,0)_100%)] blur-[36px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-[560px] flex-col">
        <header className="sticky top-0 z-30 border-b border-white/60 bg-[rgba(247,247,245,0.7)] px-5 pb-3 pt-4 backdrop-blur-2xl">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.push('/settings')}
              aria-label="Open settings"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/80 bg-[rgba(255,255,255,0.74)] text-[#3b434f] shadow-[0_8px_18px_rgba(15,23,42,0.045)] transition-all duration-200 ease-out hover:bg-white active:scale-[0.985]"
            >
              <User className="h-5 w-5" strokeWidth={1.9} />
            </button>

            <h1 className="text-[21px] font-medium tracking-[-0.04em] text-[#2d3440]">
              Home
            </h1>

            <button
              type="button"
              onClick={() => router.push('/history')}
              aria-label="Open conversations"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/80 bg-[rgba(255,255,255,0.74)] text-[#3b434f] shadow-[0_8px_18px_rgba(15,23,42,0.045)] transition-all duration-200 ease-out hover:bg-white active:scale-[0.985]"
            >
              <Search className="h-5 w-5" strokeWidth={1.9} />
            </button>
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col px-5 pb-28 pt-5">
          <section className="relative overflow-hidden rounded-[36px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(246,247,250,0.72))] p-5 shadow-[0_22px_48px_rgba(15,23,42,0.055)] backdrop-blur-2xl">
            <div className="pointer-events-none absolute right-[-38px] top-[-30px] h-[140px] w-[140px] rounded-full bg-[radial-gradient(circle,rgba(237,241,248,0.95)_0%,rgba(237,241,248,0.2)_58%,rgba(237,241,248,0)_100%)] blur-[8px]" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-[rgba(255,255,255,0.74)] px-3 py-1 text-[12px] font-medium tracking-[0.12em] text-[#8d97a6] shadow-[0_6px_14px_rgba(15,23,42,0.035)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#9aa7bb]" />
                  KIVO
                </div>

                <h2 className="mt-4 text-[35px] font-medium tracking-[-0.065em] text-[#28303b]">
                  Welcome back, {displayName}
                </h2>

                <p className="mt-3 max-w-[420px] text-[15px] leading-7 text-[#7d8391]">
                  Your workspace is ready. Continue where you left off or start
                  something new.
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleNewChat}
                className="flex min-h-[92px] flex-col items-start justify-between rounded-[28px] border border-[#2c2c2a] bg-[linear-gradient(180deg,#20201d_0%,#121212_100%)] px-4 py-4 text-left text-white shadow-[0_18px_36px_rgba(17,17,17,0.18)] transition-all duration-200 ease-out hover:scale-[1.01] active:scale-[0.99]"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                  <Sparkles className="h-4.5 w-4.5" strokeWidth={2} />
                </span>
                <div>
                  <div className="text-[15px] font-semibold tracking-[-0.02em]">
                    New chat
                  </div>
                  <div className="mt-1 text-[12px] text-white/78">
                    Start something fresh
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => router.push('/momentum')}
                className="flex min-h-[92px] flex-col items-start justify-between rounded-[28px] border border-white/80 bg-[rgba(255,255,255,0.76)] px-4 py-4 text-left shadow-[0_14px_30px_rgba(15,23,42,0.05)] transition-all duration-200 ease-out hover:bg-white active:scale-[0.99]"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#eef3fb] text-[#6982a7]">
                  <Activity className="h-4.5 w-4.5" strokeWidth={2} />
                </span>
                <div>
                  <div className="text-[15px] font-semibold tracking-[-0.02em] text-[#2d3440]">
                    Momentum
                  </div>
                  <div className="mt-1 text-[12px] text-[#7d8594]">
                    {momentumSubtitle}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => router.push('/operator')}
                className="flex min-h-[86px] flex-col items-start justify-between rounded-[26px] border border-white/80 bg-[rgba(255,255,255,0.72)] px-4 py-4 text-left shadow-[0_12px_24px_rgba(15,23,42,0.042)] transition-all duration-200 ease-out hover:bg-white active:scale-[0.99]"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#f3eef8] text-[#8a73a6]">
                  <Bot className="h-4 w-4" strokeWidth={2} />
                </span>
                <div>
                  <div className="text-[15px] font-medium tracking-[-0.02em] text-[#313843]">
                    Operator
                  </div>
                  <div className="mt-1 text-[12px] text-[#7d8594]">
                    {operatorSubtitle}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => router.push('/flow')}
                className="flex min-h-[86px] flex-col items-start justify-between rounded-[26px] border border-white/80 bg-[rgba(255,255,255,0.72)] px-4 py-4 text-left shadow-[0_12px_24px_rgba(15,23,42,0.042)] transition-all duration-200 ease-out hover:bg-white active:scale-[0.99]"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#edf4ef] text-[#7b9783]">
                  <CalendarDays className="h-4 w-4" strokeWidth={2} />
                </span>
                <div>
                  <div className="text-[15px] font-medium tracking-[-0.02em] text-[#313843]">
                    Flow
                  </div>
                  <div className="mt-1 text-[12px] text-[#7d8594]">
                    {flowSubtitle}
                  </div>
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
                  className="shrink-0 rounded-full border border-white/80 bg-[rgba(255,255,255,0.74)] px-4 py-2.5 text-[13px] font-medium tracking-[-0.01em] text-[#67717f] shadow-[0_8px_16px_rgba(15,23,42,0.035)] transition-all duration-200 ease-out hover:bg-white active:scale-[0.985]"
                >
                  {item}
                </button>
              ))}
            </div>
          </section>

          <section className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-[30px] border border-white/80 bg-[rgba(255,255,255,0.74)] p-4 shadow-[0_16px_34px_rgba(15,23,42,0.045)] backdrop-blur-2xl">
              <div className="flex items-center gap-2 text-[#6b82a5]">
                <MessageCircle className="h-5 w-5" strokeWidth={1.9} />
                <h3 className="text-[15px] font-semibold tracking-[-0.02em] text-[#313843]">
                  Workspace
                </h3>
              </div>

              <div className="mt-4 space-y-2 text-[14px] text-[#606a78]">
                <div className="flex items-center justify-between">
                  <span>Conversations</span>
                  <span className="font-medium text-[#2d3440]">
                    {conversationList.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Unfinished</span>
                  <span className="font-medium text-[#2d3440]">
                    {unfinishedCount}
                  </span>
                </div>
                <div className="pt-1 text-[13px] text-[#8c94a2]">
                  {latestConversation
                    ? `Last active ${latestConversation.timestamp} ago`
                    : 'Ready to start'}
                </div>
              </div>
            </div>

            <div className="rounded-[30px] border border-white/80 bg-[rgba(255,255,255,0.74)] p-4 shadow-[0_16px_34px_rgba(15,23,42,0.045)] backdrop-blur-2xl">
              <div className="flex items-center gap-2 text-[#7a86b1]">
                <Bot className="h-5 w-5" strokeWidth={1.9} />
                <h3 className="text-[15px] font-semibold tracking-[-0.02em] text-[#313843]">
                  Kivo status
                </h3>
              </div>

              <div className="mt-4 space-y-2.5 text-[14px] text-[#606a78]">
                <div className="flex items-center justify-between">
                  <span>State</span>
                  <span className="font-medium text-[#2d3440]">
                    {isAgentResponding ? 'Working' : 'Ready'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Agent threads</span>
                  <span className="font-medium text-[#2d3440]">
                    {agentConversationCount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Money saved</span>
                  <span className="font-medium text-[#7b9783]">
                    €{estimatedMoneySaved}
                  </span>
                </div>
              </div>
            </div>

            <div className="col-span-2 rounded-[32px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.8),rgba(246,247,250,0.72))] p-4 shadow-[0_18px_36px_rgba(15,23,42,0.05)] backdrop-blur-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-[#8e73ab]">
                    <Sparkles className="h-5 w-5" strokeWidth={1.9} />
                    <h3 className="text-[15px] font-semibold tracking-[-0.02em] text-[#313843]">
                      Focus now
                    </h3>
                  </div>

                  <p className="mt-3 text-[24px] font-medium leading-[1.14] tracking-[-0.05em] text-[#2d3440]">
                    {latestConversation
                      ? latestConversation.unfinished
                        ? `Resume ${latestConversation.title}`
                        : 'Open Operator for the next best move'
                      : 'Start your first Kivo thread'}
                  </p>

                  <p className="mt-2 max-w-[360px] text-[14px] leading-6 text-[#7d8391]">
                    {activeAlertCount > 0
                      ? `${activeAlertCount} active item${activeAlertCount > 1 ? 's' : ''} may need your attention.`
                      : latestConversation
                        ? 'Review what matters, see your momentum, or open your next flow.'
                        : 'Open a new chat and let Kivo help with your next step.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => router.push('/operator')}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/85 bg-[rgba(255,255,255,0.84)] text-[#576171] shadow-[0_8px_18px_rgba(15,23,42,0.04)] transition-all duration-200 ease-out hover:bg-white active:scale-[0.985]"
                >
                  <ChevronRight className="h-5 w-5" strokeWidth={2} />
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
                className="h-12 w-full rounded-full border border-white/85 bg-[rgba(255,255,255,0.76)] pl-11 pr-4 text-[15px] text-[#38404a] shadow-[0_10px_22px_rgba(15,23,42,0.04)] outline-none transition-all duration-200 ease-out placeholder:text-[#98a0ad] focus:border-black/[0.06] focus:bg-white"
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
                        ? 'border-white/90 bg-white text-[#2d3440] shadow-[0_10px_22px_rgba(15,23,42,0.05)]'
                        : 'border-white/80 bg-[rgba(255,255,255,0.66)] text-[#7c8493] hover:bg-white'
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
              <div className="flex min-h-[34vh] items-center justify-center rounded-[34px] border border-white/80 bg-[rgba(255,255,255,0.72)] p-8 text-center shadow-[0_18px_36px_rgba(15,23,42,0.045)] backdrop-blur-2xl">
                <div className="max-w-[300px]">
                  <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/85 bg-[rgba(255,255,255,0.82)] text-[#7d8593] shadow-[0_10px_22px_rgba(15,23,42,0.04)]">
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
                    className="mt-5 inline-flex items-center rounded-full border border-white/85 bg-white px-4 py-2.5 text-sm font-medium text-[#374151] shadow-[0_10px_22px_rgba(15,23,42,0.04)] transition-all duration-200 ease-out hover:bg-white active:scale-[0.985]"
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
                          ? 'border-white/92 bg-white shadow-[0_18px_34px_rgba(15,23,42,0.06)]'
                          : 'border-white/82 bg-[rgba(255,255,255,0.72)] shadow-[0_12px_24px_rgba(15,23,42,0.04)] hover:bg-white hover:shadow-[0_16px_30px_rgba(15,23,42,0.05)]'
                      }`}
                    >
                      <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/85 bg-[#f7f8fb] text-[#727b89]">
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
                                <span className="shrink-0 rounded-full border border-[#d8e3f4] bg-[#edf3fb] px-2.5 py-1 text-[11px] font-medium text-[#6f87a8]">
                                  Unfinished
                                </span>
                              ) : row.kind === 'agent' ? (
                                <span className="shrink-0 rounded-full border border-[#eedfcf] bg-[#f8eee5] px-2.5 py-1 text-[11px] font-medium text-[#af7b58]">
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
