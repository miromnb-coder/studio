'use client';

import { useEffect, useState } from 'react';
import { Bot, Gauge, Layers, Search } from 'lucide-react';

const agents = [
  { title: 'Research Agent', subtitle: 'Finds relevant information and trends.', icon: Search },
  { title: 'Analysis Agent', subtitle: 'Processes patterns and insights.', icon: Gauge },
  { title: 'Memory Agent', subtitle: 'Stores and recalls important context.', icon: Layers },
];

export default function AgentsPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 700);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main className="screen bg-[#f8fafc]">
      <section className="surface-card p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-500"><Bot className="h-5 w-5" /></div>
          <div>
            <h1 className="text-2xl font-semibold">Active Agents</h1>
            <p className="text-sm text-slate-500">Systems currently assisting behind the scenes.</p>
          </div>
        </div>

        <div className="space-y-3">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)
            : agents.map(({ title, subtitle, icon: Icon }) => (
                <div key={title} className="message-appear flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                  <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-500"><Icon className="h-5 w-5" /></div>
                  <div>
                    <p className="font-semibold text-slate-800">{title}</p>
                    <p className="text-sm text-slate-500">{subtitle}</p>
                  </div>
                </div>
              ))}
        </div>
      </section>

      <BottomNav />
    </main>
  );
}
