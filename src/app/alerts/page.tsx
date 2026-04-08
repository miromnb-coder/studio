'use client';

import { Bell, TriangleAlert } from 'lucide-react';

const alerts = [
  'Subscription renewal due in 3 days.',
  'Potential duplicate billing detected.',
  'Weekly alert digest is ready for review.',
];

export default function AlertsPage() {
  useSetPageOnMount('alerts');
  const { selectors, actions } = useAppStore();

  return (
    <main className="screen bg-[#f8fafc]">
      <section className="surface-card p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-amber-50 p-2.5 text-amber-500"><Bell className="h-5 w-5" /></div>
          <div>
            <h1 className="text-2xl font-semibold">Alerts</h1>
            <p className="text-sm text-slate-500">Important notifications requiring attention.</p>
          </div>
        </div>

        <div className="space-y-3">
          {alerts.map((alert) => (
            <div key={alert} className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-4">
              <div className="rounded-xl bg-amber-50 p-2 text-amber-500"><TriangleAlert className="h-4 w-4" /></div>
              <p className="text-sm text-slate-700">{alert}</p>
            </div>
          ))}
        </div>
      </section>

      <BottomNav />
    </main>
  );
}
