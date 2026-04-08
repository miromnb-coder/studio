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
    <main className="screen bg-[#f8fafc]">
      <section className="surface-card p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-amber-50 p-2.5 text-amber-500"><Bell className="h-5 w-5" /></div>
          <div>
            <h1 className="text-2xl font-semibold">Alerts</h1>
            <p className="text-sm text-slate-500">Review, run analysis in chat, and resolve alert workflows.</p>
          </div>
        </div>

        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Active alerts</h2>
        <div className="space-y-3">
          {active.length === 0 ? <div className="rounded-2xl bg-emerald-50 px-4 py-4 text-sm text-emerald-800">No alerts right now.</div> : active.map((alert) => (
            <article key={alert.id} className="rounded-2xl bg-slate-50 px-4 py-4">
              <div className="mb-2 flex items-start gap-3">
                <div className="rounded-xl bg-amber-50 p-2 text-amber-500"><TriangleAlert className="h-4 w-4" /></div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{alert.title}</p>
                  <p className="text-sm text-slate-600">{alert.description}</p>
                  <p className="mt-1 text-xs text-slate-400">{new Date(alert.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                <button onClick={() => openAlertInChat(alert.id, 'analyze')} type="button" className="tap-feedback rounded-xl bg-indigo-500 px-2 py-2 text-white">Analyze</button>
                <button onClick={() => openAlertInChat(alert.id, 'open')} type="button" className="tap-feedback rounded-xl bg-slate-900 px-2 py-2 text-white">Open in Chat</button>
                <button onClick={() => snoozeAlert(alert.id, 90)} type="button" className="tap-feedback rounded-xl bg-white px-2 py-2 text-slate-700">Snooze</button>
                <button onClick={() => markAlertFalsePositive(alert.id)} type="button" className="tap-feedback rounded-xl bg-white px-2 py-2 text-slate-700">False Positive</button>
                <button onClick={() => resolveAlert(alert.id)} type="button" className="tap-feedback col-span-2 rounded-xl bg-emerald-500 px-2 py-2 text-white">Resolve</button>
              </div>
            </article>
          ))}
        </div>

        <h2 className="mb-2 mt-5 text-sm font-semibold uppercase tracking-wide text-slate-500">Resolved alerts</h2>
        <div className="space-y-2">
          {resolved.length === 0 ? <p className="rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-500">No resolved alerts yet.</p> : resolved.map((alert) => (
            <div key={alert.id} className="rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-600">{alert.title}</div>
          ))}
        </div>
      </section>
    </main>
  );
}
