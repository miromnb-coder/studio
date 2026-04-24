'use client';

import { Search, MoreHorizontal, ChevronRight, Plus, Zap, CheckCircle2 } from 'lucide-react';

const agents = [
  {
    name: 'Research Agent',
    desc: 'Finds information, analyzes data, and delivers insights.',
    tasks: '3 tasks',
  },
  {
    name: 'Planner Agent',
    desc: 'Plans your day, sets priorities, and keeps you on track.',
    tasks: '2 tasks',
  },
  {
    name: 'Money Agent',
    desc: 'Monitors spending, finds savings, and optimizes finances.',
    tasks: '4 tasks',
  },
  {
    name: 'Automation Agent',
    desc: 'Automates workflows and repetitive tasks.',
    tasks: '5 tasks',
  },
  {
    name: 'Vision Agent',
    desc: 'Understands images, documents, and visual data.',
    tasks: '1 task',
  },
];

function Sidebar() {
  const Item = ({ active = false, children }: any) => (
    <button
      className={`flex h-12 w-12 items-center justify-center rounded-2xl transition ${
        active ? 'bg-black/5' : 'hover:bg-black/5'
      }`}
    >
      {children}
    </button>
  );

  return (
    <aside className="fixed left-0 top-0 z-20 flex h-screen w-[82px] flex-col items-center border-r border-black/5 bg-[#f7f7f5] pt-6">
      <div className="mb-10 flex h-12 w-12 items-center justify-center rounded-full bg-[#7a5441] text-xl text-white">
        M
      </div>

      <div className="flex flex-col gap-3">
        <Item>+</Item>
        <Item>
          <Search className="h-5 w-5" />
        </Item>
        <Item active>💬</Item>
        <Item>✦</Item>
        <Item>📅</Item>
        <Item>🔔</Item>
        <Item>⚙️</Item>
      </div>

      <div className="mt-auto pb-6 text-center text-sm text-black/50">
        <div className="text-3xl font-semibold">K</div>
        <div>Kivo</div>
      </div>
    </aside>
  );
}

function StatCard({
  title,
  value,
  sub,
  icon,
}: {
  title: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-[26px] border border-black/5 bg-white px-5 py-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black/[0.03]">
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-[13px] text-black/45">{title}</div>
          <div className="text-3xl font-semibold tracking-tight">{value}</div>
          <div className="text-[13px] text-black/45">{sub}</div>
        </div>

        <ChevronRight className="h-5 w-5 text-black/25" />
      </div>
    </div>
  );
}

function AgentRow({
  name,
  desc,
  tasks,
}: {
  name: string;
  desc: string;
  tasks: string;
}) {
  return (
    <div className="grid grid-cols-[54px_1fr_auto] items-center gap-4 border-t border-black/5 px-5 py-5 first:border-t-0">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black/[0.03]">
        <Search className="h-6 w-6" />
      </div>

      <div className="min-w-0">
        <div className="text-[18px] font-semibold tracking-tight">{name}</div>
        <div className="mt-1 text-[14px] leading-5 text-black/50">{desc}</div>
        <div className="mt-2 flex items-center gap-2 text-[13px] text-black/55">
          <span className="h-2 w-2 rounded-full bg-black" />
          Active
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="rounded-full bg-black/[0.04] px-3 py-1 text-[13px] font-medium">
          {tasks}
        </span>

        <button className="relative h-7 w-12 rounded-full bg-black">
          <span className="absolute right-1 top-1 h-5 w-5 rounded-full bg-white" />
        </button>

        <button className="p-1 text-black/45">
          <MoreHorizontal className="h-5 w-5" />
        </button>

        <ChevronRight className="h-5 w-5 text-black/25" />
      </div>
    </div>
  );
}

export default function AgentsPage() {
  return (
    <main className="min-h-screen bg-[#f6f6f4] text-[#111]">
      <Sidebar />

      <div className="pl-[96px] pr-4">
        <div className="mx-auto w-full max-w-[760px] py-6 scale-[0.85] origin-top">
          {/* top bar */}
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <button className="mb-5 rounded-xl p-2 hover:bg-black/5">☰</button>
              <h1 className="text-[44px] font-semibold tracking-tight">Agents</h1>
              <p className="mt-1 text-[18px] text-black/50">
                AI agents that work for you.
              </p>
            </div>

            <div className="flex flex-col items-end gap-5">
              <div className="flex items-center gap-2 text-sm font-medium text-black/70">
                <Zap className="h-4 w-4" />
                Free
              </div>

              <button className="inline-flex items-center gap-2 rounded-2xl bg-[#0d0d14] px-5 py-3 text-white shadow-lg">
                <Plus className="h-4 w-4" />
                New agent
              </button>
            </div>
          </div>

          {/* stats */}
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              title="Active agents"
              value="5"
              sub="Running tasks"
              icon={<Zap className="h-6 w-6" />}
            />
            <StatCard
              title="Tasks completed"
              value="128"
              sub="This week"
              icon={<CheckCircle2 className="h-6 w-6" />}
            />
          </div>

          {/* agents */}
          <section className="mt-7">
            <h2 className="mb-4 text-[28px] font-semibold tracking-tight">My agents</h2>

            <div className="overflow-hidden rounded-[30px] border border-black/5 bg-white shadow-sm">
              {agents.map((agent) => (
                <AgentRow key={agent.name} {...agent} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
