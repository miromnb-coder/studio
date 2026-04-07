"use client";

import {
  Bell,
  Bot,
  Brain,
  History,
  Home,
  LineChart,
  MessageSquare,
  Search,
  Sparkles,
  Wand2,
  ArrowUp,
  Clock3,
  ChevronRight,
  Activity,
  Database,
} from "lucide-react";
import { useMemo, useState } from "react";

type ActivityItem = {
  id: string;
  title: string;
  time: string;
  statusColor: string;
  icon: React.ReactNode;
};

type AgentItem = {
  id: string;
  name: string;
  subtitle: string;
  accent: string;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const activities: ActivityItem[] = [
  {
    id: "1",
    title: "Analyzed market trends",
    time: "2 minutes ago",
    statusColor: "bg-emerald-400",
    icon: <LineChart className="h-5 w-5" />,
  },
  {
    id: "2",
    title: "Updated project memory",
    time: "15 minutes ago",
    statusColor: "bg-emerald-400",
    icon: <Database className="h-5 w-5" />,
  },
  {
    id: "3",
    title: "Generated weekly report",
    time: "1 hour ago",
    statusColor: "bg-indigo-500",
    icon: <Sparkles className="h-5 w-5" />,
  },
];

const agents: AgentItem[] = [
  {
    id: "1",
    name: "Research Agent",
    subtitle: "Gathering latest information",
    accent: "bg-indigo-100 text-indigo-600",
  },
  {
    id: "2",
    name: "Analysis Agent",
    subtitle: "Processing your data",
    accent: "bg-sky-100 text-sky-600",
  },
  {
    id: "3",
    name: "Memory Agent",
    subtitle: "Updating knowledge base",
    accent: "bg-amber-100 text-amber-600",
  },
];

function TopBar() {
  return (
    <div className="flex items-center justify-between px-5 pt-4">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-sky-400 text-white shadow-[0_8px_20px_rgba(99,102,241,0.18)]">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[28px] font-semibold tracking-[-0.03em] text-slate-900">
            MiroAI
          </span>
          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-600">
            PRO
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm ring-1 ring-black/5 transition-transform duration-200 active:scale-95">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
        </button>

        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-sm font-semibold text-white shadow-sm">
          M
        </div>
      </div>
    </div>
  );
}

function GreetingSection() {
  return (
    <section className="px-5 pt-5">
      <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.04em] text-slate-900">
        Good morning, Miro 👋
      </h1>
      <p className="mt-2 text-[15px] leading-6 text-slate-500">
        Your AI agents are ready to help you today.
      </p>
    </section>
  );
}

function ActionPill({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-[15px] font-medium text-slate-700 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]">
      <span className="text-slate-500">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function AiInputCard() {
  const [focused, setFocused] = useState(false);

  return (
    <section className="px-5 pt-5">
      <div
        className={cn(
          "rounded-[28px] border bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)] transition-all duration-300",
          focused
            ? "border-indigo-200 shadow-[0_12px_36px_rgba(99,102,241,0.12)]"
            : "border-slate-200/80"
        )}
      >
        <div className="rounded-[22px] border border-slate-100 bg-slate-50/60 p-4">
          <textarea
            rows={3}
            placeholder="What would you like to accomplish today?"
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="w-full resize-none border-0 bg-transparent text-[16px] leading-7 text-slate-800 placeholder:text-slate-400 focus:outline-none"
          />

          <div className="mt-4 flex flex-wrap gap-2">
            <ActionPill icon={<Search className="h-4 w-4" />} label="Research" />
            <ActionPill icon={<LineChart className="h-4 w-4" />} label="Analyze" />
            <ActionPill icon={<Wand2 className="h-4 w-4" />} label="Create" />
            <ActionPill icon={<Bot className="h-4 w-4" />} label="Automate" />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[14px] text-slate-400">
              <span className="font-semibold text-slate-500">Try:</span>{" "}
              Analyze my weekly productivity
            </p>
          </div>

          <button className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white shadow-[0_8px_20px_rgba(15,23,42,0.18)] transition-all duration-200 hover:bg-slate-800 active:scale-95">
            <ArrowUp className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}

function SectionCard({
  title,
  right,
  children,
  className,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.045)]",
        className
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[22px] font-semibold tracking-[-0.03em] text-slate-900">
          {title}
        </h2>
        {right}
      </div>
      {children}
    </section>
  );
}

function RecentActivityCard() {
  return (
    <div className="px-5 pt-5">
      <SectionCard
        title="Recent Activity"
        right={
          <button className="inline-flex items-center gap-1 text-[15px] font-medium text-slate-400 transition-colors hover:text-slate-600">
            View all <ChevronRight className="h-4 w-4" />
          </button>
        }
      >
        <div className="space-y-4">
          {activities.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 rounded-2xl px-1 py-1 transition-colors hover:bg-slate-50"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                {item.icon}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[16px] font-medium text-slate-800">
                  {item.title}
                </p>
                <div className="mt-1 flex items-center gap-2 text-[14px] text-slate-400">
                  <Clock3 className="h-3.5 w-3.5" />
                  <span>{item.time}</span>
                </div>
              </div>

              <span className={cn("h-3 w-3 rounded-full", item.statusColor)} />
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function ActiveAgentsCard() {
  return (
    <SectionCard
      title="Active Agents"
      right={<button className="text-slate-300">•••</button>}
    >
      <div className="space-y-4">
        {agents.map((agent) => (
          <div key={agent.id} className="flex items-start gap-4">
            <div
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-2xl",
                agent.accent
              )}
            >
              <Bot className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <p className="text-[16px] font-medium text-slate-800">
                {agent.name}
              </p>
              <p className="mt-1 text-[14px] leading-5 text-slate-400">
                {agent.subtitle}
              </p>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function StatMiniCard({
  icon,
  title,
  value,
  subtitle,
  iconClassName,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  iconClassName: string;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_28px_rgba(15,23,42,0.06)]">
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-2xl",
            iconClassName
          )}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-[14px] font-medium text-slate-500">{title}</p>
          <p className="mt-1 text-[16px] font-semibold text-slate-900">{value}</p>
          <p className="mt-1 text-[14px] text-slate-400">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function BottomNavItem({
  icon,
  label,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <button className="flex flex-1 flex-col items-center justify-center gap-1 py-2">
      <div
        className={cn(
          "transition-colors",
          active ? "text-indigo-600" : "text-slate-400"
        )}
      >
        {icon}
      </div>
      <span
        className={cn(
          "text-[12px] font-medium",
          active ? "text-indigo-600" : "text-slate-400"
        )}
      >
        {label}
      </span>
    </button>
  );
}

function BottomNav() {
  return (
    <div className="sticky bottom-0 left-0 right-0 mt-6 border-t border-slate-200/80 bg-white/95 px-3 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex max-w-md items-center">
        <BottomNavItem icon={<Home className="h-5 w-5" />} label="Home" active />
        <BottomNavItem
          icon={<MessageSquare className="h-5 w-5" />}
          label="Chat"
        />
        <BottomNavItem icon={<Bot className="h-5 w-5" />} label="Agents" />
        <BottomNavItem icon={<Activity className="h-5 w-5" />} label="Alerts" />
        <BottomNavItem icon={<History className="h-5 w-5" />} label="History" />
      </div>
    </div>
  );
}

export function MobileHomeScreen() {
  const totalCards = useMemo(
    () => [
      {
        id: "memory",
        title: "Memory Usage",
        value: "2.2 GB / 5 GB",
        subtitle: "Knowledge base growing",
        icon: <Brain className="h-5 w-5" />,
        iconClassName: "bg-indigo-100 text-indigo-600",
      },
      {
        id: "performance",
        title: "Response Time",
        value: "1.2s avg",
        subtitle: "Fast and stable",
        icon: <Activity className="h-5 w-5" />,
        iconClassName: "bg-emerald-100 text-emerald-600",
      },
    ],
    []
  );

  return (
    <div className="mx-auto min-h-screen max-w-md bg-[#F6F7FB]">
      <TopBar />
      <GreetingSection />
      <AiInputCard />
      <RecentActivityCard />

      <div className="grid grid-cols-2 gap-4 px-5 pt-5">
        <div className="col-span-1">
          <ActiveAgentsCard />
        </div>

        <div className="col-span-1 flex flex-col gap-4">
          {totalCards.map((card) => (
            <StatMiniCard
              key={card.id}
              title={card.title}
              value={card.value}
              subtitle={card.subtitle}
              icon={card.icon}
              iconClassName={card.iconClassName}
            />
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
