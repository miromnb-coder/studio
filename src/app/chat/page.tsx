"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useKernelChat } from "@/hooks/useKernelChat";
import { KivoAgentMessage } from "@/components/chat/kivo/KivoAgentMessage";

export default function ChatPage() {
  const [input, setInput] = useState("");

  const {
    messages,
    status,
    isLoading,
    sendMessage,
  } = useKernelChat();

  const scrollRef =
    useRef<HTMLDivElement>(null);

  const canSend = useMemo(() => {
    return (
      input.trim().length > 0 &&
      !isLoading
    );
  }, [input, isLoading]);

  async function handleSend() {
    const text = input.trim();

    if (!text || isLoading) return;

    setInput("");
    await sendMessage(text);
  }

  useEffect(() => {
    const el = scrollRef.current;

    if (!el) return;

    el.scrollTo({
      top: el.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, status]);

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden">
      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 pb-28 pt-4"
      >
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
          {messages.length === 0 && (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/70 backdrop-blur-xl">
              Welcome to Kivo Kernel.
              Ask anything to begin.
            </div>
          )}

          {messages.map((message) => {
            if (message.role === "user") {
              return (
                <div
                  key={message.id}
                  className="ml-auto max-w-[82%] rounded-3xl border border-white/10 bg-white/10 px-4 py-3 text-sm leading-7 text-white shadow-sm"
                >
                  {message.content}
                </div>
              );
            }

            return (
              <KivoAgentMessage
                key={message.id}
                content={message.content}
              />
            );
          })}

          {isLoading && (
            <KivoAgentMessage
              content="Kivo is thinking..."
              status={status}
            />
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="border-t border-white/10 bg-black/20 px-4 py-4 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-3xl items-end gap-3">
          <textarea
            rows={1}
            value={input}
            onChange={(e) =>
              setInput(e.target.value)
            }
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey
              ) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask Kivo..."
            className="max-h-40 min-h-[52px] flex-1 resize-none rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none"
          />

          <button
            onClick={handleSend}
            disabled={!canSend}
            className="h-[52px] rounded-3xl px-5 text-sm font-medium transition disabled:opacity-40 bg-cyan-400 text-black hover:scale-[1.02] active:scale-[0.98]"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
