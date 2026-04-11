'use client';

import { AnimatePresence, motion } from 'framer-motion';

type ThinkingIndicatorProps = {
  phase: string;
};

export function ThinkingIndicator({ phase }: ThinkingIndicatorProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#E5E7EB] bg-white/95 px-3 py-2 shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
      <div className="relative flex h-7 w-7 items-center justify-center rounded-full border border-[#DDE3F7] bg-white shadow-[0_4px_10px_rgba(15,23,42,0.08)]">
        <motion.span
          className="absolute inset-0 rounded-full border border-[#C7D2FE]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.45, 0.12, 0.45] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.span
          className="h-2.5 w-2.5 rounded-full bg-[#5B5CF0]"
          animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.span
          className="absolute h-1.5 w-1.5 rounded-full bg-[#EEF0FF]"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '0px 9px' }}
        />
      </div>

      <div className="min-h-5 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={phase}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            className="text-sm font-medium text-[#334155]"
          >
            {phase}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
