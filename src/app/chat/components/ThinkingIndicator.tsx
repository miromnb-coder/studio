'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { LivingAIPresence } from './LivingAIPresence';

type ThinkingIndicatorProps = {
  phase: string;
};

export function ThinkingIndicator({ phase }: ThinkingIndicatorProps) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-[#E6E9F5] bg-white/85 px-2.5 py-2 shadow-[0_8px_24px_rgba(76,91,168,0.08)] backdrop-blur-xl">
      <LivingAIPresence compact className="shrink-0" />
      <div className="min-h-5 overflow-hidden pr-1">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={phase}
            initial={{ opacity: 0, y: 7 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            className="text-sm font-medium tracking-[-0.01em] text-[#334155]"
          >
            {phase}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
