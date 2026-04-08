'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CircleDollarSign } from 'lucide-react';
import { BottomNav } from '../components/bottom-nav';
import { makeMessage, writeChatMessages, readChatMessages, CHAT_DRAFT_KEY } from '../lib/chat-store';
import { monthlySavingsEstimate, moneyAlerts, subscriptions } from '../lib/money-data';

export default function MoneyPage() {
  const router = useRouter();
  const [reviewed, setReviewed] = useState<Record<string, boolean>>({});

  const savings = useMemo(() => monthlySavingsEstimate(), []);

  const pushToChat = (text: string) => {
    const messages = readChatMessages();
    writeChatMessages([...messages, makeMessage('user', text, 'money')]);
    window.localStorage.setItem(CHAT_DRAFT_KEY, text);
    router.push('/chat');
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-md bg-[#f8f9fc] pb-32 shadow-[0_10px_32px_rgba(15,23,42,0.06)]">
      <header className="border-b border-black/[0.04] px-6 pt-8 pb-4">
        <h1 className="text-[2rem] font-semibold tracking-tight text-slate-900">Money Intelligence</h1>
        <p className="text-sm text-slate-500">Detect leaks, reduce waste, and optimize recurring spend.</p>
      </header>

      <section className="space-y-4 px-5 py-5">
        <article className="rounded-[20px] border border-emerald-100 bg-emerald-50 p-5 shadow-[0_2px_10px_rgba(16,185,129,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Savings Insight</p>
          <p className="mt-2 text-3xl font-bold text-emerald-900">€{savings.toFixed(0)} / month</p>
          <p className="mt-1 text-sm text-emerald-800">Potential savings identified by Money Agent.</p>
          <button type="button" onClick={() => pushToChat('Generate the exact cancellation plan for every waste subscription.')} className="mt-3 rounded-full bg-white px-4 py-2 text-sm font-semibold text-emerald-700">Review in chat</button>
        </article>

        <article className="rounded-[20px] border border-black/[0.04] bg-white p-5">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Subscriptions</h2>
          <div className="space-y-3">
            {subscriptions.map((item) => (
              <div key={item.id} className="rounded-2xl bg-slate-50 px-3 py-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-slate-800">{item.name}</p>
                    <p className="text-xs text-slate-500">€{item.price} / {item.cycle}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${item.status === 'active' ? 'bg-sky-100 text-sky-700' : 'bg-violet-100 text-violet-700'}`}>{item.status}</span>
                    {item.waste ? <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-600">Waste</span> : null}
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-slate-500">Renews {item.renewalDate}</p>
                  <button type="button" onClick={() => setReviewed((prev) => ({ ...prev, [item.id]: true }))} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-200">
                    {reviewed[item.id] ? 'Reviewed' : 'Review'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[20px] border border-amber-200 bg-amber-50 p-5">
          <h2 className="mb-3 text-lg font-semibold text-amber-900">Alerts</h2>
          <div className="space-y-2">
            {moneyAlerts.map((alert) => (
              <div key={alert.id} className="flex items-center gap-2 rounded-xl bg-white/60 px-3 py-2 text-sm text-amber-900">
                <AlertTriangle className="h-4 w-4" />
                {alert.text}
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={() => pushToChat('Cancel risky subscriptions and draft confirmation messages.')} className="rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-600">Cancel</button>
            <button type="button" onClick={() => pushToChat('Review all suspicious charges from this month in detail.')} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">Review</button>
          </div>
        </article>

        <article className="rounded-[20px] border border-black/[0.04] bg-white p-5">
          <div className="flex items-center gap-2 text-slate-700"><CircleDollarSign className="h-4 w-4" />Money intelligence uses your existing leak detection logic.</div>
        </article>
      </section>

      <BottomNav />
    </main>
  );
}
