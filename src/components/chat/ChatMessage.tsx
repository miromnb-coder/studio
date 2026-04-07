"use client";

import { cn } from "@/lib/utils";

export type ChatMessageItem = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: number;
};

export function ChatMessage({ message }: { message: ChatMessageItem }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 text-[14px] leading-6 shadow-sm",
          isUser
            ? "bg-slate-900 text-white"
            : "border border-slate-200/80 bg-white text-slate-700"
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}
