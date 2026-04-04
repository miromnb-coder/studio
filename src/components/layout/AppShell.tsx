"use client";

import { ReactNode } from 'react';
import { TopBar } from './TopBar';
import { motion, AnimatePresence } from 'framer-motion';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full relative bg-[#FBFBFE] selection:bg-primary/10 selection:text-primary overflow-x-hidden">
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

      <TopBar />
      
      <main className="relative z-10 flex flex-col items-center w-full min-h-screen pt-32 pb-32">
        <div className="w-full max-w-5xl px-6">
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
        </div>
      </main>
    </div>
  );
}
