'use client';

import { useEffect, useMemo } from 'react';
import { Bell, TriangleAlert } from 'lucide-react';
import { useAppStore } from '../store/app-store';

function whyItMatters(description: string) {
  if (/renew|subscription/i.test(description)) return 'This could increase your monthly spend if not reviewed now.';
  if (/duplicate|double|similar charge/i.test(description)) return 'You may be paying twice for the same thing.';
  return 'Addressing this now can prevent avoidable cost or risk later.';
}

export default function AlertsPage() {
  const hydrated = useAppStore((s) => s.hydrated);
  const hydrate = useAppStore((s) => s.hydrate);
  const alerts = useAppStore((s) => s.alerts);
  const resolveAlert = useAppStore((s) => s.resolveAlert);
  const markAlertFalsePositive = useAppStore((s) => s.markAlertFalsePositive);
  const openAlertInChat = useAppStore((s) => s.openAlertInChat);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrate, hydrated]);

  const active = useMemo(() => alerts.filter((item) => !item.resolved), [alerts]);

  return (
    <main className="screen app-bg">
      <section className="rounded-2xl bg-[#f7f7f7] p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-[#ececec] p-2.5 text-[#333]"><Bell className="h-5 w-5" /></div>
          <div>
            <h1 className="text-2xl font-semibold text-primary">Alerts</h1>
            <p className="text-sm text-secondary">Important things that need attention, with suggested actions.</p>
          </div>
        </div>

        <div className="space-y-3">
          {active.length === 0 ? <div className="rounded-xl bg-[#f2f2f2] px-4 py-4 text-sm text-secondary">No alerts right now.</div> : active.map((alert) => (
            <article key={alert.id} className="rounded-xl bg-[#f2f2f2] px-4 py-4">
              <div className="mb-2 flex items-start gap-3">
                <div className="rounded-xl bg-[#e7e7e7] p-2 text-[#4a4a4a]"><TriangleAlert className="h-4 w-4" /></div>
                <div>
                  <p className="text-sm font-semibold text-primary">{alert.title}</p>
                  <p className="text-sm text-secondary">{alert.description}</p>
                  <p className="mt-2 text-xs font-medium text-[#444]">Why this matters: {whyItMatters(alert.description)}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
                <button onClick={() => openAlertInChat(alert.id, 'analyze')} type="button" className="btn-primary tap-feedback px-2 py-2">Fix this</button>
                <button onClick={() => markAlertFalsePositive(alert.id)} type="button" className="btn-secondary tap-feedback px-2 py-2">Ignore</button>
                <button onClick={() => openAlertInChat(alert.id, 'open')} type="button" className="btn-secondary tap-feedback px-2 py-2">Ask Kivo</button>
              </div>
              <button onClick={() => resolveAlert(alert.id)} type="button" className="mt-2 w-full rounded-lg bg-[#e9e9e9] px-2 py-2 text-xs text-[#555]">Mark resolved</button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
