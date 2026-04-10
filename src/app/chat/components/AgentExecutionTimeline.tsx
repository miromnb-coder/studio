'use client';

import { motion } from 'framer-motion';
import { Check, CircleAlert } from 'lucide-react';

export type ExecutionStepStatus = 'pending' | 'running' | 'completed' | 'failed';

export type ExecutionStep = {
  id: string;
  label: string;
  status: ExecutionStepStatus;
  summary?: string;
};

type AgentExecutionTimelineProps = {
  steps: ExecutionStep[];
};

export function AgentExecutionTimeline({ steps }: AgentExecutionTimelineProps) {
  if (!steps.length) return null;

  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white/65 p-3 backdrop-blur-md">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6b6b6b]">Execution timeline</p>
      <ul className="space-y-2">
        {steps.map((step, idx) => {
          const isRunning = step.status === 'running';
          const isCompleted = step.status === 'completed';
          const isFailed = step.status === 'failed';
          return (
            <li key={step.id} className="relative pl-6">
              {idx < steps.length - 1 ? <span className="absolute left-[8px] top-4 h-[calc(100%+2px)] w-px bg-black/10" /> : null}
              <span className="absolute left-0 top-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full border border-black/10 bg-white">
                {isCompleted ? (
                  <Check className="h-3 w-3 text-[#1f7a4f]" />
                ) : isFailed ? (
                  <CircleAlert className="h-3 w-3 text-[#a94343]" />
                ) : isRunning ? (
                  <motion.span
                    className="h-1.5 w-1.5 rounded-full bg-[#5d83d3]"
                    animate={{ scale: [1, 1.4, 1], opacity: [0.75, 1, 0.75] }}
                    transition={{ duration: 1.05, repeat: Infinity, ease: 'easeInOut' }}
                  />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-[#b3b3b3]" />
                )}
              </span>

              <div className={`rounded-xl border px-2.5 py-2 ${isRunning ? 'border-[#7f99d5]/45 bg-[#edf2ff]' : isCompleted ? 'border-black/5 bg-white/80' : isFailed ? 'border-[#d2a4a4]/60 bg-[#fff7f7]' : 'border-black/5 bg-white/60'}`}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-[#2a2a2a]">{step.label}</p>
                  <span className={`text-[10px] uppercase tracking-[0.12em] ${isRunning ? 'text-[#4d6db2]' : isCompleted ? 'text-[#447858]' : isFailed ? 'text-[#a84343]' : 'text-[#848484]'}`}>
                    {step.status}
                  </span>
                </div>
                {step.summary ? <p className="mt-1 text-[11px] text-[#606060]">{step.summary}</p> : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
