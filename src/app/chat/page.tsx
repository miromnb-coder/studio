'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowLeft, MessageSquare, Send } from 'lucide-react';
import { CHAT_DRAFT_KEY, makeMessage, readChatMessages, writeChatMessages } from '../lib/chat-store';
import { emitHistoryEvent } from '../lib/history-store';

export default function ChatPage() {
  const [messages, setMessages] = useState(() => readChatMessages());
  const [prompt, setPrompt] = useState(() => {
    if (typeof window === 'undefined') return '';
    return window.localStorage.getItem(CHAT_DRAFT_KEY) ?? '';
  });

  const canSend = useMemo(() => prompt.trim().length > 0, [prompt]);

  const send = () => {
    const value = prompt.trim();
    if (!value) return;

    const user = makeMessage('user', value, 'chat');
    const assistant = makeMessage('assistant', `On it — I am processing: "${value}".`, 'chat');
    const next = [...messages, user, assistant];

    setMessages(next);
    writeChatMessages(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(CHAT_DRAFT_KEY, '');
    }

    emitHistoryEvent({
      title: 'Chat prompt sent',
      description: value,
      type: 'chat',
      prompt: value,
      context: 'Sent from chat page.',
    });

    emitHistoryEvent({
      title: 'Chat response generated',
      description: assistant.content,
      type: 'chat',
      prompt: value,
      context: assistant.content,
    });

    setPrompt('');
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-md bg-[#f8fafc] px-5 py-6 text-slate-900">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-[0_4px_14px_rgba(15,23,42,0.04)] transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <div className="rounded-full bg-indigo-50 p-2.5 text-indigo-500">
          <MessageSquare className="h-5 w-5" />
        </div>
      </div>

      <section className="rounded-[22px] border border-black/[0.04] bg-white p-6 shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
        <h1 className="text-[2rem] font-semibold tracking-tight text-slate-900">Chat</h1>
        <p className="mt-2 text-[1rem] leading-relaxed text-slate-500">
          Continue conversations with your AI operator and review recent prompts.
        </p>

        <div className="mt-6 space-y-3">
          {messages.length ? (
            messages.map((message) => (
              <div
                key={message.id}
                className={`rounded-2xl px-4 py-3 text-sm ${
                  message.role === 'user'
                    ? 'bg-indigo-50 text-indigo-700'
                    : message.role === 'assistant'
                    ? 'bg-slate-50 text-slate-700'
                    : 'bg-amber-50 text-amber-800'
                }`}
              >
                {message.role === 'user' ? 'You' : message.role === 'assistant' ? 'Agent' : 'System'}: {message.content}
              </div>
            ))
          ) : (
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Agent: Ready to help you with analysis, automation, and summaries.
            </div>
          )}
        </div>

        <div className="mt-4 rounded-2xl border border-black/[0.05] bg-slate-50 p-3">
          <textarea
            rows={3}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Type your message..."
            className="w-full resize-none bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              disabled={!canSend}
              onClick={send}
              className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <Send className="h-4 w-4" />
              Send
            </button>
          </div>
        </div>

        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-indigo-500 transition hover:text-indigo-600"
        >
          Return to dashboard
        </Link>
      </section>
    </main>
  );
}
