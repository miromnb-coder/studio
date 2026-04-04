"use client";

import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { motion, AnimatePresence } from 'framer-motion';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full relative flex">
      <Sidebar />
      
      <div className="flex-1 flex flex-col relative z-10 min-w-0">
        <TopBar />
        <main className="flex-1 w-full max-w-7xl mx-auto px-6 md:px-12 pb-32 pt-24">
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Atmospheric Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-400/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
    </div>
  );
}