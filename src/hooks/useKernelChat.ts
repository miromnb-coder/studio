"use client";

import { useState } from "react";
import {
  callKernelAgent,
  type KernelClientToolEvent,
} from "@/lib/call-kernel-agent";

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

function uid() {
  return Math.random().toString(36).slice(2);
}

export function useKernelChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [toolEvents, setToolEvents] = useState<KernelClientToolEvent[]>([]);

  function upsertToolEvent(next: KernelClientToolEvent) {
    setToolEvents((prev) => {
      const index = prev.findIndex((item) => item.id === next.id);

      if (index === -1) {
        return [...prev, next];
      }

      const clone = [...prev];
      clone[index] = next;
      return clone;
    });
  }

  async function sendMessage(input: string) {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: uid(),
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setStatus("starting");
    setStreamingText("");
    setToolEvents([]);

    try {
      await callKernelAgent(text, {
        mode: "agent",
        onEvent(event) {
          if (event.type === "status") {
            setStatus(event.value);
          }

          if (event.type === "delta") {
            setStreamingText((prev) => prev + event.text);
          }

          if (event.type === "tool_call") {
            upsertToolEvent(event.toolCall);
          }

          if (event.type === "tool_result") {
            upsertToolEvent(event.toolResult);
          }

          if (event.type === "done") {
            const finalAnswer = event.result.answer || "";

            const assistantMessage: ChatMessage = {
              id: uid(),
              role: "assistant",
              content: finalAnswer,
            };

            setMessages((prev) => [...prev, assistantMessage]);
            setStreamingText("");
          }

          if (event.type === "error") {
            setStatus("failed");
          }
        },
      });
    } catch {
      const failMessage: ChatMessage = {
        id: uid(),
        role: "assistant",
        content: "Something went wrong while running Kivo Kernel.",
      };

      setMessages((prev) => [...prev, failMessage]);
      setStreamingText("");
      setStatus("failed");
    } finally {
      setIsLoading(false);

      setTimeout(() => {
        setStatus("");
      }, 1200);
    }
  }

  return {
    messages,
    status,
    isLoading,
    streamingText,
    toolEvents,
    sendMessage,
  };
}
