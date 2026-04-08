'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ImagePlus, Send, Sparkles } from 'lucide-react';
import { BottomNav } from '../components/bottom-nav';
import { CHAT_DRAFT_KEY, ChatMessage, makeMessage, readChatMessages, writeAgentRuntime, writeChatMessages } from '../lib/chat-store';

const executionSteps = ['Running Money Agent', 'Analyzing subscriptions', 'Generating insights'];

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [dots, setDots] = useState('.');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(readChatMessages());
    const draft = window.localStorage.getItem(CHAT_DRAFT_KEY);
    if (draft) {
      setInput(draft);
      window.localStorage.removeItem(CHAT_DRAFT_KEY);
    }
  }, []);

  useEffect(() => {
    writeChatMessages(messages);
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (!isSending) return;
    const stepTimer = window.setInterval(() => setStepIndex((prev) => (prev + 1) % executionSteps.length), 1300);
    const dotsTimer = window.setInterval(() => setDots((prev) => (prev.length >= 3 ? '.' : `${prev}.`)), 420);
    return () => {
      window.clearInterval(stepTimer);
      window.clearInterval(dotsTimer);
      setDots('.');
    };
  }, [isSending]);

  const grouped = useMemo(() => {
    return messages.reduce<Array<{ type: 'user' | 'assistant'; items: ChatMessage[] }>>((acc, message) => {
      const type = message.role === 'user' ? 'user' : 'assistant';
      const last = acc[acc.length - 1];
      if (last && last.type === type) {
        last.items.push(message);
        return acc;
      }
      acc.push({ type, items: [message] });
      return acc;
    }, []);
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || isSending) return;

    const baseMessages = [...messages, makeMessage('user', text, 'chat')];
    setMessages(baseMessages);
    setInput('');
    setIsSending(true);
    writeAgentRuntime({ status: 'running', activeAgent: 'Money Agent' });

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: text,
          history: baseMessages.filter((item) => item.role !== 'system').map((item) => ({ role: item.role === 'assistant' ? 'assistant' : 'user', content: item.content })),
          userId: 'system_anonymous',
        }),
      });

      if (!response.ok || !response.body) {
        setMessages((prev) => [...prev, makeMessage('assistant', 'Unable to complete this request right now.', 'chat')]);
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
          if (last && last.role === 'assistant') copy[copy.length - 1] = { ...last, content: assistantText };
          return copy;
        });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setMessages((prev) => [...prev, makeMessage('assistant', `Agent request failed: ${message}`, 'chat')]);
    } finally {
      setIsSending(false);
      writeAgentRuntime({ status: 'idle', activeAgent: null });
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-[#f8f9fc] pb-28 shadow-[0_10px_32px_rgba(15,23,42,0.06)]">
      <header className="border-b border-black/[0.04] px-6 pt-8 pb-4">
        <h1 className="text-[2rem] font-semibold tracking-tight text-slate-900">Chat</h1>
        <p className="text-sm text-slate-500">AI operator interface with live agent execution</p>
      </header>

      <section ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {messages.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-200 p-4 text-center text-sm text-slate-400">No messages yet. Ask Operator to start an agent workflow.</p> : null}

        {isSending ? (
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
            <p className="font-semibold">Agent Steps</p>
            <p className="mt-1">→ {executionSteps[stepIndex]}</p>
            <p className="mt-1 inline-flex items-center gap-1 text-indigo-500"><Sparkles className="h-3 w-3" />Typing{dots}</p>
          </div>
        ) : null}

        {grouped.map((group, index) => (
          <div key={`${group.type}-${index}`} className={`space-y-2 ${group.type === 'user' ? 'items-end' : 'items-start'}`}>
            {group.items.map((message) => (
              <div key={message.id} className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${group.type === 'user' ? 'ml-auto bg-indigo-500 text-white' : 'border border-black/[0.04] bg-white text-slate-700'}`}>
                {message.content || (isSending && group.type === 'assistant' ? `Thinking${dots}` : '')}
              </div>
            ))}
          </div>
        ))}
      </section>

      <section className="border-t border-black/[0.04] bg-white/95 px-5 py-4 backdrop-blur">
        <div className="flex items-end gap-2">
          <button type="button" className="rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200" aria-label="Attach image">
            <ImagePlus className="h-4 w-4" />
          </button>
          <textarea value={input} onChange={(event) => setInput(event.target.value)} rows={2} placeholder="Message Operator..." className="flex-1 resize-none rounded-2xl border border-black/[0.05] bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none" />
          <button type="button" onClick={() => void send()} disabled={!input.trim() || isSending} className="rounded-full bg-indigo-500 p-2 text-white transition hover:bg-indigo-600 disabled:bg-slate-300">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </section>

      <BottomNav />
    </main>
  );
}
