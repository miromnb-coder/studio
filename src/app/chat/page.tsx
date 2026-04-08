'use client';

import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Send } from 'lucide-react';
import { BottomNav } from '../components/bottom-nav';
import { CHAT_DRAFT_KEY, ChatMessage, makeMessage, readChatMessages, writeChatMessages } from '../lib/chat-store';

const executionSteps = ['Running Money Agent…', 'Analyzing subscriptions…', 'Checking memory context…'];

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = readChatMessages();
    setMessages(stored);
    const draft = window.localStorage.getItem(CHAT_DRAFT_KEY);
    if (draft) {
      setInput(draft);
      window.localStorage.removeItem(CHAT_DRAFT_KEY);
    }
  }, []);

  useEffect(() => {
    writeChatMessages(messages);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!isSending) return;
    const timer = window.setInterval(() => {
      setStepIndex((prev) => (prev + 1) % executionSteps.length);
    }, 1200);
    return () => window.clearInterval(timer);
  }, [isSending]);

  const send = async () => {
    const text = input.trim();
    if (!text || isSending) return;

    const baseMessages = [...messages, makeMessage('user', text, 'chat')];
    setMessages(baseMessages);
    setInput('');
    setIsSending(true);

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: text,
          history: baseMessages
            .filter((item) => item.role !== 'system')
            .map((item) => ({ role: item.role === 'assistant' ? 'assistant' : 'user', content: item.content })),
          userId: 'system_anonymous',
        }),
      });

      if (!response.ok || !response.body) {
        const errorText = await response.text();
        setMessages((prev) => [...prev, makeMessage('assistant', errorText || 'Unable to complete this request.', 'chat')]);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';

      setMessages((prev) => [...prev, makeMessage('assistant', '', 'chat')]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true }).replace(/__METADATA__:[^\n]*\n?/g, '');
        if (!chunk) continue;

        assistantText += chunk;
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last && last.role === 'assistant') {
            copy[copy.length - 1] = { ...last, content: assistantText };
          }
          return copy;
        });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setMessages((prev) => [...prev, makeMessage('assistant', `Agent request failed: ${message}`, 'chat')]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-[#f8f9fc] pb-28 shadow-[0_10px_32px_rgba(15,23,42,0.06)]">
      <header className="border-b border-black/[0.04] px-6 pt-8 pb-4">
        <h1 className="text-[2rem] font-semibold tracking-tight text-slate-900">Chat</h1>
        <p className="text-sm text-slate-500">Advanced multi-agent conversation</p>
      </header>

      <section ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
        {messages.length === 0 ? <p className="text-center text-sm text-slate-400">Start a conversation to run your agents.</p> : null}
        {messages.map((message) => (
          <div key={message.id} className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${message.role === 'user' ? 'ml-auto bg-indigo-500 text-white' : 'bg-white text-slate-700 border border-black/[0.04]'}`}>
            {message.content || (isSending && message.role === 'assistant' ? 'Thinking…' : '')}
          </div>
        ))}
        {isSending ? <p className="text-xs font-medium text-indigo-500">{executionSteps[stepIndex]}</p> : null}
      </section>

      <section className="border-t border-black/[0.04] bg-white/95 px-5 py-4 backdrop-blur">
        <div className="flex items-end gap-2">
          <button type="button" className="rounded-full bg-slate-100 p-2 text-slate-500" aria-label="Attach image">
            <ImagePlus className="h-4 w-4" />
          </button>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            rows={2}
            placeholder="Message Operator..."
            className="flex-1 resize-none rounded-2xl border border-black/[0.05] bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none"
          />
          <button type="button" onClick={() => void send()} disabled={!input.trim() || isSending} className="rounded-full bg-indigo-500 p-2 text-white disabled:bg-slate-300">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </section>

      <BottomNav />
    </main>
  );
}
