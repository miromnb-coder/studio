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
  lastRole?: 'user' | 'assistant' | 'system';
  messageCount: number;
};

type QuickAction = {
  id: 'new' | 'continue' | 'calendar' | 'money';
  label: string;
  primary?: boolean;
  onClick: () => void;
};

const HOME_TABS: Array<{ id: HomeTab; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'agents', label: 'Agents' },
  { id: 'unfinished', label: 'Unfinished' },
  { id: 'today', label: 'Today' },
];

const FALLBACK_INSIGHTS = [
  'You work best when the next move is clearly defined.',
  'You move faster when unfinished work is narrowed down.',
  'You use Kivo best when chats become concrete next actions.',
  'You keep momentum better when one priority is made obvious.',
];

function GhostHeaderButton({
  onClick,
  children,
  label,
}: {
  onClick: () => void;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex h-11 items-center justify-center px-1 text-[#2A2A31] transition-all duration-200 ease-out hover:opacity-65 active:scale-[0.985]"
    >
      {children}
    </button>
  );
}

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
  const alerts = useAppStore((s) => s.alerts);
  const isAgentResponding = useAppStore((s) => s.isAgentResponding);

  const [search, setSearch] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [tab, setTab] = useState<HomeTab>('all');

  const [referralToastOpen, setReferralToastOpen] = useState(false);
  const [referralToastTitle, setReferralToastTitle] = useState('');
  const [referralToastDetail, setReferralToastDetail] = useState('');

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrate, hydrated]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch(searchValue.trim());
    }, 120);

    return () => window.clearTimeout(timeout);
  }, [searchValue]);

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
          lastRole: lastMessage?.role,
          messageCount: threadMessages.length,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.rawUpdatedAt).getTime() -
          new Date(a.rawUpdatedAt).getTime(),
      );
  }, [conversationList, draftState, messageState]);

  const todayRows = useMemo(() => {
    const now = new Date();
    return rows.filter((row) => {
      const updatedAt = new Date(row.rawUpdatedAt);
      return (
        updatedAt.getFullYear() === now.getFullYear() &&
        updatedAt.getMonth() === now.getMonth() &&
        updatedAt.getDate() === now.getDate()
      );
    });
  }, [rows]);

  const filteredRows = useMemo(() => {
    let next = rows;

    if (tab === 'agents') next = next.filter((row) => row.kind === 'agent');
    if (tab === 'unfinished') next = next.filter((row) => row.unfinished);
    if (tab === 'today') next = todayRows;

    if (!search) return next;

    const q = search.toLowerCase();
    return next.filter((row) =>
      `${row.title} ${row.preview}`.toLowerCase().includes(q),
    );
  }, [rows, search, tab, todayRows]);

  const latestConversation = rows[0] ?? null;
  const unfinishedRows = rows.filter((row) => row.unfinished);
  const unfinishedCount = unfinishedRows.length;
  const agentConversationCount = rows.filter((row) => row.kind === 'agent').length;
  const activeAlertCount = alerts.filter((alert) => !alert.resolved).length;
  const estimatedMoneySaved = 84;
  const totalMessages = rows.reduce((sum, row) => sum + row.messageCount, 0);

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

  const tasksCompletedThisWeek = useMemo(() => {
    const completedSignals = rows.filter(
      (row) => !row.unfinished && row.messageCount > 0,
    ).length;
    return Math.min(Math.max(completedSignals + Math.floor(totalMessages / 8), 1), 12);
  }, [rows, totalMessages]);

  const keyDecisionsMade = useMemo(() => {
    return Math.min(
      Math.max(
        agentConversationCount +
          Math.floor(activeAlertCount / 2) +
          Math.floor(totalMessages / 12),
        1,
      ),
      7,
    );
  }, [activeAlertCount, agentConversationCount, totalMessages]);

  const focusPeak = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return '9–11 AM';
    if (hour < 18) return '1–4 PM';
    return '6–8 PM';
  }, []);

  const streakDots = useMemo(() => {
    const strength = Math.min(tasksCompletedThisWeek + keyDecisionsMade, 7);
    return Array.from({ length: 7 }, (_, index) => index < strength);
  }, [keyDecisionsMade, tasksCompletedThisWeek]);

  const activePriorities = useMemo(() => {
    const priorities: string[] = [];

    if (unfinishedRows[0]?.title) priorities.push(`Finish ${unfinishedRows[0].title}`);
    if (activeAlertCount > 0) {
      priorities.push(
        `Resolve ${activeAlertCount} active alert${activeAlertCount > 1 ? 's' : ''}`,
      );
    }
    if (estimatedMoneySaved > 0) priorities.push('Review savings opportunities');
    if (agentConversationCount > 0) priorities.push('Check active agent work');

    if (priorities.length < 3 && latestConversation?.title) {
      priorities.push(`Continue ${latestConversation.title}`);
    }
    if (priorities.length < 3) priorities.push('Start one important task');

    return priorities.slice(0, 3);
  }, [
    activeAlertCount,
    agentConversationCount,
    estimatedMoneySaved,
    latestConversation?.title,
    unfinishedRows,
  ]);

  const insightText = useMemo(() => {
    if (isAgentResponding) {
      return 'You are already in a live working session. Keep the next step clear.';
    }
    if (unfinishedCount >= 3) {
      return 'You move faster when unfinished work is narrowed down to one clear next action.';
    }
    if (agentConversationCount >= 2) {
      return 'You use Kivo best when agent conversations are turned into concrete follow-through.';
    }
    if (todayRows.length >= 2) {
      return 'You are building momentum today. Keep the next move small and specific.';
    }
    return FALLBACK_INSIGHTS[Math.min(rows.length, FALLBACK_INSIGHTS.length - 1)];
  }, [agentConversationCount, isAgentResponding, rows.length, todayRows.length, unfinishedCount]);

  const focusTitle = useMemo(() => {
    const unfinishedTitle = unfinishedRows[0]?.title?.trim();
    if (unfinishedTitle) return `Resume ${unfinishedTitle}`;

    const latestTitle = latestConversation?.title?.trim();
    if (latestTitle) return `Continue ${latestTitle}`;

    const firstPriority = activePriorities[0]?.trim();
    if (firstPriority) return firstPriority;

    return 'Open Operator';
  }, [activePriorities, latestConversation?.title, unfinishedRows]);

  const hasRelevantContinue = Boolean(latestConversation);
  const showCalendarAction = true;
  const showMoneyAction = estimatedMoneySaved > 0 || activeAlertCount > 0;

  const openConversationAndGo = (conversationId: string) => {
    openConversation(conversationId);
    router.push('/chat');
  };

  const handleOpenConversation = (conversationId: string) => {
    openConversationAndGo(conversationId);
  };

  const handleNewChat = () => {
    const conversationId = createConversation();
    openConversation(conversationId);
    router.push('/chat');
  };

  const handleContinue = () => {
    if (latestConversation) {
      openConversationAndGo(latestConversation.id);
      return;
    }
    handleNewChat();
  };

  const handleOpenOperator = () => {
    const highestPriorityTarget = unfinishedRows[0] ?? latestConversation;

    if (highestPriorityTarget) {
      openConversationAndGo(highestPriorityTarget.id);
      return;
    }

    handleNewChat();
  };

  const handleCalendar = () => {
    router.push('/actions?tool=google-calendar');
  };

  const handleMoney = () => {
    router.push('/money-saver');
  };

  const quickActions = useMemo<QuickAction[]>(() => {
    const items: QuickAction[] = [
      {
        id: 'new',
        label: 'New chat',
        primary: true,
        onClick: handleNewChat,
      },
    ];

    if (hasRelevantContinue) {
      items.push({
        id: 'continue',
        label: 'Continue',
        onClick: handleContinue,
      });
    }

    if (showCalendarAction) {
      items.push({
        id: 'calendar',
        label: 'Calendar',
        onClick: handleCalendar,
      });
    }

    if (showMoneyAction) {
      items.push({
        id: 'money',
        label: 'Money',
        onClick: handleMoney,
      });
    }

    return items;
  }, [hasRelevantContinue, showCalendarAction, showMoneyAction]);

  return (
    <div className="min-h-screen overflow-hidden bg-[#F6F6F7] text-[#141419]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#F7F7F8_0%,#FAFAFB_38%,#F4F4F5_100%)]" />
        <div className="absolute inset-x-0 top-0 h-[220px] bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.92)_0%,rgba(255,255,255,0.42)_52%,rgba(255,255,255,0)_84%)]" />
        <div className="absolute left-1/2 top-[10%] h-[260px] w-[260px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.96)_0%,rgba(247,247,248,0.48)_56%,rgba(247,247,248,0)_100%)] blur-[32px]" />
        <div className="absolute left-1/2 bottom-[-88px] h-[280px] w-[120%] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(237,237,240,0.75)_0%,rgba(237,237,240,0.18)_56%,rgba(237,237,240,0)_100%)] blur-[36px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-[560px] flex-col">
        <header
          className="sticky top-0 z-30 border-b border-black/[0.05] bg-white/72 px-5 pb-3 pt-4 backdrop-blur-2xl"
          style={{ paddingTop: 'max(16px, env(safe-area-inset-top, 0px))' }}
        >
          <div className="flex items-center justify-between">
            <GhostHeaderButton
              onClick={() => router.push('/settings')}
              label="Open settings"
            >
              <User className="h-5 w-5" strokeWidth={1.9} />
            </GhostHeaderButton>

            <h1 className="text-[21px] font-semibold tracking-[-0.045em] text-[#141419]">
              Workspace
            </h1>

            <GhostHeaderButton
              onClick={() => router.push('/history')}
              label="Open search"
            >
              <Search className="h-5 w-5" strokeWidth={1.9} />
            </GhostHeaderButton>
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col px-5 pb-32 pt-4">
          <section>
            <div className="max-w-[430px]">
              <p className="text-[18px] font-medium tracking-[-0.03em] text-[#7B7B84]">
                {greeting}
              </p>

              <h2
                className="mt-1.5 text-[34px] font-normal leading-[1.02] tracking-[-0.06em] text-[#141419]"
                style={{ fontFamily: 'ui-serif, Georgia, Times, serif' }}
              >
                What needs your attention today?
              </h2>

              <p className="mt-3 max-w-[420px] text-[15px] leading-6 tracking-[-0.015em] text-[#7B7B84]">
                Plan, decide, and move faster.
              </p>
            </div>
          </section>

          <section className="mt-5">
            <div className="relative overflow-hidden rounded-[34px] border border-black/[0.06] bg-white p-5 shadow-[0_16px_34px_rgba(0,0,0,0.04)]">
              <div className="pointer-events-none absolute right-[-30px] top-1/2 h-[180px] w-[180px] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(0,0,0,0.04)_0%,rgba(0,0,0,0.02)_36%,rgba(0,0,0,0)_72%)] blur-[20px]" />

              <div className="relative">
                <div className="flex items-center gap-2 text-[#141419]">
                  <Sparkles className="h-4.5 w-4.5" strokeWidth={2} />
                  <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#141419]/78">
                    Focus now
                  </span>
                </div>

                <h3 className="mt-4 max-w-[320px] text-[30px] font-semibold leading-[1.05] tracking-[-0.055em] text-[#141419]">
                  {focusTitle}
                </h3>

                <p className="mt-3 max-w-[360px] text-[15px] leading-7 tracking-[-0.012em] text-[#7B7B84]">
                  {activeAlertCount > 0
                    ? `${activeAlertCount} active item${activeAlertCount > 1 ? 's' : ''} may need your attention.`
                    : latestConversation?.unfinished
                      ? 'Pick up where you left off and keep your momentum going.'
                      : 'Let Kivo guide your next move and surface what matters most.'}
                </p>

                <button
                  type="button"
                  onClick={handleOpenOperator}
                  className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-[#0B0B0F] px-5 text-[14px] font-semibold tracking-[-0.015em] text-white shadow-[0_10px_24px_rgba(0,0,0,0.14)] transition-all duration-200 ease-out hover:-translate-y-[1px] hover:bg-black active:translate-y-0 active:scale-[0.985]"
                >
                  Open Operator
                </button>
              </div>
            </div>
          </section>

          <section className="mt-4 flex gap-2 overflow-x-auto pb-1 pr-24 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {quickActions.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={action.onClick}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-3 text-[15px] font-medium tracking-[-0.02em] transition-all duration-200 ease-out active:scale-[0.985] ${
                  action.primary
                    ? 'bg-[#0B0B0F] text-white shadow-[0_10px_22px_rgba(0,0,0,0.12)]'
                    : 'border border-black/[0.05] bg-white text-[#7B7B84] shadow-[0_8px_16px_rgba(0,0,0,0.03)] hover:bg-[#FCFCFD]'
                }`}
              >
                {action.id === 'new' ? (
                  <Sparkles className="h-4.5 w-4.5" strokeWidth={2} />
                ) : action.id === 'continue' ? (
                  <Activity className="h-4.5 w-4.5" strokeWidth={2} />
                ) : action.id === 'calendar' ? (
                  <Bot className="h-4.5 w-4.5" strokeWidth={2} />
                ) : (
                  <Activity className="h-4.5 w-4.5" strokeWidth={2} />
                )}
                {action.label}
              </button>
            ))}
          </section>

          <section className="mt-4">
            <div className="overflow-hidden rounded-[30px] border border-black/[0.06] bg-white shadow-[0_16px_34px_rgba(0,0,0,0.04)]">
              <div className="grid gap-0 sm:grid-cols-[1.45fr_1fr]">
                <div className="border-b border-black/[0.05] px-5 py-4 sm:border-b-0 sm:border-r">
                  <h3 className="text-[18px] font-semibold tracking-[-0.03em] text-[#141419]">
                    This week
                  </h3>

                  <div className="mt-3.5 space-y-2.5">
                    <div className="flex items-center gap-2 text-[16px] text-[#2B2B31]">
                      <span className="text-[#141419]">✓</span>
                      <span>{tasksCompletedThisWeek} tasks completed</span>
                    </div>

                    <div className="flex items-center gap-2 text-[16px] text-[#2B2B31]">
                      <span className="text-[#141419]">€</span>
                      <span>€{estimatedMoneySaved} saved</span>
                    </div>

                    <div className="flex items-center gap-2 text-[16px] text-[#2B2B31]">
                      <span className="text-[#141419]/46">◌</span>
                      <span>{keyDecisionsMade} key decisions made</span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center gap-2">
                      {streakDots.map((active, index) => (
                        <span
                          key={index}
                          className={`h-2.5 flex-1 rounded-full ${
                            active ? 'bg-[#141419]/22' : 'bg-[#ECECEF]'
                          }`}
                        />
                      ))}
                    </div>

                    <div className="mt-2.5 grid grid-cols-7 gap-2 text-center text-[12px] text-[#9A9AA3]">
                      <span>Mon</span>
                      <span>Tue</span>
                      <span>Wed</span>
                      <span>Thu</span>
                      <span>Fri</span>
                      <span>Sat</span>
                      <span>Sun</span>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[15px] font-medium tracking-[-0.02em] text-[#7B7B84]">
                        Forward motion
                      </p>
                      <p className="mt-1.5 text-[22px] font-semibold leading-[1.08] tracking-[-0.05em] text-[#141419]">
                        Increase your weekly progress
                      </p>
                    </div>

                    <ChevronRight
                      className="mt-1 h-5 w-5 shrink-0 text-[#9A9AA3]"
                      strokeWidth={2}
                    />
                  </div>

                  <div className="mt-4 rounded-[22px] border border-black/[0.04] bg-[#FAFAFB] px-4 py-3">
                    <p className="text-[13px] text-[#7B7B84]">Your focus peak</p>
                    <p className="mt-1 text-[18px] font-semibold tracking-[-0.03em] text-[#141419]">
                      {focusPeak}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-4">
            <div className="grid grid-cols-3 gap-3 rounded-[28px] border border-black/[0.06] bg-white px-4 py-4 shadow-[0_14px_30px_rgba(0,0,0,0.035)]">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#F4F4F6] text-[#141419]">
                  <MessageCircle className="h-5 w-5" strokeWidth={1.9} />
                </span>
                <div>
                  <div className="text-[13px] text-[#7B7B84]">Conversations</div>
                  <div className="mt-0.5 text-[16px] font-semibold tracking-[-0.02em] text-[#141419]">
                    {conversationList.length}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 border-x border-black/[0.05] px-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#F4F4F6] text-[#141419]">
                  <Bot className="h-5 w-5" strokeWidth={1.9} />
                </span>
                <div>
                  <div className="text-[13px] text-[#7B7B84]">State</div>
                  <div className="mt-0.5 text-[16px] font-semibold tracking-[-0.02em] text-[#141419]">
                    {statusLabel}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pl-1">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#F4F4F6] text-[#141419]">
                  <Activity className="h-5 w-5" strokeWidth={1.9} />
                </span>
                <div>
                  <div className="text-[13px] text-[#7B7B84]">Money saved</div>
                  <div className="mt-0.5 text-[16px] font-semibold tracking-[-0.02em] text-[#141419]">
                    €{estimatedMoneySaved}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-4">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[#9A9AA3]"
                strokeWidth={1.9}
              />
              <input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search conversations..."
                className="h-[52px] w-full rounded-full border border-black/[0.06] bg-white pl-11 pr-12 text-[15px] text-[#141419] shadow-[0_10px_22px_rgba(0,0,0,0.03)] outline-none transition-all duration-200 ease-out placeholder:text-[#9A9AA3] focus:border-black/[0.08]"
              />
              <button
                type="button"
                onClick={() => router.push('/history')}
                aria-label="Open filters"
                className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[#7B7B84] transition-all duration-200 ease-out hover:bg-black/[0.03]"
              >
                <Settings2 className="h-4.5 w-4.5" strokeWidth={1.9} />
              </button>
            </div>

            <div className="mt-3.5 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {HOME_TABS.map((item) => {
                const active = item.id === tab;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id)}
                    className={`shrink-0 rounded-full px-5 py-2.5 text-[14px] font-medium tracking-[-0.015em] transition-all duration-200 ease-out active:scale-[0.985] ${
                      active
                        ? 'bg-[#0B0B0F] text-white shadow-[0_10px_22px_rgba(0,0,0,0.12)]'
                        : 'border border-black/[0.05] bg-white text-[#7B7B84] shadow-[0_8px_16px_rgba(0,0,0,0.02)] hover:bg-[#FCFCFD]'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="mt-5 min-h-0 flex-1">
            <div className="mb-3.5 flex items-center justify-between">
              <h3 className="text-[28px] font-semibold tracking-[-0.05em] text-[#141419]">
                Recent chats
              </h3>

              <button
                type="button"
                onClick={() => router.push('/history')}
                className="inline-flex items-center gap-1 text-[15px] font-medium text-[#7B7B84] transition-colors hover:text-[#141419]"
              >
                See all
                <ChevronRight className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>

            {filteredRows.length === 0 ? (
              <div className="rounded-[32px] border border-black/[0.06] bg-white p-8 text-center shadow-[0_18px_36px_rgba(0,0,0,0.04)]">
                <div className="mx-auto max-w-[300px]">
                  <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#F4F4F6] text-[#7B7B84]">
                    <MessageCircle className="h-6 w-6" strokeWidth={1.8} />
                  </div>

                  <h2
                    className="text-[28px] font-normal leading-[1.08] tracking-[-0.05em] text-[#141419]"
                    style={{ fontFamily: 'ui-serif, Georgia, Times, serif' }}
                  >
                    No conversations
                  </h2>

                  <p className="mt-3 text-[14px] leading-6 text-[#7B7B84]">
                    Start a new chat and it will appear here.
                  </p>

                  <button
                    type="button"
                    onClick={handleNewChat}
                    className="mt-5 inline-flex items-center rounded-full border border-black/[0.05] bg-white px-4 py-2.5 text-sm font-medium text-[#141419] shadow-[0_10px_22px_rgba(0,0,0,0.03)] transition-all duration-200 ease-out active:scale-[0.985]"
                  >
                    New chat
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-3">
                  {filteredRows.slice(0, 3).map((row) => {
                    const active = activeConversationId === row.id;

                    return (
                      <button
                        key={row.id}
                        type="button"
                        onClick={() => handleOpenConversation(row.id)}
                        className={`flex w-full items-start gap-4 rounded-[28px] border px-4 py-4 text-left transition-all duration-200 ease-out active:scale-[0.992] ${
                          active
                            ? 'border-black/[0.08] bg-white shadow-[0_18px_34px_rgba(0,0,0,0.05)]'
                            : 'border-black/[0.06] bg-white shadow-[0_12px_24px_rgba(0,0,0,0.03)] hover:bg-[#FCFCFD]'
                        }`}
                      >
                        <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#F4F4F6] text-[#7B7B84]">
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
                                <h4 className="truncate text-[17px] font-semibold tracking-[-0.02em] text-[#141419]">
                                  {row.title}
                                </h4>

                                {row.unfinished ? (
                                  <span className="shrink-0 rounded-full border border-black/[0.05] bg-[#F7F7F8] px-2.5 py-1 text-[11px] font-medium text-[#7B7B84]">
                                    Unfinished
                                  </span>
                                ) : row.kind === 'agent' ? (
                                  <span className="shrink-0 rounded-full border border-black/[0.05] bg-[#F7F7F8] px-2.5 py-1 text-[11px] font-medium text-[#7B7B84]">
                                    Agent
                                  </span>
                                ) : null}
                              </div>

                              <p className="mt-1 line-clamp-2 text-[14px] leading-6 text-[#7B7B84]">
                                {row.preview}
                              </p>
                            </div>

                            <div className="flex shrink-0 items-center gap-2">
                              <span className="text-[12px] font-medium tracking-[-0.01em] text-[#9A9AA3]">
                                {row.timestamp}
                              </span>
                              <ChevronRight
                                className="h-5 w-5 text-[#A1A1AA]"
                                strokeWidth={1.8}
                              />
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-4">
                  <div className="rounded-[28px] border border-black/[0.06] bg-white p-5 shadow-[0_14px_30px_rgba(0,0,0,0.03)]">
                    <h4 className="text-[18px] font-semibold tracking-[-0.03em] text-[#141419]">
                      Active priorities
                    </h4>

                    <ul className="mt-4 space-y-3">
                      {activePriorities.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-3 text-[16px] leading-6 text-[#7B7B84]"
                        >
                          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#141419]/26" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-[28px] border border-black/[0.06] bg-white p-5 shadow-[0_14px_30px_rgba(0,0,0,0.03)]">
                    <h4 className="text-[18px] font-semibold tracking-[-0.03em] text-[#141419]">
                      Insight of the week
                    </h4>

                    <p className="mt-4 text-[17px] leading-7 tracking-[-0.018em] text-[#4F4F58]">
                      {insightText}
                    </p>

                    <p className="mt-4 text-[13px] text-[#9A9AA3]">
                      Based on your recent activity, {displayName}.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>
        </main>

        <button
          type="button"
          onClick={handleNewChat}
          aria-label="Start new chat"
          className="fixed bottom-8 right-5 z-40 inline-flex h-[62px] w-[62px] items-center justify-center rounded-full bg-[#0B0B0F] text-white shadow-[0_20px_38px_rgba(0,0,0,0.18)] transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]"
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
