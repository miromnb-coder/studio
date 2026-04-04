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
              key="content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Atmospheric visionOS Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div 
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/5 blur-[120px] rounded-full" 
        />
        <motion.div 
          animate={{
            x: [0, -40, 0],
            y: [0, -20, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-400/5 blur-[120px] rounded-full" 
        />
      </div>
    </div>
  );
}
