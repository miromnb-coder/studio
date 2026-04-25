'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  Brain,
  ChevronRight,
  CircleDollarSign,
  Eye,
  ListChecks,
  Mail,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';

import KivoChatHeader from '@/components/chat/kivo/KivoChatHeader';
import {
  KivoChatSidebarArea,
  KIVO_CHAT_SIDEBAR_RAIL_WIDTH,
} from '@/components/chat/kivo/KivoChatSidebarArea';

const SIDEBAR_GAP = 12;

export default function AgentsPage() {
  const router = useRouter();
  const [showSidebarRail, setShowSidebarRail] = useState(false);

  const contentLeftOffset = showSidebarRail
    ? KIVO_CHAT_SIDEBAR_RAIL_WIDTH + SIDEBAR_GAP
    : 0;

  /**
   * USER DATA (replace later with real profile/integrations data)
   * Only page content changed. Header + sidebar untouched.
   */
  const user = {
    name: 'Miro',
    plan: 'Free',
    gmailConnected: false,
    calendarConnected: false,
    memoryEnabled: false,
    recentRuns: 2,
  };

  const readiness = useMemo(() => {
    let score = 20;
    if (user.plan !== 'Free') score += 20;
    if (user.gmailConnected) score += 20;
    if (user.calendarConnected) score += 20;
    if (user.memoryEnabled) score += 20;
    return score;
  }, [user]);

  const nextAction = !user.calendarConnected
    ? 'Connect Calendar'
    : !user.gmailConnected
      ? 'Connect Gmail'
      : !user.memoryEnabled
        ? 'Enable Memory'
        : user.plan === 'Free'
          ? 'Upgrade for Automation'
          : 'Run Smart Operator';

  const agents = [
    {
      name: 'Smart Operator',
      desc: 'Coordinates all systems and chooses the best next action.',
      icon: Brain,
      status: 'Ready',
      chips: ['Core', 'Routing'],
    },
    {
      name: 'Research Agent',
      desc: 'Searches, compares, summarizes, and explains information.',
      icon: Search,
      status: 'Ready',
      chips: ['Search', 'Analysis'],
    },
    {
      name: 'Planner Agent',
      desc: 'Builds daily plans and smarter schedules.',
      icon: ListChecks,
      status: user.calendarConnected ? 'Ready' : 'Needs Calendar',
      chips: ['Planning', 'Focus'],
    },
    {
      name: 'Money Agent',
      desc: 'Finds savings, subscriptions, and money leaks.',
      icon: CircleDollarSign,
      status: user.gmailConnected ? 'Ready' : 'Needs Data',
      chips: ['Finance', 'Savings'],
    },
    {
      name: 'Email Agent',
      desc: 'Summarizes inbox and drafts replies.',
      icon: Mail,
      status: user.gmailConnected ? 'Ready' : 'Needs Gmail',
      chips: ['Inbox', 'Reply'],
    },
    {
      name: 'Vision Agent',
      desc: 'Understands images, files, and screenshots.',
      icon: Eye,
      status: 'Ready',
      chips: ['Vision', 'Files'],
    },
    {
      name: 'Memory Agent',
      desc: 'Remembers goals, preferences, and recurring tasks.',
      icon: ShieldCheck,
      status: user.memoryEnabled ? 'Full' : 'Limited',
      chips: ['Memory', 'Context'],
    },
  ];

  const setup = [
    {
      title: 'Connect Email',
      value: user.gmailConnected ? 'Connected' : 'Not connected',
    },
    {
      title: 'Connect Calendar',
      value: user.calendarConnected ? 'Connected' : 'Not connected',
    },
    {
      title: 'Enable Memory',
      value: user.memoryEnabled ? 'Enabled' : 'Limited',
    },
    {
      title: 'Automation',
      value: user.plan === 'Free' ? 'Premium' : 'Unlocked',
    },
  ];

  const ideas = [
    'Plan my day',
    'Find money leaks',
    'Summarize important emails',
    'Watch for changes',
  ];

  return (
    <main className="relative min-h-[100dvh] overflow-x-hidden bg-[#F8F8F7] text-[#111318]">
      {showSidebarRail ? (
        <KivoChatSidebarArea
          hasMessages={false}
          userName="Miro"
          plan="free"
          recentChats={[]}
          onNewChat={() => router.push('/chat')}
          onSearch={() => router.push('/search')}
          onOpenAgents={() => router.push('/agents')}
          onOpenTools={() => router.push('/tools')}
          onOpenAlerts={() => router.push('/alerts')}
          onOpenSettings={() => router.push('/settings')}
          onQuickTask={() => router.push('/chat')}
          onAnalyzeFile={() => router.push('/analyze')}
          onPlanMyDay={() => router.push('/actions?type=planner')}
          onOpenGmail={() => router.push('/actions?tool=gmail')}
          onOpenCalendar={() => router.push('/actions?tool=google-calendar')}
          onOpenDrive={() => router.push('/tools?source=drive')}
          onOpenWeb={() => router.push('/tools?tool=browser-search')}
          onUpgrade={() => router.push('/upgrade')}
        />
      ) : null}

      <div
        className="min-h-[100dvh] transition-[padding-left] duration-300 ease-out"
        style={{ paddingLeft: contentLeftOffset }}
      >
        <div className="sticky top-0 z-40 border-b border-black/[0.035] bg-white/82 backdrop-blur-2xl">
          <KivoChatHeader
            hasMessages={false}
            isSidebarOpen={showSidebarRail}
            onSidebarToggle={() => setShowSidebarRail((open) => !open)}
          />
        </div>

        <section className="px-4 pb-24 pt-7 sm:px-5">
          <div className="mx-auto max-w-[720px]">
            {/* HERO */}
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h1 className="font-serif text-[42px] leading-none tracking-[-0.06em]">
                  Agents
                </h1>
                <p className="mt-2 text-[15px] text-black/52">
                  Control what Kivo can do for you.
                </p>

                <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-black/[0.06] bg-white px-3 py-1.5 text-[13px] font-medium">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {readiness}% ready
                </div>
              </div>

              <button className="inline-flex items-center gap-2 rounded-[18px] bg-[#111318] px-4 py-3 text-[14px] font-medium text-white shadow-[0_12px_28px_rgba(17,19,24,0.14)]">
                <Plus className="h-4 w-4" />
                New
              </button>
            </div>

            {/* INTELLIGENCE CARD */}
            <div className="mb-6 rounded-[28px] border border-black/[0.055] bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.035)]">
              <div className="flex items-center gap-2 text-[13px] font-medium text-black/55">
                <Sparkles className="h-4 w-4" />
                Operator Intelligence
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <MiniStat label="Mode" value="Manual approval" />
                <MiniStat label="Plan" value={user.plan} />
                <MiniStat label="Recent runs" value={`${user.recentRuns}`} />
                <MiniStat label="Next action" value={nextAction} />
              </div>
            </div>

            {/* SETUP */}
            <SectionTitle>Setup progress</SectionTitle>

            <div className="mb-6 grid grid-cols-2 gap-3">
              {setup.map((item) => (
                <InfoCard
                  key={item.title}
                  title={item.title}
                  value={item.value}
                />
              ))}
            </div>

            {/* AGENTS */}
            <SectionTitle>Core agents</SectionTitle>

            <div className="mb-6 space-y-3">
              {agents.map((agent) => (
                <AgentCard key={agent.name} {...agent} />
              ))}
            </div>

            {/* IDEAS */}
            <SectionTitle>Automation ideas</SectionTitle>

            <div className="grid grid-cols-2 gap-3">
              {ideas.map((idea) => (
                <button
                  key={idea}
                  className="rounded-[20px] border border-black/[0.055] bg-white px-4 py-4 text-left text-[14px] font-medium shadow-[0_8px_20px_rgba(15,23,42,0.025)]"
                >
                  {idea}
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-3 text-[22px] font-semibold tracking-[-0.04em]">
      {children}
    </h2>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[20px] bg-black/[0.03] px-4 py-3">
      <div className="text-[12px] text-black/45">{label}</div>
      <div className="mt-1 text-[14px] font-semibold tracking-[-0.02em]">
        {value}
      </div>
    </div>
  );
}

function InfoCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-[22px] border border-black/[0.055] bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.025)]">
      <div className="text-[13px] text-black/45">{title}</div>
      <div className="mt-2 text-[15px] font-semibold">{value}</div>
    </div>
  );
}

function AgentCard({
  name,
  desc,
  icon: Icon,
  status,
  chips,
}: {
  name: string;
  desc: string;
  icon: any;
  status: string;
  chips: string[];
}) {
  return (
    <div className="rounded-[24px] border border-black/[0.055] bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.028)]">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-black/[0.035]">
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[16px] font-semibold tracking-[-0.03em]">
              {name}
            </div>

            <span className="rounded-full bg-black/[0.04] px-3 py-1 text-[12px] font-medium">
              {status}
            </span>
          </div>

          <p className="mt-1 text-[14px] leading-[1.35] text-black/52">
            {desc}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {chips.map((chip) => (
              <span
                key={chip}
                className="rounded-full bg-black/[0.035] px-2.5 py-1 text-[12px] font-medium"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>

        <ChevronRight className="mt-1 h-5 w-5 text-black/25" />
      </div>
    </div>
  );
}
