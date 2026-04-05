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

  // Status-based dynamics
  const statusConfig = useMemo(() => {
    switch (state.status) {
      case 'thinking': 
        return { 
          color: 'text-primary', 
          glow: 'bg-primary/20', 
          speed: 1, 
          intensity: 1.2,
          nodeCount: 4
        };
      case 'executing': 
        return { 
          color: 'text-accent', 
          glow: 'bg-accent/20', 
          speed: 0.5, 
          intensity: 1.5,
          nodeCount: 6
        };
      case 'success': 
        return { 
          color: 'text-success', 
          glow: 'bg-success/20', 
          speed: 2, 
          intensity: 1,
          nodeCount: 2
        };
      case 'error': 
        return { 
          color: 'text-danger', 
          glow: 'bg-danger/20', 
          speed: 3, 
          intensity: 1,
          nodeCount: 2
        };
      default: 
        return { 
          color: 'text-slate-400', 
          glow: 'bg-primary/5', 
          speed: 4, 
          intensity: 1,
          nodeCount: 2
        };
    }
  }, [state.status]);

  const isHero = variant === 'hero';
  const size = isHero ? 160 : 44;
  const strokeWidth = isHero ? 1 : 1.5;

  return (
    <>
      <motion.button
        layoutId="ai-core-orb"
        aria-label="AI System Status"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsPanelOpen(!isPanelOpen)}
        className={cn(
          "relative flex items-center justify-center transition-all duration-700",
          "bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl",
          isHero ? "w-40 h-40 rounded-[4rem]" : "w-11 h-11 rounded-2xl",
          className
        )}
      >
        {/* BACKGROUND GLOW */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 4, repeat: Infinity }}
          className={cn(
            "absolute inset-[-20px] rounded-full blur-3xl pointer-events-none transition-colors duration-1000",
            statusConfig.glow
          )}
        />

        {/* ORBITAL SVG SYSTEM */}
        <svg 
          width={size} 
          height={size} 
          viewBox="0 0 100 100" 
          className="absolute inset-0 pointer-events-none"
        >
          {/* ORBITAL PATHS */}
          {[35, 42, 48].map((radius, i) => (
            <motion.circle
              key={`orbit-${i}`}
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth * 0.5}
              className="text-slate-200/20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            />
          ))}

          {/* DYNAMIC NODES ON PATHS */}
          {[35, 42, 48].map((radius, i) => (
            <g key={`nodes-${i}`}>
              {[...Array(isHero ? statusConfig.nodeCount : 1)].map((_, nodeIdx) => (
                <motion.circle
                  key={`node-${i}-${nodeIdx}`}
                  r={isHero ? 1.5 : 1}
                  cx="50"
                  cy={50 - radius}
                  className={statusConfig.color}
                  fill="currentColor"
                  animate={{
                    rotate: [nodeIdx * (360 / statusConfig.nodeCount), nodeIdx * (360 / statusConfig.nodeCount) + 360],
                  }}
                  transition={{
                    duration: (8 + i * 4) * statusConfig.speed,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  style={{ originX: "50px", originY: "50px" }}
                />
              ))}
            </g>
          ))}
        </svg>

        {/* CENTER CORE */}
        <div className="relative z-10 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {state.status === 'thinking' ? (
              <motion.div
                key="thinking"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
              >
                <Cpu className={cn(statusConfig.color, isHero ? "w-12 h-12" : "w-5 h-5")} />
              </motion.div>
            ) : state.status === 'executing' ? (
              <motion.div
                key="executing"
                initial={{ rotate: -180, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 180, opacity: 0 }}
              >
                <Sparkles className={cn(statusConfig.color, isHero ? "w-12 h-12" : "w-5 h-5")} />
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-2"
              >
                <div className={cn(
                  "rounded-full transition-all duration-700 shadow-glow",
                  statusConfig.color.replace('text-', 'bg-'),
                  isHero ? "w-4 h-4" : "w-2 h-2"
                )} />
                {isHero && (
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2">
                    Ready
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* PULSE RINGS (Active only) */}
        {(state.status === 'thinking' || state.status === 'executing') && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1.5, opacity: [0, 0.2, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className={cn("absolute inset-0 rounded-full border border-current pointer-events-none", statusConfig.color)}
          />
        )}
      </motion.button>

      <AICorePanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
    </>
  );
}
