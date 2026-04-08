'use client';

import { useState } from 'react';
import { Bot, CircleDollarSign, Gauge, Library, Search } from 'lucide-react';
import { BottomNav } from '../components/bottom-nav';

const agents = [
  { name: 'Research Agent', description: 'Collects external context and signals.', icon: Search, running: false },
  { name: 'Analysis Agent', description: 'Finds patterns and recommends actions.', icon: Gauge, running: true },
  { name: 'Memory Agent', description: 'Maintains long-term personalized memory.', icon: Library, running: false },
  { name: 'Money Agent', description: 'Detects leaks, waste, and savings opportunities.', icon: CircleDollarSign, running: true },
];

export default function AgentsPage() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() => Object.fromEntries(agents.map((agent) => [agent.name, true])));

  return (
    <main className="mx-auto min-h-screen w-full max-w-md bg-[#f8f9fc] pb-28 shadow-[0_10px_32px_rgba(15,23,42,0.06)]">
      <header className="border-b border-black/[0.04] px-6 pt-8 pb-4">
        <h1 className="text-[2rem] font-semibold tracking-tight text-slate-900">Agents</h1>
        <p className="text-sm text-slate-500">Control and visibility for your active AI systems.</p>
      </header>

      <section className="space-y-3 px-5 py-5">
        {agents.map(({ name, description, icon: Icon, running }) => (
          <article key={name} className="flex items-start justify-between rounded-[20px] border border-black/[0.04] bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="flex gap-3">
              <div className="rounded-2xl bg-indigo-50 p-2.5 text-indigo-500"><Icon className="h-5 w-5" /></div>
              <div>
                <p className="text-lg font-semibold text-slate-900">{name}</p>
                <p className="text-sm text-slate-500">{description}</p>
                <p className={`mt-1 text-xs font-medium ${running ? 'text-emerald-500' : 'text-slate-400'}`}>{running ? 'Currently running' : 'Idle'}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEnabled((prev) => ({ ...prev, [name]: !prev[name] }))}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${enabled[name] ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
            >
              {enabled[name] ? 'On' : 'Off'}
            </button>
          </article>
        ))}
      </section>

      <BottomNav />
    </main>
  );
}
