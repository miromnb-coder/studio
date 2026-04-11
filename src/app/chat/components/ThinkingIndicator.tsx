'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { LivingAIPresence } from './LivingAIPresence';

type ThinkingIndicatorProps = {
  phase: string;
};

export function ThinkingIndicator({ phase }: ThinkingIndicatorProps) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-white/12 bg-white/[0.04] px-2.5 py-2 shadow-[0_10px_26px_rgba(0,0,0,0.3)] backdrop-blur-xl">
      <LivingAIPresence compact className="shrink-0" />
      <div className="min-h-5 overflow-hidden pr-1">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={phase}
            initial={{ opacity: 0, y: 7 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            className="text-sm font-medium tracking-[-0.01em] text-zinc-300"
          >
            {phase}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
