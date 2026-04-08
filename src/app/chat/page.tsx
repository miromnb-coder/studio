'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUp, LoaderCircle, MessageSquare, RefreshCw } from 'lucide-react';
import { useAppStore } from '../store/app-store';

export default function ChatPage() {
  const hydrated = useAppStore((s) => s.hydrated);
  const hydrate = useAppStore((s) => s.hydrate);
  const messages = useAppStore((s) => s.messages);
  const draftPrompt = useAppStore((s) => s.draftPrompt);
  const setDraftPrompt = useAppStore((s) => s.setDraftPrompt);
  const sendMessage = useAppStore((s) => s.sendMessage);
  const retryLastPrompt = useAppStore((s) => s.retryLastPrompt);
  const isAgentResponding = useAppStore((s) => s.isAgentResponding);
  const activeAgent = useAppStore((s) => s.activeAgent);
  const activeSteps = useAppStore((s) => s.activeSteps);
  const streamError = useAppStore((s) => s.streamError);

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
  }, [messages, isAgentResponding, activeSteps]);

  useEffect(() => {
    if (!hydrated) return;
    const shouldAutoSend = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('autosend') === '1';
    if (shouldAutoSend && draftPrompt.trim()) {
      void sendMessage(draftPrompt);
      setDraftPrompt('');
      setDraft('');
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem('nova-operator-chat-draft');
        window.history.replaceState({}, '', '/chat');
      }
    }
  }, [draftPrompt, hydrated, sendMessage, setDraftPrompt]);

  const send = async () => {
    if (!draft.trim() || isAgentResponding) return;
    await sendMessage(draft);
    setDraftPrompt('');
    setDraft('');
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('nova-operator-chat-draft');
    }
  };

  const empty = useMemo(() => messages.length === 0, [messages]);

  return (
    <main className="screen relative overflow-hidden bg-slate-950 pb-48 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(99,102,241,0.34),transparent_42%),radial-gradient(circle_at_80%_20%,rgba(56,189,248,0.24),transparent_40%)]" />
      <header className="glass-dark mb-4 flex items-center gap-3 p-4">
        <div className="rounded-xl bg-indigo-500/20 p-2 text-indigo-200"><MessageSquare className="h-5 w-5" /></div>
        <div>
          <h1 className="text-xl font-semibold text-white">Operator Chat</h1>
          <p className="text-sm text-slate-300">Live streaming with staged agent workflows.</p>
        </div>
      </header>

      <section ref={listRef} className="relative z-10 max-h-[calc(100vh-300px)] space-y-3 overflow-y-auto pr-1">
        {empty ? (
          <div className="glass-dark p-5 text-sm text-slate-300">
            No conversation yet. Start from Home quick actions or type your first task below.
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`message-appear max-w-[92%] rounded-2xl px-4 py-3 text-sm ${message.role === 'user' ? 'ml-auto bg-indigo-500 text-white shadow-[0_10px_22px_rgba(79,70,229,0.35)]' : 'glass-dark text-slate-100'}`}>
              <p className="whitespace-pre-wrap">{message.content || (message.isStreaming ? '…' : '')}</p>
              {message.isStreaming ? (
                <div className="mt-2 inline-flex items-center gap-2 text-[11px] text-indigo-200">
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> streaming
                </div>
              ) : null}
              {message.error ? <p className="mt-2 text-[11px] text-rose-300">{message.error}</p> : null}
              <p className={`mt-1 text-[10px] ${message.role === 'user' ? 'text-indigo-100' : 'text-slate-400'}`}>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          ))
        )}

        {isAgentResponding ? (
          <div className="glass-dark space-y-2 rounded-2xl px-4 py-3 text-sm text-slate-200">
            <div className="inline-flex items-center gap-2">
              <span className="agent-pulse inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              {activeAgent ?? 'Agent'} is running...
            </div>
            <div className="space-y-1 text-xs text-slate-300">
              {activeSteps.length === 0 ? <p>Preparing staged workflow…</p> : activeSteps.map((step) => (
                <p key={step.id} className="flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${step.status === 'completed' ? 'bg-emerald-300' : 'bg-indigo-300 animate-pulse'}`} />
                  {step.label}
                </p>
              ))}
            </div>
          </div>
        ) : null}

        {streamError ? (
          <div className="glass-dark rounded-2xl border border-rose-400/40 p-3 text-xs text-rose-200">
            {streamError}
            <button type="button" onClick={() => void retryLastPrompt()} className="ml-2 inline-flex items-center gap-1 rounded-full bg-rose-400/20 px-2 py-1 font-semibold text-rose-100">
              <RefreshCw className="h-3 w-3" /> Retry
            </button>
          </div>
        ) : null}
      </section>

      <div className="fixed bottom-[calc(74px+env(safe-area-inset-bottom))] left-1/2 z-30 w-full max-w-md -translate-x-1/2 px-5 pb-2 pt-2">
        <div className="glass-dark flex items-end gap-2 p-2">
          <textarea value={draft} onChange={(e) => { setDraft(e.target.value); setDraftPrompt(e.target.value); }} rows={1} placeholder="Message agents..." className="max-h-28 flex-1 resize-none rounded-xl bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-300" />
          <button type="button" onClick={() => void send()} className="tap-feedback rounded-xl bg-indigo-500 p-2 text-white disabled:bg-slate-500" disabled={!draft.trim() || isAgentResponding} aria-label="Send message">
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>
    </main>
  );
}
