"use client";

import { Bell, Sparkles } from "lucide-react";
import { useUser } from "@/firebase";

export function TopBar() {
  const { user } = useUser();

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-sky-400 text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-3xl font-semibold tracking-[-0.03em] text-slate-900">MiroAI</span>
          <span className="rounded-xl bg-indigo-100 px-2 py-1 text-xs font-semibold text-indigo-600">PRO</span>
        </div>

        <div className="flex items-center gap-3">
          <button className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500">
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
          </button>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
            {user?.displayName?.charAt(0) || "M"}
          </div>
        </div>
      </div>
    </header>
  );
}
