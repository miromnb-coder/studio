'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUp, Plus, RefreshCw, Mic } from 'lucide-react';
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
  }, [messages, isAgentResponding]);

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
    if (typeof window !== 'undefined') window.sessionStorage.removeItem('nova-operator-chat-draft');
  };

  const empty = useMemo(() => messages.length === 0, [messages]);
  const activeAssistantMessage = [...messages].reverse().find((m) => m.role === 'assistant');
  const showTyping = isAgentResponding && !!activeAssistantMessage && !activeAssistantMessage.content;

  return (
    <main className="screen app-bg pb-44">
      <header className="mb-4 px-1 pt-1">
        <h1 className="text-xl font-semibold text-primary">Kivo</h1>
        <p className="text-sm text-secondary">Your personal AI assistant</p>
      </header>

      <section ref={listRef} className="relative z-10 max-h-[calc(100vh-250px)] space-y-4 overflow-y-auto pb-2">
        {empty ? (
          <div className="px-1 py-6 text-sm text-secondary">Ask anything. Kivo will think and help you move forward.</div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`message-appear max-w-[95%] ${message.role === 'user' ? 'ml-auto' : ''}`}>
              <div className={message.role === 'user' ? 'ml-auto max-w-[90%] rounded-2xl bg-[#ececec] px-3.5 py-2.5 text-sm text-[#1c1c1c]' : 'px-1 py-1 text-[15px] leading-7 text-primary'}>
                {message.content || (message.isStreaming ? ' ' : '')}
              </div>
            </div>
          ))
        )}

        {showTyping ? (
          <div className="px-1 pt-2 text-sm text-secondary">
            <div className="mb-1 inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#777]" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#777] [animation-delay:120ms]" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#777] [animation-delay:240ms]" />
            </div>
            <p className="animate-pulse text-xs">Thinking…</p>
          </div>
        ) : null}

        {streamError ? (
          <div className="rounded-xl border border-black/10 bg-[#f7f7f7] px-3 py-3 text-sm text-[#222]">
            Something went wrong. Please try again.
            <button type="button" onClick={() => void retryLastPrompt()} className="btn-secondary ml-2 inline-flex items-center gap-1 px-2 py-1 text-xs">
              <RefreshCw className="h-3 w-3" /> Retry
            </button>
          </div>
        ) : null}
      </section>

      <div className="fixed bottom-[calc(74px+env(safe-area-inset-bottom))] left-1/2 z-30 w-full max-w-md -translate-x-1/2 px-4 pb-2 pt-2">
        <div className="flex items-end gap-2 rounded-[22px] border border-black/10 bg-[#f7f7f7] p-2 shadow-sm">
          <button type="button" className="tap-feedback rounded-full p-2 text-secondary" aria-label="Add attachment">
            <Plus className="h-4 w-4" />
          </button>
          <textarea
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setDraftPrompt(e.target.value);
            }}
            rows={1}
            placeholder="Message Kivo"
            className="system-input max-h-28 flex-1 resize-none border-none bg-transparent px-2 py-2 text-sm"
          />
          <button type="button" className="tap-feedback rounded-full p-2 text-secondary" aria-label="Voice input">
            <Mic className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => void send()} className="btn-primary tap-feedback rounded-full p-2.5 disabled:opacity-50" disabled={!draft.trim() || isAgentResponding} aria-label="Send message">
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>
    </main>
  );
}
