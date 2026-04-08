<<<<<<< codex/refine-ui-for-premium-visual-quality-11tpc3
import Link from 'next/link';

export default function AgentsPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-md bg-[#f8f9fc] px-6 py-10">
      <h1 className="text-3xl font-semibold text-slate-900">Auralis Agents</h1>
      <p className="mt-3 text-slate-500">Monitor orchestrator, analysis, and memory systems in real time.</p>
      <Link href="/" className="mt-6 inline-block rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">
        Back Home
      </Link>
=======
'use client';

import Link from 'next/link';
import { ArrowLeft, Bot, Gauge, Layers, Search } from 'lucide-react';

const agents = [
  {
    title: 'Research Agent',
    subtitle: 'Finds relevant information and trends.',
    icon: Search,
    accent: 'bg-indigo-50 text-indigo-500',
  },
  {
    title: 'Analysis Agent',
    subtitle: 'Processes patterns, anomalies, and opportunities.',
    icon: Gauge,
    accent: 'bg-sky-50 text-sky-500',
  },
  {
    title: 'Memory Agent',
    subtitle: 'Maintains important context and summaries.',
    icon: Layers,
    accent: 'bg-amber-50 text-amber-500',
  },
];

export default function AgentsPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-md bg-[#f8fafc] px-5 py-6 text-slate-900">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-[0_4px_14px_rgba(15,23,42,0.04)] transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <div className="rounded-full bg-indigo-50 p-2.5 text-indigo-500">
          <Bot className="h-5 w-5" />
        </div>
      </div>

      <section className="rounded-[22px] border border-black/[0.04] bg-white p-6 shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
        <h1 className="text-[2rem] font-semibold tracking-tight text-slate-900">
          Agents
        </h1>
        <p className="mt-2 text-[1rem] leading-relaxed text-slate-500">
          Monitor the AI systems currently active in your operator stack.
        </p>

        <div className="mt-6 space-y-4">
          {agents.map(({ title, subtitle, icon: Icon, accent }) => (
            <div
              key={title}
              className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-4"
            >
              <div className={`rounded-2xl p-3 ${accent}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[1.1rem] font-medium tracking-tight text-slate-800">
                  {title}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">
                  {subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>

        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-indigo-500 transition hover:text-indigo-600"
        >
          Return to dashboard
        </Link>
      </section>
>>>>>>> main
    </main>
  );
}
