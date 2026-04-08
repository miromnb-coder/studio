'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, CircleDollarSign } from 'lucide-react';
import { BottomNav } from '../components/bottom-nav';
import { makeMessage, readChatMessages, writeChatMessages } from '../lib/chat-store';

const subscriptions = [
  { name: 'StreamPlus', price: 14.99, cycle: 'monthly', waste: true },
  { name: 'Cloud Drive Pro', price: 7.99, cycle: 'monthly', waste: false },
  { name: 'Design Toolkit', price: 119, cycle: 'yearly', waste: true },
];

const alerts = ['Duplicate streaming services detected', 'Price increase expected next billing cycle'];

export default function MoneyPage() {
  const [reviewed, setReviewed] = useState<Record<string, boolean>>({});

  const savings = useMemo(() => subscriptions.filter((item) => item.waste).reduce((sum, item) => sum + (item.cycle === 'monthly' ? item.price : item.price / 12), 0), []);

  const pushToChat = (text: string) => {
    const messages = readChatMessages();
    writeChatMessages([...messages, makeMessage('user', text, 'money')]);
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-md bg-[#f8f9fc] pb-28 shadow-[0_10px_32px_rgba(15,23,42,0.06)]">
      <header className="border-b border-black/[0.04] px-6 pt-8 pb-4">
        <h1 className="text-[2rem] font-semibold tracking-tight text-slate-900">Money Intelligence</h1>
        <p className="text-sm text-slate-500">Detect leaks, reduce waste, and optimize recurring spend.</p>
      </header>

      <section className="space-y-4 px-5 py-5">
        <article className="rounded-[20px] border border-emerald-100 bg-emerald-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Savings Insight</p>
          <p className="mt-2 text-xl font-semibold text-emerald-900">You can save €{savings.toFixed(0)}/month</p>
          <button type="button" onClick={() => pushToChat('Generate the exact cancellation plan for the waste subscriptions.')} className="mt-3 rounded-full bg-white px-4 py-2 text-sm font-semibold text-emerald-700">Review</button>
        </article>

        <article className="rounded-[20px] border border-black/[0.04] bg-white p-5">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Subscriptions</h2>
          <div className="space-y-3">
            {subscriptions.map((item) => (
              <div key={item.name} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3">
                <div>
                  <p className="font-medium text-slate-800">{item.name}</p>
                  <p className="text-xs text-slate-500">€{item.price} / {item.cycle}</p>
                </div>
                <div className="flex items-center gap-2">
                  {item.waste ? <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-600">Waste</span> : null}
                  <button type="button" onClick={() => setReviewed((prev) => ({ ...prev, [item.name]: true }))} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                    {reviewed[item.name] ? 'Reviewed' : 'Review'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[20px] border border-black/[0.04] bg-white p-5">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Alerts</h2>
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div key={alert} className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
                <AlertTriangle className="h-4 w-4" />
                {alert}
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={() => pushToChat('Cancel risky subscriptions and draft confirmation messages.')} className="rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white">Cancel</button>
            <button type="button" onClick={() => pushToChat('Review all suspicious charges from this month in detail.')} className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">Review</button>
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
