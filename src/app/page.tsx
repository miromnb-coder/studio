'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  BadgeCheck,
  Bell,
  Bot,
  ChartNoAxesColumnIncreasing,
  ChevronRight,
  Clock3,
  Compass,
  Ellipsis,
  Gauge,
  Home,
  Layers,
  Library,
  MessageSquare,
  Search,
  Send,
  Sparkles,
  TriangleAlert,
  WandSparkles,
} from 'lucide-react';
import { useAuthSlice } from '@/app/lib/global-store';

type PromptAction = {
  label: 'Research' | 'Analyze' | 'Create' | 'Automate';
  icon: typeof Search;
  starter: string;
};

type ActivityFilter = 'all' | 'research' | 'memory';

const quickActions: PromptAction[] = [
  {
    label: 'Research',
    icon: Search,
    starter: 'Research unusual spending patterns from the last 30 days.',
  },
  {
    label: 'Analyze',
    icon: Compass,
    starter: 'Analyze recurring subscriptions and rank cancellation opportunities.',
  },
  {
    label: 'Create',
    icon: Library,
    starter: 'Create a weekly operator summary with risks and next steps.',
  },
  {
    label: 'Automate',
    icon: WandSparkles,
    starter: 'Automate alert triage and memory updates for new billing emails.',
  },
];

const recentActivity = [
  {
    title: 'Analyzed market trends',
    time: '2 minutes ago',
    context: 'Research agent',
    icon: ChartNoAxesColumnIncreasing,
    status: 'bg-emerald-400',
    type: 'research' as const,
  },
  {
    title: 'Updated project memory',
    time: '15 minutes ago',
    context: 'Memory core',
    icon: Library,
    status: 'bg-emerald-400',
    type: 'memory' as const,
  },
  {
    title: 'Generated weekly report',
    time: '1 hour ago',
    context: 'Action engine',
    icon: Sparkles,
    status: 'bg-indigo-500',
    type: 'all' as const,
  },
];

const activeSystems = [
  {
    title: 'Research Agent',
    subtitle: 'Gathering latest information',
    icon: Bot,
    accent: 'bg-indigo-50 text-indigo-500',
  },
  {
    title: 'Analysis Agent',
    subtitle: 'Processing your data',
    icon: Gauge,
    accent: 'bg-sky-50 text-sky-500',
  },
  {
    title: 'Memory Agent',
    subtitle: 'Updating knowledge base',
    icon: Layers,
    accent: 'bg-amber-50 text-amber-500',
  },
];

const tabs = [
  { label: 'Home', href: '/', icon: Home, active: true },
  { label: 'Chat', href: '/chat', icon: MessageSquare, active: false },
  { label: 'Agents', href: '/agents', icon: Bot, active: false },
  { label: 'Alerts', href: '/alerts', icon: Bell, active: false },
  { label: 'History', href: '/history', icon: Clock3, active: false },
];

export default function HomePage() {
  const { currentUser, logout, updateProfileName } = useAuthSlice();
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<string[]>([
    'System: All agents are online and ready.',
    'Tip: Start with Analyze for a weekly optimization pass.',
  ]);
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('all');
  const [systemExpanded, setSystemExpanded] = useState(true);
  const [tryIndex, setTryIndex] = useState(0);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const tryPrompts = [
    'Audit upcoming renewals',
    'Summarize latest alert digest',
    'Find cancellation opportunities',
  ];

  const canSend = prompt.trim().length > 0;
  const userName = currentUser?.name || 'Operator';
  const initials = userName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const filteredActivity = useMemo(() => {
    if (activityFilter === 'all') return recentActivity;
    return recentActivity.filter(
      (item) => item.type === activityFilter || item.type === 'all',
    );
  }, [activityFilter]);

  const sendPrompt = () => {
    const value = prompt.trim();
    if (!value) return;

    setMessages((prev) => [
      ...prev,
      `You: ${value}`,
      `Agent: Working on "${value}" now.`,
    ]);
    setPrompt('');
  };

  const applyQuickAction = (starter: string) => {
    setPrompt(starter);
  };

  const cycleTryPrompt = () => {
    const next = (tryIndex + 1) % tryPrompts.length;
    setTryIndex(next);
    setPrompt(tryPrompts[next]);
  };

  const handleEditName = () => {
    const value = window.prompt('Update your profile name', userName);
    if (!value) return;
    updateProfileName(value);
    setProfileMenuOpen(false);
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-md bg-[#f8fafc] text-slate-900">
      <section className="border-b border-black/[0.04] bg-white/90 px-5 pt-7 pb-5 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-indigo-50 p-2.5 text-indigo-500">
              <Sparkles className="h-4 w-4 stroke-[1.9]" />
            </div>

            <div className="flex items-center gap-2">
              <p className="text-[2rem] font-semibold tracking-tight text-slate-900">
                MiroAI
              </p>
              <span className="rounded-xl bg-indigo-50 px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-indigo-500">
                PRO
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/alerts"
              className="relative rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Alerts"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-rose-500" />
            </Link>

            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1.5 text-slate-600 transition hover:bg-slate-50"
                aria-label="Profile"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                  {initials}
                </span>
                <span className="max-w-24 truncate text-sm font-medium text-slate-700">
                  {userName}
                </span>
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 top-12 z-30 w-48 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
                  <button
                    type="button"
                    onClick={handleEditName}
                    className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    Edit name
                  </button>
                  <button
                    type="button"
                    onClick={logout}
                    className="mt-1 w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-rose-500 transition hover:bg-rose-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6 px-5 py-6 pb-28">
        <header className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-600">
            <BadgeCheck className="h-3.5 w-3.5" />
            Profile active
          </div>
          <h1 className="text-[2.35rem] font-semibold tracking-tight text-slate-900">
            Good morning, {userName} 👋
          </h1>
          <p className="text-[1.15rem] leading-relaxed text-slate-500">
            Your AI agents are ready to help you today.
          </p>
        </header>

        <article className="overflow-hidden rounded-[22px] border border-black/[0.04] bg-white shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
          <div className="space-y-5 p-5">
            <p className="text-[1.25rem] leading-[1.45] text-slate-500">
              What would you like to accomplish today?
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              {quickActions.map(({ label, icon: Icon, starter }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => applyQuickAction(starter)}
                  className="flex items-center justify-center gap-2 rounded-full border border-black/[0.04] bg-slate-50 px-4 py-3 text-[0.98rem] font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  <Icon className="h-4 w-4 stroke-[1.8]" />
                  {label}
                </button>
              ))}
            </div>

            <div className="rounded-[18px] border border-black/[0.04] bg-slate-50 p-3">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Type your next task for the agents..."
                rows={3}
                className="w-full resize-none bg-transparent text-[0.98rem] leading-relaxed text-slate-700 outline-none placeholder:text-slate-400"
              />
              <div className="mt-3 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={cycleTryPrompt}
                  className="text-sm font-medium text-slate-500 transition hover:text-slate-700"
                >
                  Try: {tryPrompts[tryIndex]}
                </button>

                <button
                  type="button"
                  onClick={sendPrompt}
                  disabled={!canSend}
                  className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(99,102,241,0.22)] transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                >
                  <Send className="h-4 w-4" />
                  Send
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-black/[0.04] px-5 py-3">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="font-semibold text-slate-700">Try:</span>
              <button
                type="button"
                onClick={() => setPrompt('Analyze my weekly productivity')}
                className="transition hover:text-slate-700"
              >
                Analyze my weekly productivity
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => setPrompt('Summarize recent news')}
                className="transition hover:text-slate-700"
              >
                Summarize recent news
              </button>
            </div>

            <button
              type="button"
              onClick={cycleTryPrompt}
              className="text-slate-400 transition hover:text-slate-600"
              aria-label="Next suggestion"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </article>

        <article className="rounded-[22px] border border-black/[0.04] bg-white p-5 shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[1.95rem] font-semibold tracking-tight text-slate-900">
              Recent Activity
            </h2>

            <Link
              href="/history"
              className="inline-flex items-center gap-1 text-[1rem] font-medium text-slate-400 transition hover:text-slate-600"
            >
              View all
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mb-4 flex gap-2">
            {(['all', 'research', 'memory'] as ActivityFilter[]).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActivityFilter(filter)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${
                  activityFilter === filter
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="space-y-5">
            {filteredActivity.map(({ title, time, context, icon: Icon, status }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-500">
                  <Icon className="h-5 w-5 stroke-[1.8]" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[1.25rem] font-medium leading-tight tracking-tight text-slate-800">
                    {title}
                  </p>
                  <p className="mt-1 text-[0.95rem] leading-relaxed text-slate-400">
                    {time} · {context}
                  </p>
                </div>

                <span className={`mt-2 h-2.5 w-2.5 rounded-full ${status}`} />
              </div>
            ))}
          </div>
        </article>

        <section className="grid grid-cols-5 gap-3">
          <article className="col-span-3 rounded-[22px] border border-black/[0.04] bg-white p-5 shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[1.55rem] font-semibold tracking-tight text-slate-900">
                Active Agents
              </h3>

              <button
                type="button"
                onClick={() => setSystemExpanded((prev) => !prev)}
                className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100"
                aria-label="Toggle active agents"
              >
                <Ellipsis className="h-5 w-5" />
              </button>
            </div>

            {systemExpanded && (
              <div className="space-y-4">
                {activeSystems.map(({ title, subtitle, icon: Icon, accent }) => (
                  <div key={title} className="flex gap-3">
                    <div className={`rounded-2xl p-3 ${accent}`}>
                      <Icon className="h-5 w-5 stroke-[1.8]" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[1.2rem] font-medium tracking-tight text-slate-800">
                        {title}
                      </p>
                      <p className="text-[0.92rem] leading-relaxed text-slate-400">
                        {subtitle}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>

          <div className="col-span-2 space-y-3">
            <article className="rounded-[22px] border border-black/[0.04] bg-white p-4 shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
              <div className="mb-3 flex items-center gap-2">
                <div className="rounded-xl bg-indigo-50 p-2 text-indigo-500">
                  <Library className="h-4 w-4 stroke-[1.8]" />
                </div>
                <span className="text-[1.2rem] font-semibold tracking-tight text-slate-900">
                  Memory Usage
                </span>
              </div>

              <p className="text-[0.95rem] leading-relaxed text-slate-400">
                2.2 GB / 5 GB
              </p>

              <div className="mt-4 h-2 rounded-full bg-slate-100">
                <div className="h-2 w-[44%] rounded-full bg-indigo-400" />
              </div>
            </article>

            <article className="rounded-[22px] border border-black/[0.04] bg-white p-4 shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[1.15rem] font-semibold tracking-tight text-slate-900">
                    Alert Digest
                  </p>
                  <p className="mt-1 text-[0.92rem] leading-relaxed text-slate-400">
                    3 pending items
                  </p>
                </div>
                <TriangleAlert className="h-5 w-5 text-amber-400" />
              </div>
            </article>

            <article className="rounded-[22px] border border-black/[0.04] bg-white p-4 shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[1.15rem] font-semibold tracking-tight text-slate-900">
                    UI Services
                  </p>
                  <p className="mt-1 text-[0.92rem] leading-relaxed text-slate-400">
                    This month
                  </p>
                </div>
                <WandSparkles className="h-5 w-5 text-emerald-400" />
              </div>
            </article>
          </div>
        </section>

        <article className="rounded-[22px] border border-black/[0.04] bg-white p-5 shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[1.1rem] font-semibold text-slate-800">
              Conversation
            </h3>
            <button
              type="button"
              onClick={() => setMessages([])}
              className="text-sm font-medium text-slate-400 transition hover:text-slate-600"
            >
              Clear
            </button>
          </div>

          <div className="space-y-2">
            {messages.length === 0 ? (
              <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-400">
                No conversation yet.
              </p>
            ) : (
              messages.slice(-5).map((message, index) => (
                <p
                  key={`${message}-${index}`}
                  className="rounded-xl bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-600"
                >
                  {message}
                </p>
              ))
            )}
          </div>
        </article>
      </section>

      <nav className="fixed bottom-0 left-1/2 z-20 grid w-full max-w-md -translate-x-1/2 grid-cols-5 border-t border-black/[0.05] bg-white/95 px-4 py-3 backdrop-blur">
        {tabs.map(({ label, href, icon: Icon, active }) => (
          <Link
            key={label}
            href={href}
            className={`flex flex-col items-center gap-1 rounded-xl py-1.5 text-xs font-medium transition ${
              active ? 'text-indigo-500' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Icon className="h-[18px] w-[18px] stroke-[1.8]" />
            {label}
          </Link>
        ))}
      </nav>
    </main>
  );
}
