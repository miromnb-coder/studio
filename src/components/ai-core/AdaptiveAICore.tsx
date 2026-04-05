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

  // Status-based configuration for physics and lights
  const statusConfig = useMemo(() => {
    switch (state.status) {
      case 'thinking':
        return {
          color: 'text-primary',
          glow: 'bg-primary/40',
          speed: 0.5,
          nodeCount: 12,
          coreScale: 1.1,
          energyOpacity: 0.9,
          orbitSpeed: 8
        };
      case 'executing':
        return {
          color: 'text-accent',
          glow: 'bg-accent/40',
          speed: 0.3,
          nodeCount: 20,
          coreScale: 1.2,
          energyOpacity: 1,
          orbitSpeed: 4
        };
      case 'success':
        return {
          color: 'text-success',
          glow: 'bg-success/40',
          speed: 2,
          nodeCount: 6,
          coreScale: 1,
          energyOpacity: 0.5,
          orbitSpeed: 20
        };
      case 'error':
        return {
          color: 'text-danger',
          glow: 'bg-danger/40',
          speed: 3,
          nodeCount: 6,
          coreScale: 1,
          energyOpacity: 0.5,
          orbitSpeed: 20
        };
      default:
        return {
          color: 'text-slate-400',
          glow: 'bg-primary/10',
          speed: 5,
          nodeCount: 6,
          coreScale: 1,
          energyOpacity: 0.3,
          orbitSpeed: 30
        };
    }
  }, [state.status]);

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
        {/* 1. AMBIENT FIELD - Deep atmospheric glow */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className={cn(
            "absolute inset-0 rounded-full blur-[100px] pointer-events-none transition-colors duration-1000",
            statusConfig.glow
          )}
        />

        {/* 2. ORBITAL SYSTEM - Complex SVG dynamics */}
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 240 240"
          className="absolute inset-0 pointer-events-none overflow-visible"
        >
          <defs>
            <radialGradient id="coreGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.8" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </radialGradient>
          </defs>

          <g transform="translate(120, 120)">
            {/* The Rings */}
            {[
              { rx: 100, ry: 35, rotate: 45, speed: 1 },
              { rx: 90, ry: 45, rotate: -35, speed: 1.3 },
              { rx: 110, ry: 25, rotate: 90, speed: 0.8 },
            ].map((orbit, i) => (
              <motion.g 
                key={i} 
                animate={{ rotate: [orbit.rotate, orbit.rotate + 360] }}
                transition={{ duration: statusConfig.orbitSpeed * 2, repeat: Infinity, ease: "linear" }}
              >
                {/* Visual Path */}
                <ellipse
                  rx={orbit.rx}
                  ry={orbit.ry}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                  className="text-slate-300/10"
                />
                
                {/* Data Nodes on Path */}
                {[...Array(Math.floor(statusConfig.nodeCount / 3))].map((_, nodeIdx) => (
                  <motion.circle
                    key={nodeIdx}
                    r={isHero ? 2 : 1}
                    className={statusConfig.color}
                    fill="currentColor"
                    animate={{
                      cx: [0, orbit.rx, 0, -orbit.rx, 0],
                      cy: [-orbit.ry, 0, orbit.ry, 0, -orbit.ry],
                      opacity: [0.4, 1, 0.4],
                      scale: [1, 1.5, 1]
                    }}
                    transition={{
                      duration: statusConfig.orbitSpeed / orbit.speed,
                      repeat: Infinity,
                      ease: "linear",
                      delay: (nodeIdx / 3) * statusConfig.orbitSpeed
                    }}
                  />
                ))}
              </motion.g>
            ))}
          </g>

          {/* ACTIVE EXPANSION RINGS - Only during processing */}
          <AnimatePresence>
            {(state.status === 'thinking' || state.status === 'executing') && (
              <motion.circle
                key="expansion"
                cx="120"
                cy="120"
                r="40"
                initial={{ r: 40, opacity: 0.8, strokeWidth: 2 }}
                animate={{ r: 140, opacity: 0, strokeWidth: 0.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                fill="none"
                stroke="currentColor"
                className={statusConfig.color}
              />
            )}
          </AnimatePresence>
        </svg>

        {/* 3. THE INTELLIGENCE CORE - Faceted Artifact */}
        <motion.div
          animate={{
            scale: statusConfig.coreScale,
            rotate: [0, 5, -5, 0],
            y: [0, -4, 0]
          }}
          transition={{
            scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 10, repeat: Infinity, ease: "easeInOut" },
            y: { duration: 6, repeat: Infinity, ease: "easeInOut" }
          }}
          className={cn(
            "relative z-10 flex items-center justify-center transition-all duration-1000",
            isHero ? "w-40 h-40" : "w-10 h-10",
            "bg-white/5 backdrop-blur-3xl rounded-full border border-white/10 shadow-[0_0_50px_rgba(255,255,255,0.05)] overflow-hidden"
          )}
        >
          {/* Inner Energy Pulse */}
          <motion.div
            animate={{
              opacity: [0.1, 0.3, 0.1],
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className={cn("absolute inset-0 transition-colors duration-1000", statusConfig.glow)}
          />

          {/* Core Visual */}
          <div className="relative z-20 flex items-center justify-center w-full h-full">
            <AnimatePresence mode="wait">
              {state.status === 'thinking' ? (
                <motion.div
                  key="thinking"
                  initial={{ opacity: 0, rotate: -180, scale: 0.5 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 180, scale: 0.5 }}
                >
                  <Cpu className={cn(statusConfig.color, isHero ? "w-16 h-16" : "w-5 h-5")} />
                </motion.div>
              ) : state.status === 'executing' ? (
                <motion.div
                  key="executing"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"]
                  }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Sparkles className={cn(statusConfig.color, isHero ? "w-16 h-16" : "w-5 h-5")} />
                </motion.div>
              ) : state.status === 'success' ? (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  <Zap className={cn("text-success", isHero ? "w-16 h-16" : "w-5 h-5")} fill="currentColor" />
                </motion.div>
              ) : state.status === 'error' ? (
                <motion.div animate={{ x: [-4, 4, -4, 4, 0] }}>
                  <Activity className={cn("text-danger", isHero ? "w-16 h-16" : "w-5 h-5")} />
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  className={cn(
                    "rounded-full transition-all duration-1000 shadow-glow",
                    isHero ? "w-6 h-6" : "w-2 h-2",
                    "bg-white/40"
                  )}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Internal Shimmer Layer */}
          <motion.div 
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg] pointer-events-none"
          />
        </motion.div>

        {/* 4. PERIPHERAL RADIANCE (Hero Only) */}
        {isHero && (
          <div className="absolute inset-[-40px] pointer-events-none flex items-center justify-center">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                animate={{
                  rotate: i % 2 === 0 ? 360 : -360,
                  opacity: [0.02, 0.08, 0.02],
                  scale: [1, 1.05, 1]
                }}
                transition={{ duration: 20 + i * 10, repeat: Infinity, ease: "linear" }}
                className={cn(
                  "absolute border border-white/5 rounded-full",
                  i === 1 ? "inset-0" : i === 2 ? "inset-[-20px]" : "inset-[-40px]"
                )}
              />
            ))}
          </div>
        )}
      </motion.button>

      <AICorePanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
    </>
  );
}
