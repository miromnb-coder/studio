'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAICore } from './AICoreContext';
import { AICorePanel } from './AICorePanel';
import { cn } from '@/lib/utils';
import { Cpu, Sparkles, Zap, Activity } from 'lucide-react';

interface AdaptiveAICoreProps {
  variant: 'hero' | 'compact';
  className?: string;
}

export function AdaptiveAICore({ variant, className }: AdaptiveAICoreProps) {
  const { state } = useAICore();
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const isHero = variant === 'hero';

  // Status-based dynamics
  const statusConfig = useMemo(() => {
    switch (state.status) {
      case 'thinking':
        return {
          color: 'text-primary',
          glow: 'bg-primary/30',
          speed: 0.6,
          nodeCount: 10,
          corePulse: 1.05,
          energyOpacity: 0.8,
          rotationSpeed: 15
        };
      case 'executing':
        return {
          color: 'text-accent',
          glow: 'bg-accent/30',
          speed: 0.3,
          nodeCount: 16,
          corePulse: 1.15,
          energyOpacity: 1,
          rotationSpeed: 8
        };
      case 'success':
        return {
          color: 'text-success',
          glow: 'bg-success/30',
          speed: 2,
          nodeCount: 4,
          corePulse: 1,
          energyOpacity: 0.4,
          rotationSpeed: 40
        };
      case 'error':
        return {
          color: 'text-danger',
          glow: 'bg-danger/30',
          speed: 3,
          nodeCount: 4,
          corePulse: 1,
          energyOpacity: 0.4,
          rotationSpeed: 40
        };
      default:
        return {
          color: 'text-slate-400',
          glow: 'bg-primary/5',
          speed: 4,
          nodeCount: 4,
          corePulse: 1,
          energyOpacity: 0.2,
          rotationSpeed: 60
        };
    }
  }, [state.status]);

  return (
    <>
      <motion.button
        layoutId="ai-core-intelligence-artifact"
        aria-label="AI Intelligence Status"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsPanelOpen(!isPanelOpen)}
        className={cn(
          "relative flex items-center justify-center transition-all duration-1000",
          isHero ? "w-64 h-64" : "w-12 h-12",
          className
        )}
      >
        {/* 1. BACKGROUND AMBIENT GLOW - Layered for depth */}
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.4, 0.1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className={cn(
            "absolute inset-0 rounded-full blur-[80px] pointer-events-none transition-colors duration-1000",
            statusConfig.glow
          )}
        />

        {/* 2. DYNAMIC ORBITAL SYSTEM (SVG) */}
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 200 200"
          className="absolute inset-0 pointer-events-none overflow-visible"
        >
          {/* ORBITAL PATHS - Elliptical for 3D feel */}
          <g transform="translate(100, 100)">
            {[
              { rx: 85, ry: 30, rotate: 45, speed: 1 },
              { rx: 75, ry: 40, rotate: -30, speed: 1.2 },
              { rx: 95, ry: 25, rotate: 100, speed: 1.5 },
            ].map((orbit, i) => (
              <g key={i} transform={`rotate(${orbit.rotate})`}>
                {/* The Path */}
                <ellipse
                  cx="0"
                  cy="0"
                  rx={orbit.rx}
                  ry={orbit.ry}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                  className="text-slate-200/10"
                />
                
                {/* Traveling Data Nodes */}
                {[...Array(statusConfig.nodeCount)].map((_, nodeIdx) => (
                  <motion.circle
                    key={nodeIdx}
                    r={isHero ? 1.5 : 0.8}
                    className={statusConfig.color}
                    fill="currentColor"
                    animate={{
                      cx: [0, orbit.rx, 0, -orbit.rx, 0],
                      cy: [-orbit.ry, 0, orbit.ry, 0, -orbit.ry],
                      opacity: [0.3, 1, 0.3],
                      scale: [1, 1.5, 1]
                    }}
                    transition={{
                      duration: (statusConfig.rotationSpeed / orbit.speed),
                      repeat: Infinity,
                      ease: "linear",
                      delay: (nodeIdx / statusConfig.nodeCount) * 10
                    }}
                  />
                ))}
              </g>
            ))}
          </g>

          {/* ACTIVE SIGNAL PULSES */}
          <AnimatePresence>
            {(state.status === 'thinking' || state.status === 'executing') && (
              <motion.circle
                key="pulse"
                cx="100"
                cy="100"
                r="40"
                initial={{ r: 40, opacity: 0.6, strokeWidth: 2 }}
                animate={{ r: 120, opacity: 0, strokeWidth: 0.1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
                fill="none"
                stroke="currentColor"
                className={statusConfig.color}
              />
            )}
          </AnimatePresence>
        </svg>

        {/* 3. THE CENTER ARTIFACT (Geometric Faceted Core) */}
        <motion.div
          animate={{
            scale: statusConfig.corePulse,
            rotate: [0, 2, -2, 0],
          }}
          transition={{
            scale: { duration: 3, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 12, repeat: Infinity, ease: "linear" }
          }}
          className={cn(
            "relative z-10 flex items-center justify-center transition-all duration-700 shadow-2xl overflow-hidden",
            isHero ? "w-36 h-36 rounded-[3rem]" : "w-10 h-10 rounded-2xl",
            "bg-white/5 backdrop-blur-3xl border border-white/20"
          )}
        >
          {/* Inner Light Inflow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-white/10" />
          <motion.div
            animate={{
              opacity: statusConfig.energyOpacity,
              background: [
                `radial-gradient(circle at center, var(--color-primary) 0%, transparent 70%)`,
                `radial-gradient(circle at center, var(--color-primary) 20%, transparent 80%)`,
                `radial-gradient(circle at center, var(--color-primary) 0%, transparent 70%)`
              ]
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute inset-0 opacity-20 pointer-events-none"
          />

          {/* STATE VISUALIZER */}
          <div className="relative z-20">
            <AnimatePresence mode="wait">
              {state.status === 'thinking' ? (
                <motion.div
                  key="thinking"
                  initial={{ rotate: -90, opacity: 0, scale: 0.8 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.8 }}
                >
                  <Cpu className={cn(statusConfig.color, isHero ? "w-14 h-14" : "w-5 h-5")} />
                </motion.div>
              ) : state.status === 'executing' ? (
                <motion.div
                  key="executing"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    filter: ["brightness(1)", "brightness(1.4)", "brightness(1)"]
                  }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                >
                  <Sparkles className={cn(statusConfig.color, isHero ? "w-14 h-14" : "w-5 h-5")} />
                </motion.div>
              ) : state.status === 'success' ? (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  <Zap className={cn("text-success", isHero ? "w-14 h-14" : "w-5 h-5")} fill="currentColor" />
                </motion.div>
              ) : state.status === 'error' ? (
                <motion.div animate={{ x: [-2, 2, -2, 2, 0] }}>
                  <Activity className={cn("text-danger", isHero ? "w-14 h-14" : "w-5 h-5")} />
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  className={cn(
                    "rounded-full transition-all duration-1000",
                    isHero ? "w-5 h-5" : "w-2 h-2",
                    "bg-slate-300 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                  )}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Contextual Label (Hero Only) */}
          {isHero && (
            <motion.span
              animate={{ opacity: state.status === 'idle' ? 0.4 : 0 }}
              className="absolute bottom-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]"
            >
              Ready
            </motion.span>
          )}
        </motion.div>

        {/* 4. PERIPHERAL LIGHT RINGS (Hero Only) */}
        {isHero && (
          <div className="absolute inset-[-20px] pointer-events-none">
            {[1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  rotate: i === 1 ? 360 : -360,
                  opacity: [0.05, 0.15, 0.05],
                }}
                transition={{ duration: 25 + i * 15, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border border-white/5 rounded-[5rem]"
              />
            ))}
          </div>
        )}
      </motion.button>

      <AICorePanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
    </>
  );
}
