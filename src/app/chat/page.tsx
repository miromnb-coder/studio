'use client';

import { useState } from 'react';
import { ArrowUp, MessageSquare } from 'lucide-react';

const seedMessages = [
  { role: 'agent', text: 'Ready to help you with analysis, automation, and summaries.' },
  { role: 'user', text: 'Show me the most important financial alerts from this week.' },
];

export default function ChatPage() {
  const [messages, setMessages] = useState(seedMessages);
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setDraft('');
    setTyping(true);

    window.setTimeout(() => {
      setMessages((prev) => [...prev, { role: 'agent', text: 'Working on it now. I will summarize key actions next.' }]);
      setTyping(false);
    }, 900);
  };

  return (
    <main className="screen relative bg-[#f8fafc] pb-44">
      <header className="surface-card mb-4 flex items-center gap-3 p-4">
        <div className="rounded-xl bg-indigo-50 p-2 text-indigo-500"><MessageSquare className="h-5 w-5" /></div>
        <div>
          <h1 className="text-xl font-semibold">Chat</h1>
          <p className="text-sm text-slate-500">Live thread with your operator agents.</p>
        </div>
      </header>

      <section className="space-y-3">
        {messages.map((message, idx) => (
          <div key={`${message.text}-${idx}`} className={`message-appear max-w-[88%] rounded-2xl px-4 py-3 text-sm ${message.role === 'user' ? 'ml-auto bg-indigo-500 text-white' : 'bg-white text-slate-700 surface-card'}`}>
            {message.text}
          </div>
        ))}

        {typing ? (
          <div className="inline-flex items-center gap-2 rounded-2xl bg-indigo-50 px-4 py-3 text-sm text-indigo-600">
            <span className="agent-pulse inline-flex h-2 w-2 rounded-full bg-indigo-500" /> Agent is typing...
          </div>
        ) : null}
      </section>

      <div className="glass fixed bottom-[calc(74px+env(safe-area-inset-bottom))] left-1/2 z-30 w-full max-w-md -translate-x-1/2 px-5 pb-2 pt-2">
        <div className="surface-card flex items-end gap-2 p-2">
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={1} placeholder="Message agents..." className="max-h-28 flex-1 resize-none rounded-xl bg-slate-50 px-3 py-2 text-sm" />
          <button type="button" onClick={send} className="tap-feedback rounded-xl bg-indigo-500 p-2 text-white disabled:bg-slate-300" disabled={!draft.trim()} aria-label="Send message">
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>
    </main>
  );
}
