'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Bell, TriangleAlert } from 'lucide-react';
import {
  AlertHistoryEvent,
  AlertRecord,
  isSnoozed,
  makeAlertHistoryEvent,
  persistAlertState,
  readAlertHistory,
  readAlertRecords,
  runAlertAnalysisInChat,
  sendAlertPromptToChat,
} from '../lib/alert-store';

export default function AlertsPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [history, setHistory] = useState<AlertHistoryEvent[]>([]);

  useEffect(() => {
    setAlerts(readAlertRecords());
    setHistory(readAlertHistory());
  }, []);

  const activeAlerts = useMemo(
    () => alerts.filter((alert) => !alert.resolved && !isSnoozed(alert)),
    [alerts],
  );

  const commitAction = (nextAlerts: AlertRecord[], event: AlertHistoryEvent) => {
    const nextHistory = [event, ...history];
    setAlerts(nextAlerts);
    setHistory(nextHistory);
    persistAlertState(nextAlerts, nextHistory);
  };

  const openInChat = (alert: AlertRecord) => {
    sendAlertPromptToChat(alert, 'Open this alert in chat and help me resolve it quickly.');
    commitAction(alerts, makeAlertHistoryEvent(alert.id, 'open_chat', `Opened \"${alert.title}\" in chat`));
    router.push('/chat');
  };

  const analyzeWithAI = (alert: AlertRecord) => {
    runAlertAnalysisInChat(alert);
    commitAction(alerts, makeAlertHistoryEvent(alert.id, 'analyze_ai', `Analyzed \"${alert.title}\" with AI`));
    router.push('/chat');
  };

  const snoozeAlert = (alert: AlertRecord) => {
    const snoozedUntil = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();
    const nextAlerts = alerts.map((item) => (item.id === alert.id ? { ...item, snoozedUntil } : item));
    commitAction(nextAlerts, makeAlertHistoryEvent(alert.id, 'snooze', `Snoozed \"${alert.title}\" for 24 hours`));
  };

  const resolveAlert = (alert: AlertRecord) => {
    const nextAlerts = alerts.map((item) => (item.id === alert.id ? { ...item, resolved: true } : item));
    commitAction(nextAlerts, makeAlertHistoryEvent(alert.id, 'resolve', `Marked \"${alert.title}\" as resolved`));
  };

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
        <h1 className="text-[2rem] font-semibold tracking-tight text-slate-900">Alerts</h1>
        <p className="mt-2 text-[1rem] leading-relaxed text-slate-500">
          Review important notifications and pending operator attention items.
        </p>

        <div className="mt-6 space-y-3">
          {activeAlerts.map((alert) => (
            <div key={alert.id} className="space-y-3 rounded-2xl bg-slate-50 px-4 py-4">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-amber-50 p-2.5 text-amber-500">
                  <TriangleAlert className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-relaxed text-slate-800">{alert.title}</p>
                  <p className="text-sm leading-relaxed text-slate-700">{alert.description}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => openInChat(alert)} className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200">Open in Chat</button>
                <button type="button" onClick={() => analyzeWithAI(alert)} className="rounded-full bg-indigo-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-600">Analyze with AI</button>
                <button type="button" onClick={() => snoozeAlert(alert)} className="rounded-full bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-900 transition hover:bg-amber-200">Snooze</button>
                <button type="button" onClick={() => resolveAlert(alert)} className="rounded-full bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-200">Mark resolved</button>
              </div>
            </div>
          ))}
          {activeAlerts.length === 0 ? (
            <div className="rounded-2xl bg-emerald-50 px-4 py-4 text-sm text-emerald-800">No active alerts. Everything is resolved or snoozed.</div>
          ) : null}
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
