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
    const shouldAutoSend =
      typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('autosend') === '1';
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
    <main className="screen app-bg pb-44">
      <header className="card-surface mb-3 flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-white/5 p-2 text-[#cde4ff]">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-primary">Chat</h1>
            <p className="text-xs text-secondary">System conversation + live agent orchestration</p>
          </div>
        </div>
        <span className="badge badge-accent">{isAgentResponding ? 'Live' : 'Standby'}</span>
      </header>

      <div className="card-surface mb-3 flex items-center justify-between gap-2 px-3 py-2 text-xs">
        <span className="inline-flex items-center gap-2 text-secondary">
          <span className={`h-2 w-2 rounded-full ${isAgentResponding ? 'agent-pulse bg-[#5da9ff]' : 'bg-white/40'}`} />
          Agent status
        </span>
        <span className="badge">{activeAgent ?? 'No active agent'}</span>
      </div>

      <section
        ref={listRef}
        className="relative z-10 max-h-[calc(100vh-290px)] space-y-3 overflow-y-auto pb-2"
      >
        {empty ? (
          <div className="card-surface px-4 py-4 text-sm text-secondary">
            No conversation yet. Start from Home quick actions or type your first task below.
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`message-appear max-w-[96%] px-4 py-3 text-sm ${
                message.role === 'user' ? 'card-elevated ml-auto border-white/10' : 'card-surface'
              }`}
            >
              <p className="whitespace-pre-wrap text-primary">{message.content || (message.isStreaming ? '…' : '')}</p>
              {message.isStreaming ? (
                <div className="mt-2 inline-flex items-center gap-2 text-[11px] text-[#cde4ff]">
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> streaming
                </div>
              ) : null}
              {message.error ? <p className="mt-2 text-[11px] text-rose-300">{message.error}</p> : null}
              <p className="mt-1 text-[10px] text-secondary">
                {new Date(message.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          ))
        )}

        {isAgentResponding ? (
          <div className="card-surface space-y-2 px-4 py-3 text-sm">
            <div className="inline-flex items-center gap-2 text-primary">
              <span className="agent-pulse inline-flex h-2 w-2 rounded-full bg-[#5da9ff]" />
              {activeAgent ?? 'Agent'} is running...
            </div>
            <div className="space-y-1 text-xs text-secondary">
              {activeSteps.length === 0 ? (
                <p>Preparing staged workflow…</p>
              ) : (
                activeSteps.map((step) => (
                  <p key={step.id} className="flex items-center gap-2">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        step.status === 'completed' ? 'bg-[#7c7cff]' : 'animate-pulse bg-[#5da9ff]'
                      }`}
                    />
                    {step.label}
                  </p>
                ))
              )}
            </div>
          </div>
        ) : null}

        {streamError ? (
          <div className="card-surface rounded-[14px] border border-rose-300/30 px-3 py-3 text-xs text-rose-200">
            {streamError}
            <button
              type="button"
              onClick={() => void retryLastPrompt()}
              className="btn-secondary ml-2 inline-flex items-center gap-1 px-2 py-1 text-rose-100"
            >
              <RefreshCw className="h-3 w-3" /> Retry
            </button>
          </div>
        ) : null}
      </section>

      <div className="fixed bottom-[calc(74px+env(safe-area-inset-bottom))] left-1/2 z-30 w-full max-w-md -translate-x-1/2 px-4 pb-2 pt-2">
        <div className="card-elevated flex items-end gap-2 p-2">
          <textarea
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setDraftPrompt(e.target.value);
            }}
            rows={1}
            placeholder="Enter command for agents..."
            className="system-input max-h-28 flex-1 resize-none px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => void send()}
            className="btn-primary tap-feedback p-2.5 disabled:opacity-50"
            disabled={!draft.trim() || isAgentResponding}
            aria-label="Send message"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>
    </main>
  );
}
