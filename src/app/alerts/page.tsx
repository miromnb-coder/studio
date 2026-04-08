'use client';

import { Bell, TriangleAlert } from 'lucide-react';
import { BottomNav } from '../components/bottom-nav';

const alerts = [
  'Subscription renewal due in 3 days.',
  'Potential duplicate billing detected.',
  'Weekly alert digest is ready for review.',
];

export default function AlertsPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-md bg-[#f8fafc] px-5 py-6 pb-32 text-slate-900">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-[2rem] font-semibold tracking-tight text-slate-900">Alerts</h1>

        <div className="rounded-full bg-amber-50 p-2.5 text-amber-500">
          <Bell className="h-5 w-5" />
        </div>
      </div>

      <section className="rounded-[22px] border border-black/[0.04] bg-white p-6 shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
        <p className="text-[1rem] leading-relaxed text-slate-500">
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
      </section>

      <BottomNav />
    </main>
  );
}
