'use client';

import { Check, CircleDot, Loader2, TriangleAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import type { LiveStep } from './live-steps-types';

function Icon({ status }: { status: LiveStep['status'] }) {
  if (status === 'done') return <Check className="h-3.5 w-3.5 text-[#3b82f6]" />;
  if (status === 'error') return <TriangleAlert className="h-3.5 w-3.5 text-[#d14b4b]" />;
  if (status === 'queued') return <CircleDot className="h-3.5 w-3.5 text-[#9aa3b2]" />;

  return <Loader2 className="h-3.5 w-3.5 animate-spin text-[#3b82f6]" />;
}

export function KivoLiveStepCard({ step }: { step: LiveStep }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="flex min-h-[42px] items-center gap-2.5 rounded-2xl border border-[#e5e7eb]/80 bg-[linear-gradient(180deg,rgba(243,244,246,0.88),rgba(238,240,243,0.88))] px-3 py-2 shadow-[0_6px_16px_rgba(15,23,42,0.05)]"
    >
      <span className="inline-flex h-5 w-5 flex-none items-center justify-center rounded-full bg-white/80 shadow-[0_2px_6px_rgba(17,24,39,0.08)]">
        <Icon status={step.status} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-medium tracking-[-0.015em] text-[#1f2937]">{step.label}</p>
        {step.subtitle ? <p className="truncate text-[11.5px] text-[#7b8493]">{step.subtitle}</p> : null}
      </div>
    </motion.div>
  );
}

export default KivoLiveStepCard;
