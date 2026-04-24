'use client';

import {
  Activity,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Eye,
  Globe,
  Mail,
  Menu,
  Paperclip,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Zap,
  ListChecks,
} from 'lucide-react';

const agents = [
  {
    name: 'Research Agent',
    desc: 'Finds information, analyzes data, and delivers insights.',
    icon: Search,
    tasks: '3 tasks',
  },
  {
    name: 'Planner Agent',
    desc: 'Plans your day, sets priorities, and keeps you on track.',
    icon: ListChecks,
    tasks: '2 tasks',
  },
  {
    name: 'Money Agent',
    desc: 'Monitors spending, finds savings, and optimizes finances.',
    icon: CircleDollarSign,
    tasks: '4 tasks',
  },
  {
    name: 'Automation Agent',
    desc: 'Automates workflows and repetitive tasks across your apps.',
    icon: Zap,
    tasks: '5 tasks',
  },
  {
    name: 'Vision Agent',
    desc: 'Understands images, documents, and visual data.',
    icon: Eye,
    tasks: '1 task',
  },
];

const recommended = [
  {
    name: 'Email Assistant',
    desc: 'Summarizes emails and drafts smart replies.',
    icon: Mail,
  },
  {
    name: 'Document Analyst',
    desc: 'Analyzes and extracts key insights from files.',
    icon: Paperclip,
  },
  {
    name: 'Web Monitor',
    desc: 'Monitors websites and alerts you on changes.',
    icon: Globe,
  },
];

const activity = [
  {
    text: 'Research Agent completed “Market analysis Q1 2024”',
    time: '2h ago',
    icon: Search,
  },
  {
    text: 'Planner Agent updated your daily plan',
    time: '3h ago',
    icon: ListChecks,
  },
  {
    text: 'Money Agent found a new saving opportunity',
    time: '5h ago',
    icon: CircleDollarSign,
  },
];

export default function AgentsPage() {
  return (
    <main className="min-h-screen bg-[#FAFAFA] text-[#111318]">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[72px] flex-col items-center border-r border-black/[0.06] bg-white/75 px-3 py-5 backdrop-blur-xl md:flex">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7B5342] text-[18px] font-medium text-white">
          M
        </div>

        <div className="mt-16 flex flex-1 flex-col items-center gap-5">
          <Plus className="h-5 w-5" />
          <Search className="h-5 w-5" />
          <div className="rounded-2xl bg-black/[0.055] p-3">
            <Sparkles className="h-5 w-5" />
          </div>
          <Zap className="h-5 w-5" />
          <SlidersHorizontal className="h-5 w-5" />
        </div>

        <div className="text-center text-[11px] font-medium text-[#8A8F98]">
          <div className="text-[24px] font-bold leading-none">K</div>
          Kivo
        </div>
      </aside>

      <section className="mx-auto max-w-[760px] px-5 pb-16 pt-8 md:ml-[92px] md:px-10">
        <header className="mb-10 flex items-center justify-between">
          <button className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-black/[0.04]">
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-1.5 text-[15px] font-semibold">
            <Zap className="h-4 w-4" />
            Free
          </div>
        </header>

        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-[44px] leading-none tracking-[-0.06em] text-[#15171C]">
              Agents
            </h1>
            <p className="mt-3 text-[15px] text-[#666C76]">
              AI agents that work for you.
            </p>
          </div>

          <button className="mt-3 inline-flex items-center gap-2 rounded-[16px] bg-[#111318] px-5 py-3 text-[14px] font-medium text-white shadow-[0_12px_30px_rgba(17,19,24,0.16)] active:scale-[0.98]">
            <Plus className="h-4 w-4" />
            New agent
          </button>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4">
          <StatCard icon={<Activity />} label="Active agents" value="5" sub="Running tasks" />
          <StatCard icon={<CheckCircle2 />} label="Tasks completed" value="128" sub="This week" />
        </div>

        <SectionTitle>My agents</SectionTitle>

        <div className="mb-10 overflow-hidden rounded-[24px] border border-black/[0.055] bg-white shadow-[0_12px_36px_rgba(15,23,42,0.035)]">
          {agents.map((agent, index) => (
            <AgentRow key={agent.name} {...agent} isLast={index === agents.length - 1} />
          ))}
        </div>

        <div className="mb-5 flex items-center justify-between">
          <SectionTitle className="mb-0">Recommended for you</SectionTitle>
          <button className="inline-flex items-center gap-1 text-[14px] font-medium text-[#555B65]">
            See all
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-10 grid grid-cols-3 gap-4">
          {recommended.map((item) => (
            <RecommendedCard key={item.name} {...item} />
          ))}
        </div>

        <div className="mb-5 flex items-center justify-between">
          <SectionTitle className="mb-0">Recent activity</SectionTitle>
          <button className="inline-flex items-center gap-1 text-[14px] font-medium text-[#555B65]">
            See all
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-hidden rounded-[22px] border border-black/[0.055] bg-white shadow-[0_10px_30px_rgba(15,23,42,0.03)]">
          {activity.map((item, index) => (
            <ActivityRow key={item.text} {...item} isLast={index === activity.length - 1} />
          ))}
        </div>
      </section>
    </main>
  );
}

function SectionTitle({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2 className={`mb-5 text-[16px] font-semibold tracking-[-0.03em] ${className}`}>
      {children}
    </h2>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <button className="flex items-center gap-5 rounded-[22px] border border-black/[0.055] bg-white px-6 py-5 text-left shadow-[0_10px_28px_rgba(15,23,42,0.035)] transition active:scale-[0.99]">
      <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#F4F4F5] text-[#111318]">
        <div className="h-6 w-6">{icon}</div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-medium text-[#6B7280]">{label}</div>
        <div className="mt-1 font-serif text-[34px] leading-none tracking-[-0.06em]">
          {value}
        </div>
        <div className="mt-2 text-[13px] text-[#6B7280]">{sub}</div>
      </div>

      <ChevronRight className="h-5 w-5 text-[#777D86]" />
    </button>
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
      className={`flex items-center gap-5 px-5 py-5 ${
        isLast ? '' : 'border-b border-black/[0.045]'
      }`}
    >
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-[#F4F4F5] text-[#111318]">
        <Icon className="h-6 w-6" strokeWidth={2} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-[16px] font-semibold tracking-[-0.03em]">{name}</div>
        <p className="mt-1 max-w-[360px] text-[14px] leading-[1.45] text-[#5F6672]">
          {desc}
        </p>
        <div className="mt-3 flex items-center gap-2 text-[13px] text-[#333840]">
          <span className="h-2 w-2 rounded-full bg-[#111318]" />
          Active
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="rounded-[12px] bg-[#F4F4F5] px-3 py-2 text-[13px] font-medium">
          {tasks}
        </span>

        <button className="relative h-6 w-10 rounded-full bg-[#111318]">
          <span className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white" />
        </button>

        <button className="text-[#6B7280]">•••</button>
        <ChevronRight className="h-5 w-5 text-[#777D86]" />
      </div>
    </div>
  );
}

function RecommendedCard({
  name,
  desc,
  icon: Icon,
}: {
  name: string;
  desc: string;
  icon: typeof Mail;
}) {
  return (
    <div className="rounded-[20px] border border-black/[0.055] bg-white p-4 shadow-[0_8px_26px_rgba(15,23,42,0.025)]">
      <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#F4F4F5]">
        <Icon className="h-5 w-5" />
      </div>

      <div className="text-[15px] font-semibold tracking-[-0.03em]">{name}</div>
      <p className="mt-2 min-h-[42px] text-[13px] leading-[1.35] text-[#606773]">
        {desc}
      </p>

      <button className="mt-4 w-full rounded-[12px] bg-[#F4F4F5] py-2.5 text-[13px] font-medium">
        Add
      </button>
    </div>
  );
}

function ActivityRow({
  text,
  time,
  icon: Icon,
  isLast,
}: {
  text: string;
  time: string;
  icon: typeof Search;
  isLast: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-4 px-5 py-4 ${
        isLast ? '' : 'border-b border-black/[0.045]'
      }`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#F4F4F5]">
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-medium text-[#343941]">{text}</div>
        <div className="mt-1 text-[13px] text-[#8A8F98]">{time}</div>
      </div>

      <CheckCircle2 className="h-5 w-5 text-[#525861]" />
    </div>
  );
}
