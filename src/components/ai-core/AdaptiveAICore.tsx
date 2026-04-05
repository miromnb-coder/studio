'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAICore } from './AICoreContext';
import { AICorePanel } from './AICorePanel';
import { cn } from '@/lib/utils';
import { Cpu, Sparkles } from 'lucide-react';

interface AdaptiveAICoreProps {
  variant: 'hero' | 'compact';
  className?: string;
}

export function AdaptiveAICore({ variant, className }: AdaptiveAICoreProps) {
  const { state } = useAICore();
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Status-based color mapping for the core orb
  const statusColors = useMemo(() => {
    switch (state.status) {
      case 'thinking': return 'from-primary/40 to-blue-400/40 border-primary/40 shadow-primary/20';
      case 'executing': return 'from-accent/40 to-primary/40 border-accent/40 shadow-accent/20';
      case 'success': return 'from-success/40 to-emerald-400/40 border-success/40 shadow-success/20';
      case 'error': return 'from-danger/40 to-rose-400/40 border-danger/40 shadow-danger/20';
      default: return 'from-white/40 to-slate-100/40 border-white/80 shadow-slate-200/20';
    }
  }, [state.status]);

  const isHero = variant === 'hero';

  return (
    <>
      <motion.button
        layoutId="ai-core-orb"
        aria-label="AI System Status"
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsPanelOpen(!isPanelOpen)}
        animate={{
          scale: isHero ? [1, 1.02, 1] : [1, 1.04, 1],
          y: [0, -1, 1, 0],
        }}
        transition={{
          duration: isHero ? 8 : 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className={cn(
          "relative flex items-center justify-center transition-all duration-700",
          "bg-white/40 backdrop-blur-2xl border shadow-xl ring-1 ring-white/20",
          statusColors,
          isHero ? "w-32 h-32 rounded-[3.5rem]" : "w-10 h-10 rounded-2xl",
          className
        )}
      >
        {/* OUTER BREATHING GLOW */}
        <motion.div
          animate={{
            scale: state.status === 'thinking' ? [1, 1.2, 1] : [1, 1.1, 1],
            opacity: state.status === 'idle' ? [0.1, 0.3, 0.1] : [0.3, 0.6, 0.3],
          }}
          transition={{ 
            duration: state.status === 'thinking' ? 2 : 4, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className={cn(
            "absolute inset-[-12px] rounded-full blur-2xl pointer-events-none transition-colors duration-700",
            state.status === 'error' ? 'bg-danger/20' : 
            state.status === 'success' ? 'bg-success/20' : 
            'bg-primary/15'
          )}
        />

        {/* INNER SHIMMER / FLOW LAYER */}
        <motion.div 
          animate={{
            rotate: [0, 360],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "linear"
          }}
          className={cn(
            "absolute inset-1 bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none overflow-hidden",
            isHero ? "rounded-[3rem]" : "rounded-xl"
          )}
        />

        {/* CENTER ICON / STATE */}
        <div className="relative z-10 flex items-center justify-center">
          {state.status === 'thinking' ? (
            <motion.div
              animate={{ rotate: 360, scale: [1, 1.1, 1] }}
              transition={{ 
                rotate: { duration: 10, repeat: Infinity, ease: "linear" },
                scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
              }}
            >
              <Cpu className={cn("text-primary", isHero ? "w-10 h-10" : "w-4 h-4")} />
            </motion.div>
          ) : state.status === 'executing' ? (
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1], 
                opacity: [0.8, 1, 0.8]
              }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className={cn("text-accent", isHero ? "w-10 h-10" : "w-4 h-4")} />
            </motion.div>
          ) : (
            <div className="relative">
              {isHero ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary/40 animate-pulse" />
                  <span className="text-[10px] font-black text-primary/60 uppercase tracking-[0.4em]">Ready</span>
                </div>
              ) : (
                <div className="w-2 h-2 rounded-full bg-slate-300" />
              )}
            </div>
          )}
        </div>

        {/* LIVE INDICATOR (Compact only) */}
        {!isHero && state.status !== 'idle' && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-white border border-slate-100 shadow-sm text-[6px] font-black text-primary uppercase tracking-widest"
          >
            Live
          </motion.div>
        )}
      </motion.button>

      <AICorePanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
    </>
  );
}
