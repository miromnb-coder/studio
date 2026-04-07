"use client";

import { ReactNode } from "react";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { AnimatePresence, motion } from "framer-motion";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-[#F6F7FB] text-slate-900">
      <TopBar />
      <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-20 sm:px-6 md:pb-10">
        <AnimatePresence mode="wait">
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      <BottomNav />
    </div>
  );
}
