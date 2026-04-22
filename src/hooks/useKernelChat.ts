"use client";

import { useState } from "react";
import { callKernelAgent } from "@/lib/call-kernel-agent";

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

    try {
      const result = await callKernelAgent(text, {
        mode: "agent",
        onEvent(event) {
          if (event.type === "status") {
            setStatus(event.value);
          }

          if (event.type === "delta") {
            setStreamingText((prev) => prev + event.text);
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

      if (result.answer && !messages.some((m) => m.content === result.answer)) {
        setStreamingText("");
      }
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
    sendMessage,
  };
}
