'use client';

import Link from 'next/link';
import { ArrowLeft, Bell, Check, TriangleAlert } from 'lucide-react';
import { useAppStore, useSetPageOnMount } from '../lib/app-store';

export default function AlertsPage() {
  useSetPageOnMount('alerts');
  const { selectors, actions } = useAppStore();

  return (
    <main className="mx-auto min-h-screen w-full max-w-md bg-[#f8fafc] px-5 py-6 text-slate-900">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-[0_4px_14px_rgba(15,23,42,0.04)] transition hover:bg-slate-50"><ArrowLeft className="h-4 w-4" />Back</Link>
        <div className="rounded-full bg-amber-50 p-2.5 text-amber-500"><Bell className="h-5 w-5" /></div>
      </div>

      <section className="rounded-[22px] border border-black/[0.04] bg-white p-6 shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
        <h1 className="text-[2rem] font-semibold tracking-tight text-slate-900">Alerts</h1>
        <p className="mt-2 text-[1rem] leading-relaxed text-slate-500">Review important notifications and pending operator attention items.</p>

        <div className="mt-6 space-y-3">
          {selectors.alerts.map((alert) => (
            <div key={alert.id} className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-4">
              <div className="rounded-2xl bg-amber-50 p-2.5 text-amber-500"><TriangleAlert className="h-5 w-5" /></div>
              <div className="flex-1">
                <p className={`text-sm leading-relaxed ${alert.resolved ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{alert.message}</p>
              </div>
              {!alert.resolved && (
                <button type="button" onClick={() => actions.resolveAlert(alert.id)} className="rounded-full bg-emerald-50 p-2 text-emerald-600">
                  <Check className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
