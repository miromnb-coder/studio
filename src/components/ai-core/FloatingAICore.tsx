'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAICore } from './AICoreContext';
import { AICorePanel } from './AICorePanel';
import { cn } from '@/lib/utils';
import { Cpu, Sparkles } from 'lucide-react';

export function FloatingAICore() {
  const { state } = useAICore();
  const [isOpen, setIsOpen] = useState(false);

  const statusColors = useMemo(() => {
    switch (state.status) {
      case 'thinking': return 'from-primary/40 to-blue-400/40 border-primary/40 shadow-primary/20';
      case 'executing': return 'from-accent/40 to-primary/40 border-accent/40 shadow-accent/20';
      case 'success': return 'from-success/40 to-emerald-400/40 border-success/40 shadow-success/20';
      case 'error': return 'from-danger/40 to-rose-400/40 border-danger/40 shadow-danger/20';
      default: return 'from-white/40 to-slate-100/40 border-white/80 shadow-slate-200/20';
    }
  }, [state.status]);

  return (
    <>
      <div className="fixed bottom-8 right-8 z-[200]">
        <motion.button
          aria-label="AI System Status"
          whileHover={{ scale: 1.05, y: -4 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "relative w-14 h-14 rounded-[1.75rem] flex items-center justify-center transition-all duration-500",
            "bg-white/40 backdrop-blur-2xl border shadow-xl ring-1 ring-white/20",
            statusColors
          )}
        >
          {/* Breathing Glow */}
          <motion.div
            animate={state.status === 'idle' ? {
              scale: [1, 1.15, 1],
              opacity: [0.3, 0.6, 0.3],
            } : {
              scale: 1,
              opacity: 0
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className={cn(
              "absolute inset-[-8px] rounded-full blur-xl pointer-events-none",
              state.status === 'idle' ? 'bg-primary/10' : 'hidden'
            )}
          />

          {/* Activity Pulse */}
          <AnimatePresence>
            {(state.status === 'thinking' || state.status === 'executing') && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1.4, opacity: [0, 0.4, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                className={cn(
                  "absolute inset-0 rounded-full blur-md pointer-events-none",
                  state.status === 'thinking' ? 'bg-primary/20' : 'bg-accent/20'
                )}
              />
            )}
          </AnimatePresence>

          {/* Inner Content */}
          <div className="relative z-10">
            {state.status === 'thinking' ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <Cpu className="w-6 h-6 text-primary" />
              </motion.div>
            ) : state.status === 'executing' ? (
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Sparkles className="w-6 h-6 text-accent" />
              </motion.div>
            ) : state.status === 'success' ? (
              <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }}>
                <div className="w-2.5 h-2.5 rounded-full bg-success shadow-[0_0_12px_rgba(34,197,94,0.6)]" />
              </motion.div>
            ) : state.status === 'error' ? (
              <motion.div animate={{ x: [-2, 2, -2, 2, 0] }} transition={{ duration: 0.2 }}>
                <div className="w-2.5 h-2.5 rounded-full bg-danger shadow-[0_0_12px_rgba(239,68,68,0.6)]" />
              </motion.div>
            ) : (
              <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
            )}
          </div>

          {/* Floating Badge */}
          {state.status !== 'idle' && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute -top-1 -right-1 px-2 py-0.5 rounded-full bg-white border border-slate-100 shadow-sm text-[7px] font-black text-primary uppercase tracking-widest"
            >
              Live
            </motion.div>
          )}
        </motion.button>
      </div>

      <AICorePanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
