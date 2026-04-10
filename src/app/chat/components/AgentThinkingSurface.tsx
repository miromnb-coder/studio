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
    <div className="space-y-2 px-1 py-0.5">
      <div className="flex items-center gap-2 text-sm text-[#2d3b57]">
        <motion.span
          className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#7a95ca]/30 bg-[#ebf1ff]"
          animate={{ boxShadow: ['0 0 0 0 rgba(96,126,191,0.2)', '0 0 0 8px rgba(96,126,191,0)', '0 0 0 0 rgba(96,126,191,0)'] }}
          transition={{ duration: 2.2, repeat: Infinity }}
        >
          <BrainCircuit className="h-3.5 w-3.5 text-[#4a69ad]" />
        </motion.span>
        <motion.p key={statusText} initial={{ opacity: 0.35 }} animate={{ opacity: 1 }} className="font-medium">
          {statusText}
        </motion.p>
        <div className="ml-auto flex items-center gap-1">
          {dots.slice(0, 3).map((dot) => (
            <motion.span
              key={dot}
              className="h-1.5 w-1.5 rounded-full bg-[#7592cb]/70"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: dot * 0.14 }}
            />
          ))}
        </div>
      </div>

      <div>
        <AgentExecutionTimeline steps={steps} />
      </div>
    </div>
  );
}
