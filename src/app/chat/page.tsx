'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, LoaderCircle, MessageSquare, SendHorizonal } from 'lucide-react';
import {
  appendChatMessage,
  makeMessage,
  readChatDraft,
  readChatMessages,
  subscribeChatStore,
  updateChatMessage,
  writeChatDraft,
} from '../lib/chat-store';

type DisplayMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
};

const streamFallback = async (onChunk: (chunk: string) => void) => {
  const mock = [
    'I could not reach the live agent endpoint right now, ',
    'so I switched to local streaming fallback. ',
    'You can still continue the conversation and retry in a moment.',
  ];

  for (const chunk of mock) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    onChunk(chunk);
  }
};

export default function ChatPage() {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const syncFromStore = () => {
      const nextMessages = readChatMessages().map(({ id, role, content, createdAt }) => ({ id, role, content, createdAt }));
      setMessages(nextMessages);
      setDraft(readChatDraft());
    };

    syncFromStore();
    return subscribeChatStore(syncFromStore);
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!shouldAutoScroll) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, shouldAutoScroll]);

  const orderedMessages = useMemo(
    () => [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [messages],
  );

  const handleListScroll = () => {
    if (!listRef.current) return;
    const node = listRef.current;
    const distanceFromBottom = node.scrollHeight - node.scrollTop - node.clientHeight;
    setShouldAutoScroll(distanceFromBottom < 80);
  };

  const sendMessage = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content || isStreaming) return;

    const userMessage = makeMessage('user', content, 'chat');
    const assistantMessage = makeMessage('assistant', '', 'chat');

    appendChatMessage(userMessage);
    appendChatMessage(assistantMessage);
    writeChatDraft('');
    setIsStreaming(true);

    const history = [...readChatMessages()]
      .filter((message) => message.id !== assistantMessage.id)
      .map((message) => ({ role: message.role, content: message.content }));

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: content, history, userId: 'system_anonymous' }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`agent endpoint unavailable (${response.status})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const cleaned = chunk.replace(/__METADATA__:[^\n]*\n?/g, '');
        if (!cleaned) continue;

        assistantText += cleaned;
        updateChatMessage(assistantMessage.id, { content: assistantText });
      }

      if (!assistantText.trim()) {
        updateChatMessage(assistantMessage.id, { content: 'No response was produced.' });
      }
    } catch {
      let assistantText = '';
      await streamFallback((chunk) => {
        assistantText += chunk;
        updateChatMessage(assistantMessage.id, { content: assistantText });
      });
    } finally {
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-[#f8fafc] text-slate-900">
      <header className="sticky top-0 z-20 border-b border-black/[0.04] bg-white/95 px-5 py-4 backdrop-blur">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div className="rounded-full bg-indigo-50 p-2.5 text-indigo-500">
            <MessageSquare className="h-5 w-5" />
          </div>
        </div>
      </header>

      <section
        ref={listRef}
        onScroll={handleListScroll}
        className="flex-1 space-y-3 overflow-y-auto px-4 py-5 pb-36"
      >
        {orderedMessages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-5 text-sm text-slate-500">
            Start the conversation. Messages persist locally on this device.
          </div>
        ) : null}

        {orderedMessages.map((message) => (
          <article
            key={message.id}
            className={`animate-[fadeIn_220ms_ease-out] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-[0_3px_12px_rgba(15,23,42,0.05)] ${
              message.role === 'user'
                ? 'ml-8 bg-indigo-500 text-white'
                : 'mr-8 bg-white text-slate-700'
            }`}
          >
            {message.content || '…'}
          </article>
        ))}

        {isStreaming ? (
          <div className="mr-8 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm text-slate-500 shadow-[0_3px_12px_rgba(15,23,42,0.05)]">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Assistant is typing
          </div>
        ) : null}
      </section>

      <form
        onSubmit={sendMessage}
        className="sticky bottom-0 z-20 border-t border-black/[0.04] bg-white/95 px-4 pt-3 backdrop-blur"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}
      >
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
          <input
            ref={inputRef}
            value={draft}
            onChange={(event) => {
              const value = event.target.value;
              setDraft(value);
              writeChatDraft(value);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                void sendMessage(event);
              }
            }}
            placeholder="Message your operator"
            className="h-10 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!draft.trim() || isStreaming}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 text-white transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:bg-slate-300"
            aria-label="Send"
          >
            <SendHorizonal className="h-4 w-4" />
          </button>
        </div>
      </form>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </main>
  );
}
