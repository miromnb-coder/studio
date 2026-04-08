'use client';

import Link from 'next/link';
import { ArrowLeft, Clock3 } from 'lucide-react';

const historyItems = [
  'Generated weekly operator summary',
  'Stored memory update from billing analysis',
  'Ran subscription leak review',
];

export default function HistoryPage() {
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

        <div className="rounded-full bg-slate-100 p-2.5 text-slate-500">
          <Clock3 className="h-5 w-5" />
        </div>
      </div>

      <section className="rounded-[22px] border border-black/[0.04] bg-white p-6 shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
        <h1 className="text-[2rem] font-semibold tracking-tight text-slate-900">
          History
        </h1>
        <p className="mt-2 text-[1rem] leading-relaxed text-slate-500">
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

        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-indigo-500 transition hover:text-indigo-600"
        >
          Return to dashboard
        </Link>
      </section>
    </main>
  );
}
