'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Eye,
  Globe,
  Mail,
  MoreHorizontal,
  Paperclip,
  Plus,
  Search,
  Zap,
  ListChecks,
} from 'lucide-react';

import KivoChatHeader from '@/components/chat/kivo/KivoChatHeader';
import {
  KivoChatSidebarArea,
  KIVO_CHAT_SIDEBAR_RAIL_WIDTH,
} from '@/components/chat/kivo/KivoChatSidebarArea';

const SIDEBAR_GAP = 12;

const agents = [
  { name: 'Research Agent', desc: 'Finds information, analyzes data, and delivers insights.', icon: Search, tasks: '3 tasks' },
  { name: 'Planner Agent', desc: 'Plans your day, sets priorities, and keeps you on track.', icon: ListChecks, tasks: '2 tasks' },
  { name: 'Money Agent', desc: 'Monitors spending, finds savings, and optimizes finances.', icon: CircleDollarSign, tasks: '4 tasks' },
  { name: 'Automation Agent', desc: 'Automates workflows and repetitive tasks.', icon: Zap, tasks: '5 tasks' },
  { name: 'Vision Agent', desc: 'Understands images, documents, and visual data.', icon: Eye, tasks: '1 task' },
];

const recommended = [
  { name: 'Email Assistant', desc: 'Summarizes emails and drafts smart replies.', icon: Mail },
  { name: 'Document Analyst', desc: 'Analyzes and extracts key insights from files.', icon: Paperclip },
  { name: 'Web Monitor', desc: 'Monitors websites and alerts you on changes.', icon: Globe },
];

export default function AgentsPage() {
  const router = useRouter();
  const [showSidebarRail, setShowSidebarRail] = useState(true);

  const contentLeftOffset = showSidebarRail
    ? KIVO_CHAT_SIDEBAR_RAIL_WIDTH + SIDEBAR_GAP
    : 0;

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
        <KivoChatHeader
          hasMessages={false}
          isSidebarOpen={showSidebarRail}
          onSidebarToggle={() => setShowSidebarRail((open) => !open)}
        />

        <section className="mx-auto w-full max-w-[980px] px-4 pb-14 pt-7 sm:px-5">
          <div className="mb-6 flex items-start justify-between gap-5">
            <div>
              <h1 className="font-serif text-[34px] leading-none tracking-[-0.06em] sm:text-[38px]">
                Agents
              </h1>
              <p className="mt-2 text-[13px] text-black/50 sm:text-[14px]">
                AI agents that work for you.
              </p>
            </div>

            <button className="inline-flex items-center gap-2 rounded-[15px] bg-[#111318] px-4 py-2.5 text-[13px] font-medium text-white shadow-[0_12px_28px_rgba(17,19,24,0.15)]">
              <Plus className="h-4 w-4" />
              New agent
            </button>
          </div>

          <div className="mb-7 grid grid-cols-2 gap-4">
            <StatCard icon={<Activity className="h-5 w-5" />} label="Active agents" value="5" sub="Running tasks" />
            <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="Tasks completed" value="128" sub="This week" />
          </div>

          <SectionTitle>My agents</SectionTitle>

          <div className="mb-8 overflow-hidden rounded-[24px] border border-black/[0.055] bg-white shadow-[0_12px_34px_rgba(15,23,42,0.032)]">
            {agents.map((agent, index) => (
              <AgentRow key={agent.name} {...agent} isLast={index === agents.length - 1} />
            ))}
          </div>

          <SectionTitle>Recommended for you</SectionTitle>

          <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0">
            {recommended.map((item) => (
              <RecommendedCard key={item.name} {...item} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-4 text-[17px] font-semibold tracking-[-0.04em]">{children}</h2>;
}

function StatCard({ icon, label, value, sub }: { icon: ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[22px] border border-black/[0.055] bg-white px-4 py-3.5 shadow-[0_10px_26px_rgba(15,23,42,0.028)]">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-black/[0.035]">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[12px] leading-tight text-black/45">{label}</div>
        <div className="font-serif text-[28px] leading-none tracking-[-0.06em]">{value}</div>
        <div className="mt-1 text-[12px] leading-tight text-black/45">{sub}</div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-black/25" />
    </div>
  );
}

function AgentRow({
  name,
  desc,
  icon: Icon,
  tasks,
  isLast,
}: {
  name: string;
  desc: string;
  icon: typeof Search;
  tasks: string;
  isLast: boolean;
}) {
  return (
    <div
      className={`grid grid-cols-[52px_minmax(260px,1fr)_auto] items-center gap-3 px-4 py-3.5 ${
        isLast ? '' : 'border-b border-black/[0.045]'
      }`}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-black/[0.035]">
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0">
        <div className="text-[15px] font-semibold tracking-[-0.035em]">{name}</div>
        <p className="mt-0.5 max-w-[520px] text-[12.5px] leading-[1.35] text-black/50">
          {desc}
        </p>
        <div className="mt-1.5 flex items-center gap-2 text-[12px] text-black/55">
          <span className="h-1.5 w-1.5 rounded-full bg-black" />
          Active
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2.5">
        <span className="rounded-full bg-black/[0.04] px-2.5 py-1 text-[12px] font-medium">
          {tasks}
        </span>
        <button className="relative h-5 w-9 rounded-full bg-black">
          <span className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-white" />
        </button>
        <MoreHorizontal className="h-4 w-4 text-black/45" />
        <ChevronRight className="h-4 w-4 text-black/25" />
      </div>
    </div>
  );
}

function RecommendedCard({ name, desc, icon: Icon }: { name: string; desc: string; icon: typeof Mail }) {
  return (
    <div className="min-w-[190px] flex-1 rounded-[20px] border border-black/[0.055] bg-white p-3.5 shadow-[0_8px_22px_rgba(15,23,42,0.025)] sm:min-w-0">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-[13px] bg-black/[0.035]">
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-[13.5px] font-semibold tracking-[-0.03em]">{name}</div>
      <p className="mt-1.5 min-h-[34px] text-[12px] leading-[1.35] text-black/50">{desc}</p>
      <button className="mt-3 w-full rounded-[11px] bg-black/[0.04] py-2 text-[12px] font-medium">
        Add
      </button>
    </div>
  );
}
