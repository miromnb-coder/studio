"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";
import { AICoreStatus } from "./types";
import { cn } from "@/lib/utils";

type Props = {
  state?: AICoreStatus;
  isFocused?: boolean;
};

export default function AICoreOrbit({ state = "idle", isFocused = false }: Props) {
  const isBusy = state === "thinking" || state === "executing" || state === "reasoning";
  
  // Dynamic color logic based on state
  const coreGlow = useMemo(() => {
    switch (state) {
      case 'executing': return 'rgba(147, 51, 234, 0.8)'; // Purple
      case 'reasoning': return 'rgba(34, 211, 238, 0.8)'; // Cyan
      case 'success': return 'rgba(34, 197, 94, 0.8)'; // Green
      case 'error': return 'rgba(239, 68, 68, 0.8)'; // Red
      default: return 'rgba(59, 130, 246, 0.6)'; // Blue
    }
  }, [state]);

  const orbits = [
    { id: 'o1', rx: 110, ry: 45, duration: 25, rotate: 15, nodeSize: 4, speedMultiplier: 1 },
    { id: 'o2', rx: 100, ry: 40, duration: 18, rotate: -20, nodeSize: 3, speedMultiplier: 1.5 },
    { id: 'o3', rx: 90, ry: 50, duration: 30, rotate: 45, nodeSize: 5, speedMultiplier: 0.8 },
  ];

  return (
    <div className="relative flex items-center justify-center w-[320px] h-[320px] perspective-1000">
      
      {/* 🔮 CENTER HALO (Background guided focus) */}
      <motion.div
        className="absolute w-[280px] h-[280px] rounded-full blur-[120px] opacity-20 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${coreGlow} 0%, transparent 70%)` }}
        animate={{ 
          scale: isFocused || isBusy ? [1, 1.3, 1] : [1, 1.1, 1],
          opacity: isFocused || isBusy ? 0.4 : 0.2
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* 🌀 ORBITAL SYSTEM & NEURAL NETWORK LAYER */}
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
        
        {/* Connection Lines (Reasoning Mode) */}
        <AnimatePresence>
          {state === 'reasoning' && (
            <motion.g 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 0.2 }} 
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
            >
              <line x1="160" y1="160" x2="270" y2="160" stroke="white" strokeWidth="0.5" strokeDasharray="4 2" />
              <line x1="160" y1="160" x2="60" y2="160" stroke="white" strokeWidth="0.5" strokeDasharray="4 2" />
              <line x1="160" y1="160" x2="160" y2="250" stroke="white" strokeWidth="0.5" strokeDasharray="4 2" />
            </motion.g>
          )}
        </AnimatePresence>

        {orbits.map((orbit) => (
          <g key={orbit.id} transform={`translate(160, 160) rotate(${orbit.rotate})`}>
            {/* The Path */}
            <ellipse 
              cx="0" cy="0" 
              rx={orbit.rx} ry={orbit.ry} 
              fill="none" 
              stroke="url(#lineGradient)" 
              strokeWidth="0.5" 
              className="opacity-10"
            />
            
            {/* Traveling Data Node */}
            <motion.circle
              r={orbit.nodeSize / 2}
              fill="white"
              filter="url(#nodeGlow)"
              animate={{
                cx: [orbit.rx, 0, -orbit.rx, 0, orbit.rx],
                cy: [0, orbit.ry, 0, -orbit.ry, 0],
                opacity: [0.4, 1, 0.4, 1, 0.4],
                scale: [1, 1.4, 1, 1.4, 1]
              }}
              transition={{
                duration: orbit.duration * (state === 'idle' ? 1 : 0.5),
                repeat: Infinity,
                ease: "linear"
              }}
            />
          </g>
        ))}
      </svg>

      {/* 💎 THE AI CORE ARTIFACT */}
      <div className="relative w-24 h-24 flex items-center justify-center">
        {/* Core Layers */}
        <motion.div
          className={cn(
            "absolute inset-0 rounded-full blur-md transition-colors duration-1000",
            state === 'executing' ? "bg-purple-500/40" : "bg-blue-400/40"
          )}
          animate={{ 
            scale: isBusy ? [1, 1.2, 1] : [1, 1.05, 1],
            opacity: isBusy ? 0.6 : 0.4
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        
        {/* Glass Outer Shell */}
        <div className="w-full h-full rounded-full border border-white/40 bg-white/10 backdrop-blur-xl shadow-[inset_0_0_20px_rgba(255,255,255,0.3)] relative overflow-hidden">
          {/* Inner Light Flow */}
          <motion.div 
            className="absolute inset-[-50%] opacity-60"
            style={{
              background: `radial-gradient(circle at center, white 0%, transparent 60%)`,
            }}
            animate={{ 
              x: ['-20%', '20%'],
              y: ['-20%', '20%'],
              opacity: isBusy ? [0.6, 1, 0.6] : [0.4, 0.8, 0.4]
            }}
            transition={{ duration: isBusy ? 2 : 4, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Central Bright Spot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div 
              className="w-4 h-4 rounded-full bg-white shadow-[0_0_30px_10px_rgba(255,255,255,0.8)]"
              animate={{ 
                scale: isBusy ? [1, 1.8, 1] : [1, 1.2, 1],
                filter: isBusy ? "brightness(1.5)" : "brightness(1)"
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
        </div>

        {/* Specular Glint */}
        <div className="absolute top-2 left-4 w-6 h-3 bg-white/30 rounded-full blur-[2px] rotate-[-30deg]" />
      </div>

      {/* ✨ MICRO PARTICLES (Floating Energy) */}
      <div className="absolute inset-0 pointer-events-none overflow-visible">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-0.5 h-0.5 bg-white rounded-full opacity-10"
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: `${10 + Math.random() * 80}%`,
            }}
            animate={{
              y: [0, -60, 0],
              opacity: [0, 0.3, 0],
              scale: [0, 1, 0]
            }}
            transition={{
              duration: 10 + Math.random() * 10,
              repeat: Infinity,
              delay: Math.random() * 10
            }}
          />
        ))}
      </div>
    </div>
  );
}
