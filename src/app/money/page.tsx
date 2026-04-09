'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CircleDollarSign } from 'lucide-react';
import { makeMessage, writeChatMessages, readChatMessages, CHAT_DRAFT_KEY } from '../lib/chat-store';
import { monthlySavingsEstimate, moneyAlerts, subscriptions } from '../lib/money-data';
import { emitHistoryEvent } from '../lib/history-store';

export default function MoneyPage() {
  const router = useRouter();
  const [reviewed, setReviewed] = useState<Record<string, boolean>>({});

  const savings = useMemo(() => monthlySavingsEstimate(), []);

  const pushToChat = (text: string) => {
    const messages = readChatMessages();
    writeChatMessages([...messages, makeMessage('user', text, 'money')]);
    window.localStorage.setItem(CHAT_DRAFT_KEY, text);

    emitHistoryEvent({
      title: 'Chat prompt sent',
      description: text,
      type: 'chat',
      prompt: text,
      context: 'Sent from Money Intelligence.',
    });

    router.push('/chat');
  };

  return (
    <main className="screen app-bg">
      <header className="card-surface mb-4 px-6 pt-6 pb-4">
        <h1 className="text-[2rem] font-semibold tracking-tight text-primary">Money Intelligence</h1>
        <p className="text-sm text-secondary">Detect leaks, reduce waste, and optimize recurring spend.</p>
      </header>

      <section className="space-y-4">
        <article className="card-elevated p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#cde4ff]">Savings Insight</p>
          <p className="mt-2 text-3xl font-bold text-primary">€{savings.toFixed(0)} / month</p>
          <p className="mt-1 text-sm text-secondary">Potential savings identified by Money Agent.</p>
          <button type="button" onClick={() => pushToChat('Generate the exact cancellation plan for every waste subscription.')} className="btn-secondary mt-3 px-4 py-2 text-sm">Review in chat</button>
        </article>

        <article className="card-surface p-5">
          <h2 className="mb-3 text-lg font-semibold text-primary">Subscriptions</h2>
          <div className="space-y-3">
            {subscriptions.map((item) => (
              <div key={item.id} className="card-interactive rounded-2xl px-3 py-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-primary">{item.name}</p>
                    <p className="text-xs text-secondary">€{item.price} / {item.cycle}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="badge">{item.status}</span>
                    {item.waste ? <span className="badge badge-accent">Waste</span> : null}
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-secondary">Renews {item.renewalDate}</p>
                  <button type="button" onClick={() => setReviewed((prev) => ({ ...prev, [item.id]: true }))} className="btn-secondary tap-feedback px-3 py-1 text-xs">
                    {reviewed[item.id] ? 'Reviewed' : 'Review'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="card-surface p-5">
          <h2 className="mb-3 text-lg font-semibold text-primary">Alerts</h2>
          <div className="space-y-2">
            {moneyAlerts.map((alert) => (
              <div key={alert.id} className="card-elevated flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-primary">
                <AlertTriangle className="h-4 w-4 text-[#cde4ff]" />
                {alert.text}
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={() => pushToChat('Cancel risky subscriptions and draft confirmation messages.')} className="btn-primary tap-feedback px-4 py-2 text-sm">Cancel</button>
            <button type="button" onClick={() => pushToChat('Review all suspicious charges from this month in detail.')} className="btn-secondary tap-feedback px-4 py-2 text-sm">Review</button>
          </div>
        </article>

        <article className="card-surface p-5">
          <div className="flex items-center gap-2 text-secondary"><CircleDollarSign className="h-4 w-4" />Money intelligence uses your existing leak detection logic.</div>
        </article>
      </section>

    </main>
  );
}
