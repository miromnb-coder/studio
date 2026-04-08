'use client';

import Link from 'next/link';
import { ArrowLeft, Bot, Gauge, Layers, Play, Search } from 'lucide-react';
import { useAppStore, useSetPageOnMount } from '../lib/app-store';

export default function AgentsPage() {
  useSetPageOnMount('agents');
  const { selectors, actions } = useAppStore();

  return (
    <main className="mx-auto min-h-screen w-full max-w-md bg-[#f8fafc] px-5 py-6 text-slate-900">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-[0_4px_14px_rgba(15,23,42,0.04)] hover:bg-slate-50"><ArrowLeft className="h-4 w-4" />Back</Link>
        <div className="rounded-full bg-indigo-50 p-2.5 text-indigo-500"><Bot className="h-5 w-5" /></div>
      </div>

      <section className="rounded-[22px] border border-black/[0.04] bg-white p-6 shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
        <h1 className="text-[1.9rem] font-semibold tracking-tight text-slate-900">Active Agents</h1>
        <p className="mt-2 text-[1rem] leading-relaxed text-slate-500">These AI systems are currently assisting you behind the scenes.</p>

        <div className="mt-6 space-y-4">
          {selectors.agents.map((agent) => {
            const Icon = agent.iconKey === 'analysis' ? Gauge : agent.iconKey === 'memory' ? Layers : Search;
            return (
              <div key={agent.id} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                <div className={`rounded-2xl p-3 ${agent.accent}`}><Icon className="h-5 w-5 stroke-[1.8]" /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-[1.1rem] font-medium tracking-tight text-slate-800">{agent.name}</p>
                  <p className="text-[0.95rem] leading-relaxed text-slate-500">{agent.subtitle}</p>
                </div>
                <button type="button" onClick={() => actions.runAgentsForIntent(agent.name)} className="rounded-full bg-white p-2 text-slate-500"><Play className="h-4 w-4" /></button>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
