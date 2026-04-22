"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

type Props = {
  title?: string;
  children: ReactNode;
};

export function KivoResponseCard({
  title,
  children,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 shadow-xl"
    >
      {title && (
        <div className="mb-3 text-[11px] tracking-[0.25em] text-cyan-300/80 uppercase">
          {title}
        </div>
      )}

      <div className="text-sm leading-7 text-white/90">
        {children}
      </div>
    </motion.div>
  );
}
