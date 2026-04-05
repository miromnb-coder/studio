'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAICore } from './AICoreContext';
import { AICorePanel } from './AICorePanel';
import { cn } from '@/lib/utils';
import AICoreOrbit from './AICoreOrbit';

interface AdaptiveAICoreProps {
  variant: 'hero' | 'compact';
  className?: string;
}

export function AdaptiveAICore({ variant, className }: AdaptiveAICoreProps) {
  const { state } = useAICore();
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const isHero = variant === 'hero';

  return (
    <>
      <motion.button
        layoutId="ai-core-intelligence-artifact"
        aria-label="AI Intelligence Core"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsPanelOpen(!isPanelOpen)}
        className={cn(
          "relative flex items-center justify-center transition-all duration-1000 outline-none",
          isHero ? "w-72 h-72" : "w-14 h-14",
          className
        )}
      >
        <div className={cn(
          "transition-transform duration-1000",
          isHero ? "scale-100" : "scale-[0.25]"
        )}>
          <AICoreOrbit state={state.status} />
        </div>

        {/* Status Indicator Badge (Compact Only) */}
        {!isHero && state.status !== 'idle' && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute -top-1 -right-1 px-2 py-0.5 rounded-full bg-white border border-slate-100 shadow-sm text-[7px] font-black text-primary uppercase tracking-widest z-20"
          >
            Live
          </motion.div>
        )}
      </motion.button>

      <AICorePanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
    </>
  );
}
