"use client";

import { motion } from "framer-motion";

type Props = {
  content: string;
  status?: string;
};

export function KivoAgentMessage({
  content,
  status,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 shadow-xl">
        {status && (
          <div className="mb-3 text-xs uppercase tracking-[0.2em] text-cyan-300/80">
            {status}
          </div>
        )}

        <div className="prose prose-invert max-w-none text-sm leading-7 text-white/90 whitespace-pre-wrap">
          {content}
        </div>
      </div>
    </motion.div>
  );
}
