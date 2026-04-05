"use client";

import { motion } from "framer-motion";

type Props = {
  state?: "idle" | "thinking" | "executing" | "success" | "error";
};

export default function AICoreOrbit({ state = "idle" }: Props) {
  const speed =
    state === "thinking" ? 8 :
    state === "executing" ? 5 :
    12;

  const glow =
    state === "thinking" ? "shadow-blue-400/40" :
    state === "executing" ? "shadow-blue-500/60" :
    state === "success" ? "shadow-green-400/60" :
    state === "error" ? "shadow-red-400/60" :
    "shadow-blue-300/30";

  return (
    <div className="relative flex items-center justify-center w-[220px] h-[220px]">

      {/* 🌊 BACKGROUND GLOW */}
      <motion.div
        className={`absolute w-[180px] h-[180px] rounded-full blur-3xl bg-blue-400/20 ${glow}`}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* 🌀 OUTER ORBIT */}
      <motion.div
        className="absolute w-[200px] h-[200px] rounded-full border border-white/10"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: speed, ease: "linear" }}
      />

      {/* 🌀 INNER ORBIT */}
      <motion.div
        className="absolute w-[140px] h-[140px] rounded-full border border-white/10"
        animate={{ rotate: -360 }}
        transition={{ repeat: Infinity, duration: speed * 1.5, ease: "linear" }}
      />

      {/* 🔵 NODE 1 */}
      <motion.div
        className="absolute w-3 h-3 bg-blue-400 rounded-full"
        animate={{
          rotate: 360,
        }}
        transition={{
          repeat: Infinity,
          duration: speed,
          ease: "linear",
        }}
        style={{
          transformOrigin: "100px center",
        }}
      />

      {/* 🔵 NODE 2 */}
      <motion.div
        className="absolute w-2 h-2 bg-blue-300 rounded-full"
        animate={{
          rotate: -360,
        }}
        transition={{
          repeat: Infinity,
          duration: speed * 1.3,
          ease: "linear",
        }}
        style={{
          transformOrigin: "70px center",
        }}
      />

      {/* 🔵 NODE 3 */}
      <motion.div
        className="absolute w-2.5 h-2.5 bg-blue-200 rounded-full"
        animate={{
          rotate: 360,
        }}
        transition={{
          repeat: Infinity,
          duration: speed * 0.8,
          ease: "linear",
        }}
        style={{
          transformOrigin: "85px center",
        }}
      />

      {/* 🧠 CORE */}
      <motion.div
        className="w-10 h-10 rounded-full bg-gradient-to-br from-white/60 to-blue-200/60 backdrop-blur-xl border border-white/30"
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

    </div>
  );
}
