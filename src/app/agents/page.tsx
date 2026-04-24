'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  Bot,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  KivoChatSidebarArea,
  KIVO_CHAT_SIDEBAR_RAIL_WIDTH,
} from '@/components/chat/kivo/KivoChatSidebarArea';

const SIDEBAR_GAP = 12;

const agents = [
  {
    name: 'Research Agent',
    desc: 'Finds information, analyzes data, and delivers insights.',
    tasks: '3 tasks',
    icon: Search,
  },
  {
    name: 'Planner Agent',
    desc: 'Plans your day, sets priorities, and keeps you on track.',
    tasks: '2 tasks',
    icon: CheckCircle2,
  },
  {
    name: 'Money Agent',
    desc: 'Monitors spending, finds savings, and optimizes finances.',
    tasks: '4 tasks',
    icon: Zap,
  },
  {
    name: 'Automation Agent',
    desc: 'Automates workflows and repetitive tasks.',
    tasks: '5 tasks',
    icon: Sparkles,
  },
  {
    name: 'Vision Agent',
    desc: 'Understands images, documents, and visual data.',
    tasks: '1 task',
    icon: Bot,
  },
];

const recommends = [
  {
    title: 'Email Assistant',
    desc: 'Summarizes emails and drafts smart replies.',
  },
  {
    title: 'Document Analyst',
    desc: 'Analyzes and extracts key insights from files.',
  },
  {
    title: 'Web Monitor',
    desc: 'Monitors websites and alerts you on changes.',
  },
];

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-[28px] border border-black/[0.04] bg-white px-5 py-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="text-[15px] text-[#7A7A7A]">{title}</div>
      <div className="mt-1 text-[52px] font-semibold leading-none tracking-[-0.05em] text-[#111]">
        {value}
      </div>
      <div className="mt-1 text-[15px] text-[#7A7A7A]">{subtitle}</div>
    </div>
  );
}

function AgentRow({
  name,
  desc,
  tasks,
  icon: Icon,
}: {
  name: string;
  desc: string;
  tasks: string;
  icon: any;
}) {
  return (
    <div className="grid grid-cols-[58px_minmax(0,1fr)_auto] items-center gap-4 px-5 py-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F5F5]">
        <Icon className="h-6 w-6 text-[#111]" strokeWidth={2} />
      </div>

      <div className="min-w-0">
        <div className="text-[17px] font-semibold text-[#111]">{name}</div>
        <div className="mt-1 text-[14px] leading-5 text-[#6F6F6F]">{desc}</div>
        <div className="mt-2 flex items-center gap-2 text-[14px] text-[#555]">
          <span className="h-2 w-2 rounded-full bg-black" />
          Active
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="rounded-full bg-[#F5F5F5] px-4 py-2 text-[14px] font-medium text-[#222]">
          {tasks}
        </span>

        <button className="flex h-8 w-14 items-center rounded-full bg-black px-1">
          <span className="ml-auto h-6 w-6 rounded-full bg-white" />
        </button>

        <button className="text-[#888]">
          <MoreHorizontal className="h-5 w-5" />
        </button>

        <ChevronRight className="h-5 w-5 text-[#B5B5B5]" />
      </div>
    </div>
  );
}

export default function AgentsPage() {
  // Sidebar oletuksena pois
  const [showSidebarRail, setShowSidebarRail] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const contentLeftOffset = showSidebarRail
    ? KIVO_CHAT_SIDEBAR_RAIL_WIDTH + SIDEBAR_GAP
    : 0;

  const pageStyle = useMemo(
    () => ({
      paddingLeft: `${contentLeftOffset}px`,
    }),
    [contentLeftOffset],
  );

  return (
    <main className="min-h-screen bg-[#FAFAFA] text-[#111]">
      {showSidebarRail ? (
        <KivoChatSidebarArea
          panelOpen={isSidebarOpen}
          onPanelOpenChange={setIsSidebarOpen}
          userName="Miro"
          hasMessages={false}
          plan="free"
          recentChats={[]}
          onNewChat={() => {}}
          onSearch={() => {}}
          onOpenChat={() => {}}
          onOpenSettings={() => {}}
          onQuickTask={() => {}}
          onAnalyzeFile={() => {}}
          onPlanMyDay={() => {}}
          onOpenGmail={() => {}}
          onOpenCalendar={() => {}}
          onOpenDrive={() => {}}
          onOpenWeb={() => {}}
          onUpgrade={() => {}}
        />
      ) : null}

      <div
        className="transition-[padding-left] duration-300 ease-out"
        style={pageStyle}
      >
        {/* STICKY HEADER */}
        <header className="sticky top-0 z-40 border-b border-black/[0.04] bg-white/85 backdrop-blur-xl">
          <div className="mx-auto flex h-[74px] max-w-[980px] items-center justify-between px-4">
            <button
              type="button"
              onClick={() => {
                if (showSidebarRail) {
                  setShowSidebarRail(false);
                  setIsSidebarOpen(false);
                } else {
                  setShowSidebarRail(true);
                }
              }}
              className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-black/[0.04]"
            >
              <Menu className="h-5 w-5" />
            </button>

            <button className="flex items-center gap-2 text-[18px] font-semibold">
              Kivo Lite
              <ChevronRight className="h-4 w-4 rotate-90" />
            </button>

            <button className="flex items-center gap-2 text-[16px] font-semibold">
              <Zap className="h-4 w-4" />
              Free
            </button>
          </div>
        </header>

        <section className="mx-auto max-w-[980px] px-4 pb-16 pt-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-[64px] font-semibold leading-none tracking-[-0.06em]">
                Agents
              </h1>
              <p className="mt-2 text-[18px] text-[#7A7A7A]">
                AI agents that work for you.
              </p>
            </div>

            <button className="mt-2 inline-flex h-14 items-center gap-3 rounded-[20px] bg-[#05060F] px-6 text-white shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
              <Plus className="h-5 w-5" />
              <span className="text-[18px] font-medium">New agent</span>
            </button>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-5">
            <StatCard title="Active agents" value="5" subtitle="Running tasks" />
            <StatCard
              title="Tasks completed"
              value="128"
              subtitle="This week"
            />
          </div>

          <div className="mt-10">
            <h2 className="text-[22px] font-semibold">My agents</h2>

            <div className="mt-4 overflow-hidden rounded-[30px] border border-black/[0.04] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
              {agents.map((agent, index) => (
                <div
                  key={agent.name}
                  className={index !== 0 ? 'border-t border-black/[0.05]' : ''}
                >
                  <AgentRow {...agent} />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10">
            <h2 className="text-[22px] font-semibold">Recommended for you</h2>

            <div className="mt-4 grid grid-cols-3 gap-4">
              {recommends.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[28px] border border-black/[0.04] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F5F5F5]">
                    <Sparkles className="h-5 w-5" />
                  </div>

                  <div className="mt-4 text-[18px] font-semibold">
                    {item.title}
                  </div>
                  <div className="mt-2 text-[15px] leading-6 text-[#6F6F6F]">
                    {item.desc}
                  </div>

                  <button className="mt-5 h-12 w-full rounded-2xl bg-[#F5F5F5] text-[16px] font-medium">
                    Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
