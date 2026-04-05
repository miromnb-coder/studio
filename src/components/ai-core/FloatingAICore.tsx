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

  return (
    <>
      <div className="fixed bottom-8 right-8 z-[200]">
        <motion.button
          aria-label="AI System Status"
          whileHover={{ scale: 1.05, y: -4 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          // 1. BASE CONTINUOUS MOTION: Micro-float and Breathing
          animate={{
            scale: [1, 1.04, 1],
            y: [0, -1.5, 0.5, 0],
            x: [0, 0.5, -0.5, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className={cn(
            "relative w-14 h-14 rounded-[1.75rem] flex items-center justify-center transition-all duration-700",
            "bg-white/40 backdrop-blur-2xl border shadow-xl ring-1 ring-white/20",
            statusColors
          )}
        >
          {/* 2. OUTER BREATHING GLOW: Always active, intensity shifts based on state */}
          <motion.div
            animate={{
              scale: state.status === 'thinking' ? [1, 1.2, 1] : [1, 1.1, 1],
              opacity: state.status === 'idle' ? [0.2, 0.4, 0.2] : [0.4, 0.7, 0.4],
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

          {/* 3. INNER SHIMMER / FLOW LAYER: Sophisticated moving light */}
          <motion.div 
            animate={{
              rotate: [0, 360],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute inset-1 rounded-[1.5rem] bg-gradient-to-tr from-transparent via-white/30 to-transparent pointer-events-none overflow-hidden"
          />

          {/* 4. ACTIVITY PULSE: Visible when active */}
          <AnimatePresence>
            {(state.status === 'thinking' || state.status === 'executing') && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1.6, opacity: [0, 0.3, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                className={cn(
                  "absolute inset-0 rounded-full blur-md pointer-events-none",
                  state.status === 'thinking' ? 'bg-primary/30' : 'bg-accent/30'
                )}
              />
            )}
          </AnimatePresence>

          {/* 5. CENTER CORE ELEMENT: State-aware iconography */}
          <div className="relative z-10">
            {state.status === 'thinking' ? (
              <motion.div
                animate={{ 
                  rotate: 360,
                  scale: [1, 1.1, 1] 
                }}
                transition={{ 
                  rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                  scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                }}
              >
                <Cpu className="w-6 h-6 text-primary" />
              </motion.div>
            ) : state.status === 'executing' ? (
              <motion.div
                animate={{ 
                  scale: [1, 1.25, 1], 
                  opacity: [0.7, 1, 0.7],
                  filter: ["brightness(1)", "brightness(1.3)", "brightness(1)"]
                }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Sparkles className="w-6 h-6 text-accent" />
              </motion.div>
            ) : state.status === 'success' ? (
              <motion.div 
                initial={{ scale: 0.5, filter: "brightness(2)" }} 
                animate={{ scale: 1, filter: "brightness(1)" }}
                className="w-2.5 h-2.5 rounded-full bg-success shadow-[0_0_15px_rgba(34,197,94,0.8)]" 
              />
            ) : state.status === 'error' ? (
              <motion.div 
                animate={{ x: [-2, 2, -2, 2, 0], scale: [1, 1.2, 1] }} 
                transition={{ duration: 0.3 }}
                className="w-2.5 h-2.5 rounded-full bg-danger shadow-[0_0_15px_rgba(239,68,68,0.8)]" 
              />
            ) : (
              // Idle state: subtle internal energy shimmer
              <div className="relative">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300 relative z-10" />
                <motion.div 
                  animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute inset-0 rounded-full bg-slate-200 blur-sm"
                />
              </div>
            )}
          </div>

          {/* 6. LIVE INDICATOR: Minimalist badge */}
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
