'use client';

import Link from 'next/link';
import { ArrowLeft, MessageSquare, Send } from 'lucide-react';
import { useAppStore, useSetPageOnMount } from '../lib/app-store';

export default function ChatPage() {
  useSetPageOnMount('chat');
  const { state, actions, selectors } = useAppStore();

  return (
    <main className="mx-auto min-h-screen w-full max-w-md bg-[#f8fafc] px-5 py-6 text-slate-900">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-[0_4px_14px_rgba(15,23,42,0.04)] transition hover:bg-slate-50"><ArrowLeft className="h-4 w-4" />Back</Link>
        <div className="rounded-full bg-indigo-50 p-2.5 text-indigo-500"><MessageSquare className="h-5 w-5" /></div>
      </div>

      <section className="rounded-[22px] border border-black/[0.04] bg-white p-6 shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
        <h1 className="text-[2rem] font-semibold tracking-tight text-slate-900">Chat</h1>
        <p className="mt-2 text-[1rem] leading-relaxed text-slate-500">Continue conversations with your AI operator and review recent prompts.</p>

        <div className="mt-6 space-y-3">
          {selectors.messages.slice(-8).map((message) => (
            <div key={message.id} className={`rounded-2xl px-4 py-3 text-sm ${message.role === 'user' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-50 text-slate-600'}`}>
              {message.role === 'assistant' ? 'Agent' : message.role === 'user' ? 'You' : 'System'}: {message.content}
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-2xl bg-slate-50 p-3">
          <textarea value={state.ui.promptInput} onChange={(e) => actions.setPromptInput(e.target.value)} rows={3} placeholder="Ask the operator..." className="w-full resize-none bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400" />
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={() => {
                actions.sendMessage(state.ui.promptInput, 'chat');
                actions.runAgentsForIntent(state.ui.promptInput);
              }}
              className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white"
            >
              <Send className="h-4 w-4" />Send
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
