
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState, useEffect } from "react";
import { AICoreStatus } from "./types";
import { cn } from "@/lib/utils";

type Props = {
  state?: AICoreStatus;
  isFocused?: boolean;
  triggerBurst?: boolean; // New prop to trigger the send-reaction
};

// Internal Spark component for the "Forge" effect
const ForgeSpark = ({ id }: { id: number }) => (
  <motion.div
    key={id}
    initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
    animate={{ 
      x: (Math.random() - 0.5) * 100, 
      y: -150 - Math.random() * 100, 
      opacity: [0, 0.8, 0],
      scale: [0, 1.5, 0.5]
    }}
    transition={{ duration: 3 + Math.random() * 2, ease: "easeOut" }}
    className="absolute w-1 h-1 bg-blue-300 rounded-full blur-[1px] shadow-[0_0_8px_rgba(147,197,253,0.8)]"
  />
);

export default function AICoreOrbit({ state = "idle", isFocused = false, triggerBurst = false }: Props) {
  const [sparks, setSparks] = useState<{id: number}[]>([]);
  const isBusy = state === "thinking" || state === "executing" || state === "reasoning";
  
  // Forge Spark Generator logic
  useEffect(() => {
    const interval = setInterval(() => {
      // Only emit sparks occasionally or when busy
      if (Math.random() > (isBusy ? 0.3 : 0.8)) {
        const id = Date.now();
        setSparks(prev => [...prev, { id }].slice(-10)); // Keep last 10 sparks
      }
    }, 800);
    return () => clearInterval(interval);
  }, [isBusy]);

  const coreGlow = useMemo(() => {
    switch (state) {
      case 'executing': return 'rgba(34, 211, 238, 0.9)'; // Cyan
      case 'reasoning': return 'rgba(45, 212, 191, 0.8)'; // Turquoise
      case 'success': return 'rgba(34, 197, 94, 0.8)'; // Green
      case 'error': return 'rgba(239, 68, 68, 0.8)'; // Red
      default: return 'rgba(59, 130, 246, 0.6)'; // Deep Blue
    }
  }, [state]);

  const orbits = [
    { id: 'o1', rx: 110, ry: 45, duration: 25, rotate: 15, nodeSize: 4 },
    { id: 'o2', rx: 100, ry: 40, duration: 18, rotate: -20, nodeSize: 3 },
    { id: 'o3', rx: 90, ry: 50, duration: 30, rotate: 45, nodeSize: 5 },
  ];

  return (
    <div className="relative flex items-center justify-center w-[320px] h-[320px] perspective-1000">
      
      {/* 🔮 CENTER HALO (Background guided focus) */}
      <motion.div
        className="absolute w-[280px] h-[280px] rounded-full blur-[120px] pointer-events-none transition-colors duration-1000"
        style={{ background: `radial-gradient(circle, ${coreGlow} 0%, transparent 70%)` }}
        animate={{ 
          scale: triggerBurst ? [1, 1.8, 1] : (isFocused || isBusy ? [1, 1.3, 1] : [1, 1.1, 1]),
          opacity: triggerBurst ? [0.4, 0.9, 0.4] : (isFocused || isBusy ? 0.5 : 0.25)
        }}
        transition={{ duration: triggerBurst ? 0.6 : 8, repeat: triggerBurst ? 0 : Infinity, ease: "easeInOut" }}
      />

      {/* ✨ FORGE SPARKS */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <AnimatePresence>
          {sparks.map(s => <ForgeSpark key={s.id} id={s.id} />)}
        </AnimatePresence>
      </div>

      {/* 🌀 ORBITAL SYSTEM */}
      <svg className="absolute w-full h-full pointer-events-none overflow-visible" viewBox="0 0 320 320">
        <defs>
          <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="50%" stopColor="white" stopOpacity="0.3" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {orbits.map((orbit) => (
          <g key={orbit.id} transform={`translate(160, 160) rotate(${orbit.rotate})`}>
            <ellipse 
              cx="0" cy="0" 
              rx={orbit.rx} ry={orbit.ry} 
              fill="none" 
              stroke="url(#lineGradient)" 
              strokeWidth="0.5" 
              className="opacity-10"
            />
            <motion.circle
              r={orbit.nodeSize / 2}
              fill="white"
              filter="url(#nodeGlow)"
              animate={{
                cx: [orbit.rx, 0, -orbit.rx, 0, orbit.rx],
                cy: [0, orbit.ry, 0, -orbit.ry, 0],
                scale: triggerBurst ? [1, 2, 1] : [1, 1.4, 1]
              }}
              transition={{
                duration: triggerBurst ? (orbit.duration * 0.1) : (orbit.duration * (state === 'idle' ? 1 : 0.5)),
                repeat: triggerBurst ? 0 : Infinity,
                ease: triggerBurst ? "easeOut" : "linear"
              }}
            />
          </g>
        ))}
      </svg>

      {/* 💎 THE AI CORE ARTIFACT */}
      <motion.div 
        className="relative w-24 h-24 flex items-center justify-center"
        animate={{
          scale: triggerBurst ? [1, 1.4, 1] : 1,
          rotate: triggerBurst ? [0, 15, -15, 0] : 0
        }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className={cn(
            "absolute inset-0 rounded-full blur-md transition-colors duration-1000",
            isBusy ? "bg-cyan-400/40" : "bg-blue-400/40"
          )}
          animate={{ 
            scale: isBusy ? [1, 1.25, 1] : [1, 1.05, 1],
            opacity: isBusy ? 0.7 : 0.4
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        
        <div className="w-full h-full rounded-full border border-white/40 bg-white/10 backdrop-blur-xl shadow-[inset_0_0_20px_rgba(255,255,255,0.3)] relative overflow-hidden">
          <motion.div 
            className="absolute inset-[-50%] opacity-60"
            style={{ background: `radial-gradient(circle at center, white 0%, transparent 60%)` }}
            animate={{ 
              x: triggerBurst ? ['-40%', '40%'] : ['-20%', '20%'],
              y: triggerBurst ? ['-40%', '40%'] : ['-20%', '20%'],
              opacity: isBusy ? [0.6, 1, 0.6] : [0.4, 0.8, 0.4]
            }}
            transition={{ duration: isBusy ? 1.5 : 4, repeat: Infinity, ease: "easeInOut" }}
          />
          
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div 
              className="w-4 h-4 rounded-full bg-white shadow-[0_0_30px_10px_rgba(255,255,255,0.8)]"
              animate={{ 
                scale: isBusy ? [1, 2, 1] : [1, 1.2, 1],
                filter: isBusy ? "brightness(1.5)" : "brightness(1)"
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
