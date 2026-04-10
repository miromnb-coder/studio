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
  const activeStep = [...steps].reverse().find((step) => step.status === 'running') || steps[steps.length - 1];
  const completed = steps.filter((step) => step.status === 'completed');
  const failed = steps.filter((step) => step.status === 'failed');

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-[#2a2a2a]">
        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-black/10 bg-white">
          {activeStep.status === 'failed' ? (
            <CircleAlert className="h-3 w-3 text-[#a94343]" />
          ) : activeStep.status === 'completed' ? (
            <Check className="h-3 w-3 text-[#1f7a4f]" />
          ) : (
            <motion.span
              className="h-1.5 w-1.5 rounded-full bg-[#5d83d3]"
              animate={{ scale: [1, 1.3, 1], opacity: [0.75, 1, 0.75] }}
              transition={{ duration: 1.05, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </span>
        <p className="font-medium">{activeStep.label}</p>
      </div>
      {(completed.length > 1 || failed.length) ? (
        <details className="rounded-xl border border-black/10 px-2.5 py-2">
          <summary className="cursor-pointer list-none text-[11px] font-medium text-secondary">See reasoning</summary>
          <ul className="mt-2 space-y-1">
            {steps.map((step) => (
              <li key={step.id} className="text-[11px] text-[#555]">• {step.label}: {step.summary || step.status}</li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
