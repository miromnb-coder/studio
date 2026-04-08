'use client';

import { Clock3 } from 'lucide-react';

const historyItems = [
  'Generated weekly operator summary',
  'Stored memory update from billing analysis',
  'Ran subscription leak review',
];

export default function HistoryPage() {
  return (
    <main className="screen bg-[#f8fafc]">
      <section className="surface-card p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-slate-100 p-2.5 text-slate-500"><Clock3 className="h-5 w-5" /></div>
          <div>
            <h1 className="text-2xl font-semibold">History</h1>
            <p className="text-sm text-slate-500">Recent runs, summaries, and saved outputs.</p>
          </div>
        </div>

        <div className="space-y-3">
          {historyItems.map((item, index) => (
            <div key={item} className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-700">{index + 1}. {item}</div>
          ))}
        </div>
      </section>
    </main>
  );
}
