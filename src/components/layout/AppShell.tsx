"use client";

import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { TopBar } from "./TopBar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F6F7FB]">
      <TopBar />
      <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-28 sm:px-6 lg:px-8">{children}</main>
      <BottomNav />
    </div>
  );
}
