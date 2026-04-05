"use client";

import { motion, AnimatePresence } from "framer-motion";

type Props = {
  state?: "idle" | "thinking" | "executing" | "success" | "error";
};

export default function AICoreOrbit({ state = "idle" }: Props) {
  const speedScale =
    state === "thinking" ? 0.6 :
    state === "executing" ? 0.4 :
    1;

  const glowColor =
    state === "thinking" ? "rgba(59, 130, 246, 0.5)" :
    state === "executing" ? "rgba(147, 51, 234, 0.5)" :
    state === "success" ? "rgba(34, 197, 94, 0.5)" :
    state === "error" ? "rgba(239, 68, 68, 0.5)" :
    "rgba(59, 130, 246, 0.3)";

  return (
    <div className="relative flex items-center justify-center w-[240px] h-[240px] perspective-1000">
      
      {/* 🔮 CINEMATIC BACKGROUND DIFFUSION */}
      <motion.div
        className="absolute w-[200px] h-[200px] rounded-full blur-[80px]"
        style={{ backgroundColor: glowColor }}
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* 🪐 LAYERED ORBIT SYSTEM (visionOS Depth) */}
      {[
        { radius: 110, duration: 25, delay: 0, opacity: 0.1 },
        { radius: 85, duration: 18, delay: -5, opacity: 0.15 },
        { radius: 60, duration: 12, delay: -2, opacity: 0.2 },
      ].map((orbit, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-white/20"
          style={{ 
            width: orbit.radius * 2, 
            height: orbit.radius * 2,
            opacity: orbit.opacity,
            boxShadow: `inset 0 0 20px rgba(255,255,255,0.05)`
          }}
          animate={{ rotate: 360 }}
          transition={{ 
            duration: orbit.duration * speedScale, 
            repeat: Infinity, 
            ease: "linear",
            delay: orbit.delay
          }}
        />
      ))}

      {/* ✨ LIGHT REFRACTION SHARDS (Floating Nodes) */}
      {[
        { r: 110, size: 4, color: "bg-blue-400", duration: 25 },
        { r: 85, size: 3, color: "bg-white", duration: 18 },
        { r: 60, size: 5, color: "bg-blue-200", duration: 12 },
      ].map((node, i) => (
        <motion.div
          key={`node-${i}`}
          className={`absolute rounded-full shadow-[0_0_15px_rgba(255,255,255,0.8)] ${node.color}`}
          style={{ 
            width: node.size, 
            height: node.size,
          }}
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: node.duration * speedScale,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            transformOrigin: `${node.r}px center`,
            filter: "blur(0.5px)"
          }}
        />
      ))}

      {/* 💎 THE CORE ARTIFACT (Light Refraction + Specular) */}
      <motion.div className="relative w-16 h-16 flex items-center justify-center">
        {/* Specular Highlight Layer */}
        <motion.div 
          className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/40 to-transparent z-20"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Refractive Glass Body */}
        <motion.div
          className="w-full h-full rounded-full backdrop-blur-3xl border border-white/40 shadow-[0_0_40px_rgba(59,130,246,0.2)] bg-white/10 overflow-hidden relative"
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Inner Light Fluid */}
          <motion.div 
            className="absolute inset-[-50%] bg-gradient-to-br from-blue-400/20 via-white/5 to-purple-400/20"
            animate={{ 
              rotate: [0, 360],
              x: [-10, 10, -10],
              y: [-10, 10, -10]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>

        {/* Neural Signal Core (Brightest part) */}
        <motion.div
          className="absolute w-2 h-2 rounded-full bg-white z-30"
          style={{ boxShadow: '0 0 20px 4px rgba(255,255,255,0.8)' }}
          animate={{
            scale: state === 'thinking' ? [1, 1.5, 1] : [1, 1.2, 1],
            opacity: state === 'executing' ? [0.5, 1, 0.5] : 1
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      {/* 🌊 CAUSTIC AMBIENT PULSE */}
      <AnimatePresence>
        {(state === 'thinking' || state === 'executing') && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 2, opacity: [0, 0.2, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            className="absolute inset-0 rounded-full border-[0.5px] border-white/30 blur-sm pointer-events-none"
          />
        )}
      </AnimatePresence>

    </div>
  );
}
