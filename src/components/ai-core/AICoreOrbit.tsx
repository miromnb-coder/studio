
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";

type Props = {
  state?: "idle" | "thinking" | "executing" | "success" | "error";
};

export default function AICoreOrbit({ state = "idle" }: Props) {
  const isBusy = state === "thinking" || state === "executing";
  
  const speedScale =
    state === "thinking" ? 0.6 :
    state === "executing" ? 0.4 :
    1;

  const coreColor =
    state === "thinking" ? "rgba(59, 130, 246, 0.8)" :
    state === "executing" ? "rgba(147, 51, 234, 0.8)" :
    state === "success" ? "rgba(34, 197, 94, 0.8)" :
    state === "error" ? "rgba(239, 68, 68, 0.8)" :
    "rgba(59, 130, 246, 0.5)";

  // Orbital definitions for the "Neural Web" look
  const orbits = [
    { id: 'o1', rx: 100, ry: 40, duration: 20, rotate: 0, nodeSize: 4, nodeColor: "bg-blue-400" },
    { id: 'o2', rx: 90, ry: 35, duration: 15, rotate: 60, nodeSize: 3, nodeColor: "bg-white" },
    { id: 'o3', rx: 80, ry: 45, duration: 25, rotate: -45, nodeSize: 5, nodeColor: "bg-blue-200" },
  ];

  return (
    <div className="relative flex items-center justify-center w-[280px] h-[280px] perspective-1000">
      
      {/* 🔮 ATMOSPHERIC DIFFUSION (Deep Glow) */}
      <motion.div
        className="absolute w-[240px] h-[240px] rounded-full blur-[100px]"
        style={{ backgroundColor: coreColor }}
        animate={{ 
          scale: isBusy ? [1, 1.3, 1] : [1, 1.1, 1],
          opacity: isBusy ? [0.4, 0.8, 0.4] : [0.2, 0.4, 0.2]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* 🌀 NEURAL ORBITAL SYSTEM */}
      <svg className="absolute w-full h-full pointer-events-none" viewBox="0 0 280 280">
        <defs>
          <filter id="nodeGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {orbits.map((orbit, i) => (
          <g key={orbit.id} transform={`translate(140, 140) rotate(${orbit.rotate})`}>
            {/* The Path */}
            <ellipse 
              cx="0" cy="0" 
              rx={orbit.rx} ry={orbit.ry} 
              fill="none" 
              stroke="white" 
              strokeWidth="0.5" 
              strokeOpacity="0.1" 
            />
            
            {/* The Kinetic Node */}
            <motion.circle
              r={orbit.nodeSize}
              fill="white"
              filter="url(#nodeGlow)"
              animate={{
                cx: [orbit.rx, 0, -orbit.rx, 0, orbit.rx],
                cy: [0, orbit.ry, 0, -orbit.ry, 0],
                opacity: [0.2, 1, 0.2, 1, 0.2],
                scale: [1, 1.5, 1, 1.5, 1]
              }}
              transition={{
                duration: orbit.duration * speedScale,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          </g>
        ))}
      </svg>

      {/* 💎 THE NEURAL ARTIFACT (Core Artifact) */}
      <motion.div className="relative w-20 h-20 flex items-center justify-center">
        {/* Specular highlights */}
        <motion.div 
          className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/30 to-transparent z-20 pointer-events-none"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Refractive Glass Core */}
        <motion.div
          className="w-full h-full rounded-full backdrop-blur-3xl border border-white/40 shadow-[0_0_50px_rgba(59,130,246,0.3)] bg-white/10 overflow-hidden relative"
          animate={{
            scale: isBusy ? [1, 1.1, 1] : [1, 1.05, 1],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Inner Neural Web (Electric Flicker) */}
          <motion.div 
            className="absolute inset-[-50%] opacity-40"
            style={{
              background: `radial-gradient(circle, ${coreColor} 0%, transparent 70%)`,
            }}
            animate={{ 
              rotate: [0, 360],
              opacity: isBusy ? [0.4, 0.9, 0.4] : [0.3, 0.5, 0.3],
              scale: isBusy ? [1, 1.2, 1] : 1
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Electric Signal Layer */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ opacity: isBusy ? [0.2, 1, 0.2] : 0.1 }}
            transition={{ duration: 0.1, repeat: Infinity }}
          >
            <div className="w-full h-px bg-white/20 rotate-45" />
            <div className="w-full h-px bg-white/20 -rotate-45" />
          </motion.div>
        </motion.div>

        {/* Central Intelligence Signal */}
        <motion.div
          className="absolute w-3 h-3 rounded-full bg-white z-30 shadow-[0_0_20px_4px_rgba(255,255,255,0.8)]"
          animate={{
            scale: isBusy ? [1, 1.8, 1] : [1, 1.2, 1],
            opacity: state === 'executing' ? [0.5, 1, 0.5] : 1
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      {/* 🌊 CAUSTIC AMBIENT PULSE */}
      <AnimatePresence>
        {isBusy && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 2.5, opacity: [0, 0.15, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            className="absolute inset-0 rounded-full border-[0.5px] border-white/20 blur-md pointer-events-none"
          />
        )}
      </AnimatePresence>

    </div>
  );
}
