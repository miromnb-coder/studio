"use client";

import { motion } from "framer-motion";

type Props = {
  content: string;
  status?: string;
};

function formatStatus(status?: string) {
  if (!status) return "";

  return status
    .replaceAll("_", " ")
    .toUpperCase();
}

export function KivoAgentMessage({
  content,
  status,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className="w-full"
    >
      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
        {status && (
          <div className="mb-3 text-[10px] tracking-[0.25em] text-cyan-300/80">
            {formatStatus(status)}
          </div>
        )}

        <div className="whitespace-pre-wrap text-sm leading-7 text-white/90">
          {content}
        </div>
      </div>
    </motion.div>
  );
}
