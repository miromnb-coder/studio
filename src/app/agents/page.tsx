'use client';

import { Bot, Gauge, Layers, Search } from 'lucide-react';
import { BottomNav } from '../components/bottom-nav';

const agents = [
  {
    title: 'Research Agent',
    subtitle: 'Finds relevant information and trends.',
    icon: Search,
    accent: 'bg-indigo-50 text-indigo-500',
  },
  {
    title: 'Analysis Agent',
    subtitle: 'Processes patterns and insights.',
    icon: Gauge,
    accent: 'bg-sky-50 text-sky-500',
  },
  {
    title: 'Memory Agent',
    subtitle: 'Stores and recalls important context.',
    icon: Layers,
    accent: 'bg-amber-50 text-amber-500',
  },
];

export default function AgentsPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-md bg-[#f8fafc] px-5 py-6 pb-32 text-slate-900">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-[1.9rem] font-semibold tracking-tight text-slate-900">Active Agents</h1>

        <div className="rounded-full bg-indigo-50 p-2.5 text-indigo-500">
          <Bot className="h-5 w-5" />
        </div>
      </div>

      <section className="rounded-[22px] border border-black/[0.04] bg-white p-6 shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
        <p className="text-[1rem] leading-relaxed text-slate-500">
          These AI systems are currently assisting you behind the scenes.
        </p>

        <div className="mt-6 space-y-4">
          {agents.map(({ title, subtitle, icon: Icon, accent }) => (
            <div
              key={title}
              className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4"
            >
              <div className={`rounded-2xl p-3 ${accent}`}>
                <Icon className="h-5 w-5 stroke-[1.8]" />
              </div>

              <div className="min-w-0">
                <p className="text-[1.1rem] font-medium tracking-tight text-slate-800">
                  {title}
                </p>
                <p className="text-[0.95rem] leading-relaxed text-slate-500">
                  {subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <BottomNav />
    </main>
  );
}
