'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlarmClock, BarChart3, CalendarClock, ClipboardList, Clock3, FileSearch, GitCompare, MailCheck, PenSquare, PenTool, PiggyBank, Sparkles, Wallet } from 'lucide-react';
import { useAppStore } from '../store/app-store';
import { AppShell, PremiumCard, ProductPageHeader, SectionHeader } from '../components/premium-ui';
import { ActionTile, EmptyIllustration } from '../components/product-sections';
import { trackEvent } from '../lib/analytics-client';

type OperatorAction = 'inbox_summary' | 'urgent' | 'subscriptions' | 'draft' | 'digest';
type CalendarOperatorAction = 'today_plan' | 'find_focus_time' | 'check_busy_week' | 'weekly_reset';

type ScoredEmail = {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  urgencyScore: number;
  relevanceScore: number;
};

type GmailOperatorData = {
  inboxSummary: null | {
    headline: string;
    importantCount: number;
    urgentCount: number;
    ignoreCount: number;
    bestNextMove: string;
    recommendedActions: string[];
    importantEmails: ScoredEmail[];
    urgentEmails: ScoredEmail[];
    lowPriorityEmails: ScoredEmail[];
  };
  urgent: null | {
    totalUrgent: number;
    priorityList: ScoredEmail[];
    suggestedActions: string[];
  };
  subscriptions: null | {
    activeCount: number;
    estimatedMonthlySavings: number;
    currency: string;
    duplicateCount: number;
    trialEndingCount: number;
    renewalCount: number;
    priceIncreaseCount: number;
    cancellationOpportunities: string[];
    opportunities: Array<{ merchant: string; note: string; status: string }>;
    summary: string;
  };
  digest: null | {
    title: string;
    conciseSummary: string;
    importantHighlights: string[];
    moneyRisks: string[];
    cleanupActions: string[];
    nextWeekWatchouts: string[];
  };
  draftsByMessageId: Record<string, {
    shortReply: string;
    professionalReply: string;
    friendlyReply: string;
    politeDecline: string;
    askForMoreTime: string;
  }>;
};

type CalendarOperatorData = {
  todayPlan: null | {
    generatedAt: string;
    todaysEvents: Array<{ id: string; summary: string; startAt: string; endAt: string }>;
    bestFocusSlot: { startAt: string; endAt: string; durationMinutes: number } | null;
    nextImportantEvent: { id: string; summary: string; startAt: string; endAt: string } | null;
    recommendedAction: string;
  };
  freeTime: null | {
    nextFree30Min: { startAt: string; endAt: string } | null;
    nextFree60Min: { startAt: string; endAt: string } | null;
    bestDeepWorkWindow: { startAt: string; endAt: string; durationMinutes: number } | null;
  };
  overload: null | {
    tooManyMeetings: boolean;
    noRecoveryGaps: boolean;
    busyTomorrow: boolean;
    deadlinePressure: boolean;
    summary: string;
  };
  weeklyReset: null | {
    bestTimeBlocks: Array<{ startAt: string; endAt: string; durationMinutes: number }>;
    overloadedDays: Array<{ day: string; meetingCount: number; meetingMinutes: number }>;
    opportunities: string[];
  };
};

const toolPrompts = {
  summarize: 'Summarize this and give me key actions.',
  rewrite: 'Rewrite this with a premium concise tone.',
  analyze: 'Analyze this and tell me what matters most.',
  compare: 'Compare these options and choose the best one.',
  plan: 'Generate a practical plan with milestones.',
};

const initialData: GmailOperatorData = {
  inboxSummary: null,
  urgent: null,
  subscriptions: null,
  digest: null,
  draftsByMessageId: {},
};

const initialCalendarData: CalendarOperatorData = {
  todayPlan: null,
  freeTime: null,
  overload: null,
  weeklyReset: null,
};

export default function ActionsPage() {
  const searchParams = useSearchParams();
  const selectedTool = searchParams.get('tool');
  const isEmailOperator = selectedTool === 'gmail';
  const isCalendarOperator = selectedTool === 'google-calendar';

  const hydrated = useAppStore((s) => s.hydrated);
  const hydrate = useAppStore((s) => s.hydrate);
  const enqueuePromptAndGoToChat = useAppStore((s) => s.enqueuePromptAndGoToChat);

  const [gmailConnected, setGmailConnected] = useState<boolean | null>(null);
  const [data, setData] = useState<GmailOperatorData>(initialData);
  const [calendarData, setCalendarData] = useState<CalendarOperatorData>(initialCalendarData);
  const [busyAction, setBusyAction] = useState<OperatorAction | null>(null);
  const [busyCalendarAction, setBusyCalendarAction] = useState<CalendarOperatorAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrate, hydrated]);

  useEffect(() => {
    if (!isEmailOperator && !isCalendarOperator) return;

    const run = async () => {
      const statusRoute = isEmailOperator ? '/api/integrations/gmail/status' : '/api/integrations/google-calendar/status';
      const response = await fetch(statusRoute, { cache: 'no-store' });
      if (!response.ok) {
        setGmailConnected(false);
        return;
      }
      const status = await response.json();
      setGmailConnected(Boolean(status.connected));
    };

    void run();
  }, [isCalendarOperator, isEmailOperator]);

  const invokeAction = async (action: OperatorAction, messageId?: string) => {
    setBusyAction(action);
    setError(null);

    try {
      const response = await fetch('/api/integrations/gmail/operator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, messageId }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Action failed');
      }

      setData((prev) => {
        if (action === 'inbox_summary') return { ...prev, inboxSummary: payload.result };
        if (action === 'urgent') return { ...prev, urgent: payload.result };
        if (action === 'subscriptions') return { ...prev, subscriptions: payload.result };
        if (action === 'digest') return { ...prev, digest: payload.result };
        if (action === 'draft' && messageId) {
          return {
            ...prev,
            draftsByMessageId: {
              ...prev.draftsByMessageId,
              [messageId]: payload.result,
            },
          };
        }
        return prev;
      });

      if (action === 'inbox_summary') trackEvent('inbox_summary_opened');
      if (action === 'urgent') trackEvent('urgent_emails_viewed');
      if (action === 'subscriptions') trackEvent('subscriptions_found');
      if (action === 'draft') trackEvent('draft_generated', { properties: { messageId } });
      if (action === 'digest') trackEvent('digest_viewed');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to run this action now.');
    } finally {
      setBusyAction(null);
    }
  };

  const recentImportant = useMemo(() => data.inboxSummary?.importantEmails.slice(0, 5) || [], [data.inboxSummary]);

  const invokeCalendarAction = async (action: CalendarOperatorAction) => {
    setBusyCalendarAction(action);
    setError(null);

    try {
      const response = await fetch('/api/integrations/google-calendar/operator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Action failed');
      }

      setCalendarData((prev) => {
        if (action === 'today_plan') return { ...prev, todayPlan: payload.result };
        if (action === 'find_focus_time') return { ...prev, freeTime: payload.result };
        if (action === 'check_busy_week') return { ...prev, overload: payload.result };
        if (action === 'weekly_reset') return { ...prev, weeklyReset: payload.result };
        return prev;
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to run this action now.');
    } finally {
      setBusyCalendarAction(null);
    }
  };

  if (!isEmailOperator && !isCalendarOperator) {
    return (
      <AppShell>
        <ProductPageHeader pageTitle="Actions" pageSubtitle="High-leverage AI tools ready in one tap" />
        <div className="space-y-3">
          <PremiumCard className="space-y-2 p-4">
            <SectionHeader title="Quick AI tools" subtitle="Summarize, rewrite, analyze, compare, and plan" />
            <ActionTile title="Summarize" description="Turn long content into concise decisions and next steps." icon={FileSearch} onClick={() => enqueuePromptAndGoToChat(toolPrompts.summarize)} />
            <ActionTile title="Rewrite" description="Rewrite for clarity, confidence, or a specific tone." icon={PenSquare} onClick={() => enqueuePromptAndGoToChat(toolPrompts.rewrite)} />
            <ActionTile title="Analyze" description="Extract patterns, risks, and opportunities from data." icon={BarChart3} onClick={() => enqueuePromptAndGoToChat(toolPrompts.analyze)} />
            <ActionTile title="Compare" description="Compare options with a recommendation and tradeoffs." icon={GitCompare} onClick={() => enqueuePromptAndGoToChat(toolPrompts.compare)} />
            <ActionTile title="Generate plan" description="Build an execution plan with milestones and owners." icon={ClipboardList} onClick={() => enqueuePromptAndGoToChat(toolPrompts.plan)} />
          </PremiumCard>

          <PremiumCard className="space-y-2 p-4">
            <SectionHeader title="Tool visuals" subtitle="Tap cards to launch live tool prompts" />
            <div className="grid grid-cols-2 gap-2">
              {[
                { tool: 'Summarize', action: () => enqueuePromptAndGoToChat(toolPrompts.summarize) },
                { tool: 'Rewrite', action: () => enqueuePromptAndGoToChat(toolPrompts.rewrite) },
                { tool: 'Analyze', action: () => enqueuePromptAndGoToChat(toolPrompts.analyze) },
                { tool: 'Compare', action: () => enqueuePromptAndGoToChat(toolPrompts.compare) },
                { tool: 'Generate Plan', action: () => enqueuePromptAndGoToChat(toolPrompts.plan) },
                { tool: 'Gmail Inbox Analysis', action: () => enqueuePromptAndGoToChat('Analyze my inbox and show key follow-ups.') },
              ].map((tool) => (
                <button key={tool.tool} onClick={tool.action} type="button" className="tap-feedback rounded-[16px] border border-[#e7eaf0] bg-[#fcfcfd] p-3 text-left">
                  <div className="mb-2 h-8 w-8 rounded-lg bg-gradient-to-br from-[#f2f4f8] to-[#e8ecf4]" />
                  <p className="text-xs font-semibold text-[#111111]">{tool.tool}</p>
                </button>
              ))}
            </div>
            <p className="inline-flex items-center gap-1 text-xs text-[#707784]"><Sparkles className="h-3.5 w-3.5" /> Every card launches a functional tool flow in chat.</p>
          </PremiumCard>
        </div>
      </AppShell>
    );
  }

  if (isCalendarOperator) {
    return (
      <AppShell>
        <ProductPageHeader pageTitle="Calendar Operator" pageSubtitle="Plan your day, protect focus, and stay ahead of overload" />
        <div className="space-y-3">
          <PremiumCard className="p-4">
            <SectionHeader title="Quick actions" subtitle="Read-only access. Kivo never creates or moves events automatically." />
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => void invokeCalendarAction('today_plan')} className="tap-feedback rounded-[14px] border border-[#e7eaf0] bg-[#fcfcfd] p-3 text-left text-xs font-semibold text-[#111111]"><CalendarClock className="mb-1 h-4 w-4" />Show Today Plan</button>
              <button type="button" onClick={() => void invokeCalendarAction('find_focus_time')} className="tap-feedback rounded-[14px] border border-[#e7eaf0] bg-[#fcfcfd] p-3 text-left text-xs font-semibold text-[#111111]"><Clock3 className="mb-1 h-4 w-4" />Find Focus Time</button>
              <button type="button" onClick={() => void invokeCalendarAction('check_busy_week')} className="tap-feedback rounded-[14px] border border-[#e7eaf0] bg-[#fcfcfd] p-3 text-left text-xs font-semibold text-[#111111]"><BarChart3 className="mb-1 h-4 w-4" />Check Busy Week</button>
              <button type="button" onClick={() => void invokeCalendarAction('weekly_reset')} className="tap-feedback rounded-[14px] border border-[#e7eaf0] bg-[#fcfcfd] p-3 text-left text-xs font-semibold text-[#111111]"><Sparkles className="mb-1 h-4 w-4" />Weekly Reset</button>
            </div>
            {busyCalendarAction ? <p className="mt-2 text-xs text-[#6d7481]">Running: {busyCalendarAction.replace('_', ' ')}</p> : null}
            {error ? <p className="mt-2 text-xs text-[#9f1a1a]">{error}</p> : null}
            {gmailConnected === false ? <p className="mt-2 text-xs text-[#9f1a1a]">Google Calendar is not connected. Connect it from Control to use Calendar Operator.</p> : null}
          </PremiumCard>

          {calendarData.todayPlan ? (
            <PremiumCard className="space-y-2 p-4">
              <SectionHeader title="Today Planner" subtitle={calendarData.todayPlan.recommendedAction} />
              <p className="text-xs text-[#4f5561]">Events today: {calendarData.todayPlan.todaysEvents.length}</p>
              {calendarData.todayPlan.bestFocusSlot ? <p className="text-xs text-[#4f5561]">Best focus slot: {new Date(calendarData.todayPlan.bestFocusSlot.startAt).toLocaleTimeString()} - {new Date(calendarData.todayPlan.bestFocusSlot.endAt).toLocaleTimeString()}</p> : null}
              {calendarData.todayPlan.nextImportantEvent ? <p className="text-xs text-[#4f5561]">Next important: {calendarData.todayPlan.nextImportantEvent.summary}</p> : null}
            </PremiumCard>
          ) : null}

          {calendarData.freeTime ? (
            <PremiumCard className="space-y-2 p-4">
              <SectionHeader title="Free Time Intelligence" subtitle="Next available focus windows" />
              <p className="text-xs text-[#4f5561]">Next 30 min: {calendarData.freeTime.nextFree30Min ? new Date(calendarData.freeTime.nextFree30Min.startAt).toLocaleString() : 'Not found'}</p>
              <p className="text-xs text-[#4f5561]">Next 60 min: {calendarData.freeTime.nextFree60Min ? new Date(calendarData.freeTime.nextFree60Min.startAt).toLocaleString() : 'Not found'}</p>
              <p className="text-xs text-[#4f5561]">Best deep work: {calendarData.freeTime.bestDeepWorkWindow ? `${new Date(calendarData.freeTime.bestDeepWorkWindow.startAt).toLocaleString()} (${calendarData.freeTime.bestDeepWorkWindow.durationMinutes} min)` : 'Not found'}</p>
            </PremiumCard>
          ) : null}

          {calendarData.overload ? (
            <PremiumCard className="space-y-2 p-4">
              <SectionHeader title="Overload Detection" subtitle={calendarData.overload.summary} />
              <p className="text-xs text-[#4f5561]">Too many meetings: {calendarData.overload.tooManyMeetings ? 'Yes' : 'No'}</p>
              <p className="text-xs text-[#4f5561]">No recovery gaps: {calendarData.overload.noRecoveryGaps ? 'Yes' : 'No'}</p>
              <p className="text-xs text-[#4f5561]">Busy tomorrow: {calendarData.overload.busyTomorrow ? 'Yes' : 'No'}</p>
              <p className="text-xs text-[#4f5561]">Deadline pressure: {calendarData.overload.deadlinePressure ? 'Yes' : 'No'}</p>
            </PremiumCard>
          ) : null}

          {calendarData.weeklyReset ? (
            <PremiumCard className="space-y-2 p-4">
              <SectionHeader title="Weekly Reset" subtitle="High-value blocks and scheduling opportunities" />
              {calendarData.weeklyReset.bestTimeBlocks.slice(0, 3).map((block) => (
                <p key={block.startAt} className="text-xs text-[#4f5561]">• {new Date(block.startAt).toLocaleString()} ({block.durationMinutes} min)</p>
              ))}
              {calendarData.weeklyReset.overloadedDays.slice(0, 3).map((day) => (
                <p key={day.day} className="text-xs text-[#4f5561]">Overloaded: {day.day} ({day.meetingCount} meetings)</p>
              ))}
            </PremiumCard>
          ) : null}
        </div>
      </AppShell>
    );
  }

  return (
    <Suspense fallback={null}>
      <ActionsPageClient />
    </Suspense>
  );
}
