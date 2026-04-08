'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUp, MessageSquare } from 'lucide-react';
import { useAppStore } from '../store/app-store';

export default function ChatPage() {
  const hydrated = useAppStore((s) => s.hydrated);
  const hydrate = useAppStore((s) => s.hydrate);
  const messages = useAppStore((s) => s.messages);
  const draftPrompt = useAppStore((s) => s.draftPrompt);
  const setDraftPrompt = useAppStore((s) => s.setDraftPrompt);
  const sendMessage = useAppStore((s) => s.sendMessage);
  const isAgentResponding = useAppStore((s) => s.isAgentResponding);
  const activeAgent = useAppStore((s) => s.activeAgent);

  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrate, hydrated]);

  useEffect(() => {
    setDraft(draftPrompt);
  }, [draftPrompt]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, isAgentResponding]);

  useEffect(() => {
    if (!hydrated) return;
    const shouldAutoSend = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('autosend') === '1';
    if (shouldAutoSend && draftPrompt.trim()) {
      sendMessage(draftPrompt);
      setDraftPrompt('');
      setDraft('');
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem('nova-operator-chat-draft');
        window.history.replaceState({}, '', '/chat');
      }
    }
  }, [draftPrompt, hydrated, sendMessage, setDraftPrompt]);

  const send = () => {
    if (!draft.trim()) return;
    sendMessage(draft);
    setDraftPrompt('');
    setDraft('');
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('nova-operator-chat-draft');
    }
  };

  const empty = useMemo(() => messages.length === 0, [messages]);

  return (
    <main className="screen relative bg-[#f8fafc] pb-44">
      <header className="surface-card mb-4 flex items-center gap-3 p-4">
        <div className="rounded-xl bg-indigo-50 p-2 text-indigo-500"><MessageSquare className="h-5 w-5" /></div>
        <div>
          <h1 className="text-xl font-semibold">Chat workspace</h1>
          <p className="text-sm text-slate-500">Continue tasks with the active agent in real time.</p>
        </div>
      </header>

      <section ref={listRef} className="max-h-[calc(100vh-260px)] space-y-3 overflow-y-auto pr-1">
        {empty ? (
          <div className="surface-card p-5 text-sm text-slate-500">
            No conversation yet. Start from Home quick actions or type your first task below.
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`message-appear max-w-[90%] rounded-2xl px-4 py-3 text-sm ${message.role === 'user' ? 'ml-auto bg-indigo-500 text-white' : 'surface-card bg-white text-slate-700'}`}>
              {message.content}
              <p className={`mt-1 text-[10px] ${message.role === 'user' ? 'text-indigo-100' : 'text-slate-400'}`}>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          ))
        )}

        {isAgentResponding ? (
          <div className="inline-flex items-center gap-2 rounded-2xl bg-indigo-50 px-4 py-3 text-sm text-indigo-600">
            <span className="agent-pulse inline-flex h-2 w-2 rounded-full bg-indigo-500" />
            {activeAgent ?? 'Agent'} is responding...
          </div>
        ) : null}
      </section>

      <div className="fixed bottom-[calc(74px+env(safe-area-inset-bottom))] left-1/2 z-30 w-full max-w-md -translate-x-1/2 px-5 pb-2 pt-2">
        <div className="surface-card flex items-end gap-2 p-2">
          <textarea value={draft} onChange={(e) => { setDraft(e.target.value); setDraftPrompt(e.target.value); }} rows={1} placeholder="Message agents..." className="max-h-28 flex-1 resize-none rounded-xl bg-slate-50 px-3 py-2 text-sm outline-none" />
          <button type="button" onClick={send} className="tap-feedback rounded-xl bg-indigo-500 p-2 text-white disabled:bg-slate-300" disabled={!draft.trim()} aria-label="Send message">
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>
    </main>
  );
}
