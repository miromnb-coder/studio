'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import {
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
  User,
  WandSparkles,
} from 'lucide-react';
import { useAppStore, useSetPageOnMount, type ActivityFilter } from './lib/app-store';

type PromptAction = {
  label: 'Research' | 'Analyze' | 'Create' | 'Automate';
  icon: typeof Search;
  starter: string;
};

const quickActions: PromptAction[] = [
  { label: 'Research', icon: Search, starter: 'Research unusual spending patterns from the last 30 days.' },
  { label: 'Analyze', icon: Compass, starter: 'Analyze recurring subscriptions and rank cancellation opportunities.' },
  { label: 'Create', icon: Library, starter: 'Create a weekly operator summary with risks and next steps.' },
  { label: 'Automate', icon: WandSparkles, starter: 'Automate alert triage and memory updates for new billing emails.' },
];

const tabs = [
  { label: 'Home', href: '/', icon: Home, page: 'home' as const },
  { label: 'Chat', href: '/chat', icon: MessageSquare, page: 'chat' as const },
  { label: 'Agents', href: '/agents', icon: Bot, page: 'agents' as const },
  { label: 'Alerts', href: '/alerts', icon: Bell, page: 'alerts' as const },
  { label: 'History', href: '/history', icon: Clock3, page: 'history' as const },
];

const tryPrompts = ['Audit upcoming renewals', 'Summarize latest alert digest', 'Find cancellation opportunities'];

export default function HomePage() {
  useSetPageOnMount('home');
  const { state, actions, selectors } = useAppStore();

  const prompt = state.ui.promptInput;
  const canSend = prompt.trim().length > 0;

  const filteredActivity = useMemo(() => {
    if (state.ui.activityFilter === 'all') return selectors.history.slice(0, 6);
    return selectors.history.filter((item) => {
      if (state.ui.activityFilter === 'research') return item.context.toLowerCase().includes('research');
      return item.context.toLowerCase().includes('memory');
    });
  }, [selectors.history, state.ui.activityFilter]);

  const sendPrompt = () => {
    if (!prompt.trim()) return;
    actions.sendMessage(prompt, 'home');
    actions.runAgentsForIntent(prompt);
  };

  const cycleTryPrompt = () => {
    const next = (state.ui.tryPromptIndex + 1) % tryPrompts.length;
    actions.setTryPromptIndex(next);
    actions.setPromptInput(tryPrompts[next]);
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-md bg-[#f8fafc] text-slate-900">
      <section className="border-b border-black/[0.04] bg-white/90 px-5 pt-7 pb-5 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-indigo-50 p-2.5 text-indigo-500"><Sparkles className="h-4 w-4 stroke-[1.9]" /></div>
            <div className="flex items-center gap-2">
              <p className="text-[2rem] font-semibold tracking-tight text-slate-900">MiroAI</p>
              <span className="rounded-xl bg-indigo-50 px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-indigo-500">{state.user.plan}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/alerts" className="relative rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600" aria-label="Alerts">
              <Bell className="h-5 w-5" />
              {selectors.unresolvedAlertCount > 0 && <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-rose-500" />}
            </Link>

            <button
              type="button"
              onClick={() => actions.logHistoryEvent({ type: 'system', title: 'Profile action opened', context: 'home header' })}
              className="rounded-full bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200"
              aria-label="Profile"
            >
              <User className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-6 px-5 py-6 pb-28">
        <header className="space-y-2">
          <h1 className="text-[2.35rem] font-semibold tracking-tight text-slate-900">Good morning, {state.user.name} 👋</h1>
          <p className="text-[1.15rem] leading-relaxed text-slate-500">Your AI agents are ready to help you today.</p>
        </header>

        <article className="overflow-hidden rounded-[22px] border border-black/[0.04] bg-white shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
          <div className="space-y-5 p-5">
            <p className="text-[1.25rem] leading-[1.45] text-slate-500">What would you like to accomplish today?</p>
            <div className="grid grid-cols-2 gap-2.5">
              {quickActions.map(({ label, icon: Icon, starter }) => (
                <button key={label} type="button" onClick={() => actions.setPromptInput(starter)} className="flex items-center justify-center gap-2 rounded-full border border-black/[0.04] bg-slate-50 px-4 py-3 text-[0.98rem] font-medium text-slate-700 transition hover:bg-slate-100">
                  <Icon className="h-4 w-4 stroke-[1.8]" />{label}
                </button>
              ))}
            </div>

            <div className="rounded-[18px] border border-black/[0.04] bg-slate-50 p-3">
              <textarea value={prompt} onChange={(e) => actions.setPromptInput(e.target.value)} placeholder="Type your next task for the agents..." rows={3} className="w-full resize-none bg-transparent text-[0.98rem] leading-relaxed text-slate-700 outline-none placeholder:text-slate-400" />
              <div className="mt-3 flex items-center justify-between gap-3">
                <button type="button" onClick={cycleTryPrompt} className="text-sm font-medium text-slate-500 transition hover:text-slate-700">Try: {tryPrompts[state.ui.tryPromptIndex]}</button>
                <button type="button" onClick={sendPrompt} disabled={!canSend} className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(99,102,241,0.22)] transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none">
                  <Send className="h-4 w-4" />Send
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-black/[0.04] px-5 py-3">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="font-semibold text-slate-700">Try:</span>
              <button type="button" onClick={() => actions.openChatWithPrompt('Analyze my weekly productivity')} className="transition hover:text-slate-700">Analyze my weekly productivity</button>
              <span>·</span>
              <button type="button" onClick={() => actions.openChatWithPrompt('Summarize recent news')} className="transition hover:text-slate-700">Summarize recent news</button>
            </div>
            <button type="button" onClick={cycleTryPrompt} className="text-slate-400 transition hover:text-slate-600" aria-label="Next suggestion"><ChevronRight className="h-5 w-5" /></button>
          </div>
        </article>

        <article className="rounded-[22px] border border-black/[0.04] bg-white p-5 shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[1.95rem] font-semibold tracking-tight text-slate-900">Recent Activity</h2>
            <Link href="/history" className="inline-flex items-center gap-1 text-[1rem] font-medium text-slate-400 transition hover:text-slate-600">View all<ChevronRight className="h-4 w-4" /></Link>
          </div>

          <div className="mb-4 flex gap-2">
            {(['all', 'research', 'memory'] as ActivityFilter[]).map((filter) => (
              <button key={filter} type="button" onClick={() => actions.setActivityFilter(filter)} className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${state.ui.activityFilter === filter ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                {filter}
              </button>
            ))}
          </div>

          <div className="space-y-5">
            {filteredActivity.slice(0, 3).map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-500"><ChartNoAxesColumnIncreasing className="h-5 w-5 stroke-[1.8]" /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-[1.15rem] font-medium leading-tight tracking-tight text-slate-800">{item.title}</p>
                  <p className="mt-1 text-[0.95rem] leading-relaxed text-slate-400">{new Date(item.createdAt).toLocaleTimeString()} · {item.context}</p>
                </div>
                <span className="mt-2 h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </div>
            ))}
          </div>
        </article>

        <section className="grid grid-cols-5 gap-3">
          <article className="col-span-3 rounded-[22px] border border-black/[0.04] bg-white p-5 shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[1.55rem] font-semibold tracking-tight text-slate-900">Active Agents</h3>
              <button type="button" onClick={() => actions.setSystemExpanded(!state.ui.systemExpanded)} className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100" aria-label="Toggle active agents"><Ellipsis className="h-5 w-5" /></button>
            </div>
            {state.ui.systemExpanded && (
              <div className="space-y-4">
                {selectors.agents.map((agent) => {
                  const Icon = agent.iconKey === 'analysis' ? Gauge : agent.iconKey === 'memory' ? Layers : Bot;
                  return (
                    <div key={agent.id} className="flex gap-3">
                      <div className={`rounded-2xl p-3 ${agent.accent}`}><Icon className="h-5 w-5 stroke-[1.8]" /></div>
                      <div className="min-w-0">
                        <p className="text-[1.2rem] font-medium tracking-tight text-slate-800">{agent.name}</p>
                        <p className="text-[0.92rem] leading-relaxed text-slate-400">{agent.subtitle}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </article>

          <div className="col-span-2 space-y-3">
            <article className="rounded-[22px] border border-black/[0.04] bg-white p-4 shadow-[0_4px_14px_rgba(15,23,42,0.04)]"><div className="mb-3 flex items-center gap-2"><div className="rounded-xl bg-indigo-50 p-2 text-indigo-500"><Library className="h-4 w-4 stroke-[1.8]" /></div><span className="text-[1.2rem] font-semibold tracking-tight text-slate-900">Memory Usage</span></div><p className="text-[0.95rem] leading-relaxed text-slate-400">2.2 GB / 5 GB</p><div className="mt-4 h-2 rounded-full bg-slate-100"><div className="h-2 w-[44%] rounded-full bg-indigo-400" /></div></article>
            <article className="rounded-[22px] border border-black/[0.04] bg-white p-4 shadow-[0_4px_14px_rgba(15,23,42,0.04)]"><div className="flex items-start justify-between gap-2"><div><p className="text-[1.15rem] font-semibold tracking-tight text-slate-900">Alert Digest</p><p className="mt-1 text-[0.92rem] leading-relaxed text-slate-400">{selectors.unresolvedAlertCount} pending items</p></div><TriangleAlert className="h-5 w-5 text-amber-400" /></div></article>
            <article className="rounded-[22px] border border-black/[0.04] bg-white p-4 shadow-[0_4px_14px_rgba(15,23,42,0.04)]"><div className="flex items-start justify-between gap-2"><div><p className="text-[1.15rem] font-semibold tracking-tight text-slate-900">UI Services</p><p className="mt-1 text-[0.92rem] leading-relaxed text-slate-400">This month</p></div><WandSparkles className="h-5 w-5 text-emerald-400" /></div></article>
          </div>
        </section>

        <article className="rounded-[22px] border border-black/[0.04] bg-white p-5 shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
          <div className="mb-3 flex items-center justify-between"><h3 className="text-[1.1rem] font-semibold text-slate-800">Conversation</h3><button type="button" onClick={actions.clearConversation} className="text-sm font-medium text-slate-400 transition hover:text-slate-600">Clear</button></div>
          <div className="space-y-2">
            {selectors.messages.length === 0 ? <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-400">No conversation yet.</p> : selectors.messages.slice(-5).map((message) => (
              <p key={message.id} className="rounded-xl bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-600">{message.role === 'assistant' ? 'Agent' : message.role === 'user' ? 'You' : 'System'}: {message.content}</p>
            ))}
          </div>
        </article>
      </section>

      <nav className="fixed bottom-0 left-1/2 z-20 grid w-full max-w-md -translate-x-1/2 grid-cols-5 border-t border-black/[0.05] bg-white/95 px-4 py-3 backdrop-blur">
        {tabs.map(({ label, href, icon: Icon, page }) => (
          <Link key={label} href={href} className={`flex flex-col items-center gap-1 rounded-xl py-1.5 text-xs font-medium transition ${state.ui.currentPage === page ? 'text-indigo-500' : 'text-slate-400 hover:text-slate-600'}`}>
            <Icon className="h-[18px] w-[18px] stroke-[1.8]" />{label}
          </Link>
        ))}
      </nav>
    </main>
  );
}
