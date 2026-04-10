'use client';

import { motion } from 'framer-motion';
import { BrainCircuit } from 'lucide-react';
import { AgentExecutionTimeline, type ExecutionStep } from './AgentExecutionTimeline';

const dots = Array.from({ length: 8 }, (_, idx) => idx);

type AgentThinkingSurfaceProps = {
  statusText: string;
  steps: ExecutionStep[];
};

export function AgentThinkingSurface({ statusText, steps }: AgentThinkingSurfaceProps) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-[#cfd8ea]/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(241,245,252,0.88))] p-3 shadow-[0_12px_32px_rgba(69,95,149,0.12)] backdrop-blur-xl">
      <div className="relative rounded-2xl border border-white/70 bg-white/65 p-3">
        <motion.div
          className="pointer-events-none absolute -left-10 top-1/2 h-20 w-20 -translate-y-1/2 rounded-full bg-[#8ea8e4]/20 blur-2xl"
          animate={{ x: [0, 24, 0], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="pointer-events-none absolute -right-8 top-0 h-16 w-16 rounded-full bg-[#95c5ea]/20 blur-2xl"
          animate={{ y: [0, 14, 0], opacity: [0.45, 0.75, 0.45] }}
          transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative flex items-center gap-2">
          <motion.span
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#7a95ca]/40 bg-[#ebf1ff]"
            animate={{ boxShadow: ['0 0 0 0 rgba(96,126,191,0.25)', '0 0 0 8px rgba(96,126,191,0)', '0 0 0 0 rgba(96,126,191,0)'] }}
            transition={{ duration: 2.2, repeat: Infinity }}
          >
            <BrainCircuit className="h-4 w-4 text-[#4a69ad]" />
          </motion.span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5d6f95]">Agent execution</p>
            <p className="text-sm font-medium text-[#25324f]">{statusText}</p>
          </div>
        </div>

        <div className="relative mt-3 h-8 overflow-hidden rounded-xl border border-white/70 bg-[#f3f6fd]">
          <motion.div
            className="absolute inset-y-0 left-0 w-1/2 bg-[linear-gradient(90deg,rgba(126,150,206,0),rgba(126,150,206,0.45),rgba(126,150,206,0))]"
            animate={{ x: ['-40%', '180%'] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
          />
          <div className="relative flex h-full items-center gap-2 px-2.5">
            {dots.map((dot) => (
              <motion.span
                key={dot}
                className="h-1.5 w-1.5 rounded-full bg-[#7592cb]/70"
                animate={{ y: [0, dot % 2 === 0 ? -4 : 4, 0], opacity: [0.45, 1, 0.45] }}
                transition={{ duration: 1.4 + dot * 0.08, repeat: Infinity, ease: 'easeInOut' }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3">
        <AgentExecutionTimeline steps={steps} />
      </div>
    </div>
  );
}
