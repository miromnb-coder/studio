'use client';

import { MessageSquare } from 'lucide-react';
import { BottomNav } from '../components/bottom-nav';

export default function ChatPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-md bg-[#f8fafc] px-5 py-6 pb-32 text-slate-900">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-[2rem] font-semibold tracking-tight text-slate-900">Chat</h1>

        <div className="rounded-full bg-indigo-50 p-2.5 text-indigo-500">
          <MessageSquare className="h-5 w-5" />
        </div>
      </div>

      <section className="rounded-[22px] border border-black/[0.04] bg-white p-6 shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
        <p className="text-[1rem] leading-relaxed text-slate-500">
          Continue conversations with your AI operator and review recent prompts.
        </p>

        <div className="mt-6 space-y-3">
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Agent: Ready to help you with analysis, automation, and summaries.
          </div>
          <div className="rounded-2xl bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
            You: Show me the most important financial alerts from this week.
          </div>
        </div>
      </section>

      <BottomNav />
    </main>
  );
}
