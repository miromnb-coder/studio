'use client';

import Link from 'next/link';
import { ArrowLeft, Bell, TriangleAlert } from 'lucide-react';

const alerts = [
  'Subscription renewal due in 3 days.',
  'Potential duplicate billing detected.',
  'Weekly alert digest is ready for review.',
];

export default function AlertsPage() {
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

        <div className="rounded-full bg-amber-50 p-2.5 text-amber-500">
          <Bell className="h-5 w-5" />
        </div>
      </div>

      <section className="rounded-[22px] border border-black/[0.04] bg-white p-6 shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
        <h1 className="text-[2rem] font-semibold tracking-tight text-slate-900">
          Alerts
        </h1>
        <p className="mt-2 text-[1rem] leading-relaxed text-slate-500">
          Review important notifications and pending operator attention items.
        </p>

        <div className="mt-6 space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert}
              className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-4"
            >
              <div className="rounded-2xl bg-amber-50 p-2.5 text-amber-500">
                <TriangleAlert className="h-5 w-5" />
              </div>
              <p className="text-sm leading-relaxed text-slate-700">{alert}</p>
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
