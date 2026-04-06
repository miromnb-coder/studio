
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";

type Props = {
  state?: "idle" | "thinking" | "executing" | "success" | "error";
};

export default function AICoreOrbit({ state = "idle" }: Props) {
  const isBusy = state === "thinking" || state === "executing";
  
  const coreColor =
    state === "thinking" ? "rgba(79, 149, 255, 0.8)" :
    state === "executing" ? "rgba(147, 51, 234, 0.8)" :
    state === "success" ? "rgba(34, 197, 94, 0.8)" :
    "rgba(79, 149, 255, 0.6)";

  const orbits = [
    { id: 'o1', rx: 110, ry: 45, duration: 25, rotate: 15, nodeSize: 4, nodeColor: "bg-blue-400" },
    { id: 'o2', rx: 100, ry: 40, duration: 18, rotate: -20, nodeSize: 3, nodeColor: "bg-purple-400" },
    { id: 'o3', rx: 90, ry: 50, duration: 30, rotate: 45, nodeSize: 5, nodeColor: "bg-cyan-300" },
  ];

  return (
    <div className="relative flex items-center justify-center w-[320px] h-[320px] perspective-1000">
      
      {/* 🔮 AMBIENT BACK GLOW */}
      <motion.div
        className="absolute w-[280px] h-[280px] rounded-full blur-[120px] opacity-20"
        style={{ background: `radial-gradient(circle, ${coreColor} 0%, transparent 70%)` }}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* 🌀 ORBITAL SYSTEM */}
      <svg className="absolute w-full h-full pointer-events-none overflow-visible" viewBox="0 0 320 320">
        <defs>
          <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {orbits.map((orbit) => (
          <g key={orbit.id} transform={`translate(160, 160) rotate(${orbit.rotate})`}>
            <ellipse 
              cx="0" cy="0" 
              rx={orbit.rx} ry={orbit.ry} 
              fill="none" 
              stroke="url(#lineGradient)" 
              strokeWidth="0.5" 
              className="opacity-20"
            />
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="white" stopOpacity="0" />
              <stop offset="50%" stopColor="white" stopOpacity="0.5" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
            
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
                duration: orbit.duration * (isBusy ? 0.5 : 1),
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
          className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 blur-md opacity-40"
          animate={{ scale: isBusy ? [1, 1.15, 1] : [1, 1.05, 1] }}
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
              opacity: [0.4, 0.8, 0.4]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Central Bright Spot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div 
              className="w-4 h-4 rounded-full bg-white shadow-[0_0_30px_10px_rgba(255,255,255,0.8)]"
              animate={{ scale: isBusy ? [1, 1.5, 1] : [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
        </div>

        {/* Specular Glint */}
        <div className="absolute top-2 left-4 w-6 h-3 bg-white/30 rounded-full blur-[2px] rotate-[-30deg]" />
      </div>

      {/* ✨ FLOATING PARTICLES */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-20"
            style={{
              left: `${20 + Math.random() * 60}%`,
              top: `${20 + Math.random() * 60}%`,
            }}
            animate={{
              y: [0, -40, 0],
              opacity: [0, 0.4, 0],
              scale: [0, 1, 0]
            }}
            transition={{
              duration: 4 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 5
            }}
          />
        ))}
      </div>
    </div>
  );
}
