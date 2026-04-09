'use client';

import { useEffect, useMemo } from 'react';
import { Bell, TriangleAlert } from 'lucide-react';
import { useAppStore } from '../store/app-store';

export default function AlertsPage() {
  const hydrated = useAppStore((s) => s.hydrated);
  const hydrate = useAppStore((s) => s.hydrate);
  const alerts = useAppStore((s) => s.alerts);
  const resolveAlert = useAppStore((s) => s.resolveAlert);
  const snoozeAlert = useAppStore((s) => s.snoozeAlert);
  const markAlertFalsePositive = useAppStore((s) => s.markAlertFalsePositive);
  const openAlertInChat = useAppStore((s) => s.openAlertInChat);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrate, hydrated]);

  const active = useMemo(() => alerts.filter((item) => !item.resolved), [alerts]);
  const resolved = useMemo(() => alerts.filter((item) => item.resolved), [alerts]);

  return (
    <main className="screen app-bg">
      <section className="card-surface p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-white/5 p-2.5 text-[#cde4ff]"><Bell className="h-5 w-5" /></div>
          <div>
            <h1 className="text-2xl font-semibold text-primary">Alerts</h1>
            <p className="text-sm text-secondary">Review, run analysis in chat, and resolve alert workflows.</p>
          </div>
        </div>

        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-secondary">Active alerts</h2>
        <div className="space-y-3">
          {active.length === 0 ? <div className="card-elevated px-4 py-4 text-sm text-secondary">No alerts right now.</div> : active.map((alert) => (
            <article key={alert.id} className="card-elevated px-4 py-4">
              <div className="mb-2 flex items-start gap-3">
                <div className="rounded-xl bg-white/5 p-2 text-[#cde4ff]"><TriangleAlert className="h-4 w-4" /></div>
                <div>
                  <p className="text-sm font-semibold text-primary">{alert.title}</p>
                  <p className="text-sm text-secondary">{alert.description}</p>
                  <p className="mt-1 text-xs text-secondary">{new Date(alert.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                <button onClick={() => openAlertInChat(alert.id, 'analyze')} type="button" className="btn-primary tap-feedback px-2 py-2 text-white">Analyze</button>
                <button onClick={() => openAlertInChat(alert.id, 'open')} type="button" className="btn-secondary tap-feedback px-2 py-2">Open in Chat</button>
                <button onClick={() => snoozeAlert(alert.id, 90)} type="button" className="btn-secondary tap-feedback px-2 py-2">Snooze</button>
                <button onClick={() => markAlertFalsePositive(alert.id)} type="button" className="btn-secondary tap-feedback px-2 py-2">False Positive</button>
                <button onClick={() => resolveAlert(alert.id)} type="button" className="btn-primary tap-feedback col-span-2 px-2 py-2 text-white">Resolve</button>
              </div>
            </article>
          ))}
        </div>

        <h2 className="mb-2 mt-5 text-sm font-semibold uppercase tracking-wide text-secondary">Resolved alerts</h2>
        <div className="space-y-2">
          {resolved.length === 0 ? <p className="card-elevated px-3 py-3 text-sm text-secondary">No resolved alerts yet.</p> : resolved.map((alert) => (
            <div key={alert.id} className="card-elevated px-3 py-3 text-sm text-secondary">{alert.title}</div>
          ))}
        </div>
      </section>
    </main>
  );
}
