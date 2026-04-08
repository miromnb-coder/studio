'use client';

import { Clock3 } from 'lucide-react';
import { BottomNav } from '../components/bottom-nav';

const historyItems = [
  'Generated weekly operator summary',
  'Stored memory update from billing analysis',
  'Ran subscription leak review',
];

export default function HistoryPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-md bg-[#f8fafc] px-5 py-6 pb-32 text-slate-900">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-[2rem] font-semibold tracking-tight text-slate-900">History</h1>

        <div className="rounded-full bg-slate-100 p-2.5 text-slate-500">
          <Clock3 className="h-5 w-5" />
        </div>
      </div>

      <section className="rounded-[22px] border border-black/[0.04] bg-white p-6 shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
        <p className="text-[1rem] leading-relaxed text-slate-500">
          Review recent actions, runs, summaries, and saved outputs.
        </p>

        <div className="mt-6 space-y-3">
          {historyItems.map((item, index) => (
            <div
              key={item}
              className="rounded-2xl bg-slate-50 px-4 py-4 text-sm leading-relaxed text-slate-700"
            >
              {index + 1}. {item}
            </div>
          ))}
        </div>
      </section>

      <BottomNav />
    </main>
  );
}
