import Link from 'next/link';
import {
  Bell,
  Bot,
  ChartNoAxesColumnIncreasing,
  Clock3,
  Compass,
  Ellipsis,
  Gauge,
  Home,
  Layers,
  Library,
  MessageSquare,
  Search,
  Sparkles,
  TriangleAlert,
  User,
  WandSparkles,
} from 'lucide-react';

const quickActions = [
  { label: 'Analyze spend', icon: Search },
  { label: 'Run orchestrator', icon: Compass },
  { label: 'Update memory', icon: Library },
  { label: 'Forge tool', icon: WandSparkles },
];

const recentActivity = [
  {
    title: 'Completed subscription leak analysis',
    time: '2 min ago',
    context: 'Agent V6 · finance intent',
    icon: ChartNoAxesColumnIncreasing,
    status: 'bg-emerald-300/90',
  },
  {
    title: 'Stored episodic memory summary',
    time: '12 min ago',
    context: 'Memory service · user profile',
    icon: Library,
    status: 'bg-emerald-300/90',
  },
  {
    title: 'Generated actionable negotiation script',
    time: '1 hr ago',
    context: 'Action engine · ready to send',
    icon: Sparkles,
    status: 'bg-indigo-400/90',
  },
];

const activeSystems = [
  {
    title: 'Orchestrator',
    subtitle: 'Reasoning across tools and intents',
    icon: Bot,
    accent: 'bg-indigo-50 text-indigo-500',
  },
  {
    title: 'Financial Forensics',
    subtitle: 'Detecting fees, renewals, and waste',
    icon: Gauge,
    accent: 'bg-sky-50 text-sky-500',
  },
  {
    title: 'Memory Core',
    subtitle: 'Syncing semantic + episodic context',
    icon: Layers,
    accent: 'bg-amber-50 text-amber-500',
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-md bg-slate-50/70 shadow-[0_10px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl">
      <section className="border-b border-black/[0.04] px-6 pt-8 pb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-indigo-50 p-2.5 text-indigo-500">
              <Sparkles className="h-4 w-4 stroke-[1.75]" />
            </div>
            <div className="flex items-center gap-2">
              <p className="text-[1.8rem] font-semibold tracking-tight text-slate-900">AI Life Operator</p>
              <span className="rounded-lg bg-indigo-50 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-indigo-500">
                v6
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button className="relative rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" />
            </button>
            <button className="rounded-full bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200">
              <User className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-6 px-6 py-7">
        <header className="space-y-2.5">
          <h1 className="text-[2.6rem] font-semibold tracking-tight text-slate-900">Good morning, Operator 👋</h1>
          <p className="text-[1.3rem] leading-relaxed font-normal text-slate-500">Your financial intelligence stack is online.</p>
        </header>

        <article className="overflow-hidden rounded-[20px] border border-black/[0.04] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="space-y-6 p-6">
            <p className="text-[1.72rem] leading-[1.35] text-slate-500">What should the agent system accomplish next?</p>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  className="flex items-center justify-center gap-2 rounded-full border border-black/[0.04] bg-slate-50 px-4 py-3 text-base font-medium text-slate-600 transition hover:bg-slate-100"
                >
                  <Icon className="h-4 w-4 stroke-[1.75]" />
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 border-t border-black/[0.04] px-6 py-4 text-base leading-relaxed text-slate-500">
            <span className="font-semibold text-slate-700">Try:</span>
            <span>Audit upcoming renewals</span>
            <span>·</span>
            <span>Summarize latest alert digest</span>
          </div>
        </article>

        <article className="rounded-[20px] border border-black/[0.04] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-[2rem] font-semibold tracking-tight text-slate-900">Recent Activity</h2>
            <Link href="/history" className="text-lg font-medium text-slate-400 transition hover:text-slate-600">
              View all
            </Link>
          </div>
          <div className="space-y-5">
            {recentActivity.map(({ title, time, context, icon: Icon, status }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="rounded-2xl bg-indigo-50/60 p-3 text-indigo-500">
                  <Icon className="h-5 w-5 stroke-[1.8]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[1.75rem] font-medium leading-tight tracking-tight text-slate-800">{title}</p>
                  <p className="text-base leading-relaxed font-normal text-slate-400">{time} · {context}</p>
                </div>
                <span className={`mt-2 h-2.5 w-2.5 rounded-full ${status}`} />
              </div>
            ))}
          </div>
        </article>

        <section className="grid grid-cols-5 gap-3">
          <article className="col-span-3 rounded-[20px] border border-black/[0.04] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[1.9rem] font-semibold tracking-tight text-slate-900">Active Systems</h3>
              <button className="rounded-full p-1 text-slate-400 hover:bg-slate-100">
                <Ellipsis className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              {activeSystems.map(({ title, subtitle, icon: Icon, accent }) => (
                <div key={title} className="flex gap-3">
                  <div className={`rounded-2xl p-2.5 ${accent}`}>
                    <Icon className="h-5 w-5 stroke-[1.8]" />
                  </div>
                  <div>
                    <p className="text-2xl font-medium tracking-tight text-slate-800">{title}</p>
                    <p className="text-sm leading-relaxed font-normal text-slate-400">{subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <div className="col-span-2 space-y-3">
            <article className="rounded-[20px] border border-black/[0.04] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <div className="mb-3 flex items-center gap-2 text-indigo-500">
                <div className="rounded-xl bg-indigo-50 p-2">
                  <Library className="h-4 w-4 stroke-[1.8]" />
                </div>
                <span className="text-xl font-semibold tracking-tight text-slate-900">Memory Usage</span>
              </div>
              <p className="text-base leading-relaxed font-normal text-slate-400">1.8 GB / 5 GB</p>
              <div className="mt-4 h-2 rounded-full bg-slate-100">
                <div className="h-2 w-[36%] rounded-full bg-indigo-400" />
              </div>
            </article>

            <article className="rounded-[20px] border border-black/[0.04] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl font-semibold tracking-tight text-slate-900">Alert Digest</p>
                  <p className="text-sm leading-relaxed font-normal text-slate-400">3 pending items</p>
                </div>
                <TriangleAlert className="h-5 w-5 text-amber-400" />
              </div>
            </article>

            <article className="rounded-[20px] border border-black/[0.04] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl font-semibold tracking-tight text-slate-900">Tool Registry</p>
                  <p className="text-sm leading-relaxed font-normal text-slate-400">12 active protocols</p>
                </div>
                <WandSparkles className="h-5 w-5 text-emerald-400" />
              </div>
            </article>
          </div>
        </section>
      </section>

      <nav className="sticky bottom-0 grid grid-cols-5 border-t border-black/[0.05] bg-white/95 px-4 py-3 backdrop-blur">
        {[
          { label: 'Home', href: '/', icon: Home, active: true },
          { label: 'Copilot', href: '/chat', icon: MessageSquare },
          { label: 'Agents', href: '/agents', icon: Bot },
          { label: 'Alerts', href: '/alerts', icon: Bell },
          { label: 'History', href: '/history', icon: Clock3 },
        ].map(({ label, href, icon: Icon, active }) => (
          <Link
            key={label}
            href={href}
            className={`flex flex-col items-center gap-1.5 rounded-xl py-1.5 text-xs font-medium transition ${
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
