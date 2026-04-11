'use client';

import { motion } from 'framer-motion';
import { Check, CircleAlert, CircleDot } from 'lucide-react';

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
    <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-zinc-400">
        <CircleDot className="h-3.5 w-3.5" />
        <p>Live tool timeline</p>
      </div>
      <div className="flex items-center gap-2 text-sm text-zinc-100">
        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-white/15 bg-white/[0.03]">
          {activeStep.status === 'failed' ? (
            <CircleAlert className="h-3 w-3 text-rose-300" />
          ) : activeStep.status === 'completed' ? (
            <Check className="h-3 w-3 text-emerald-300" />
          ) : (
            <motion.span
              className="h-1.5 w-1.5 rounded-full bg-sky-300"
              animate={{ scale: [1, 1.3, 1], opacity: [0.75, 1, 0.75] }}
              transition={{ duration: 1.05, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </span>
        <p className="font-medium">{activeStep.label}</p>
      </div>
      {(completed.length > 0 || failed.length > 0) ? (
        <details className="rounded-xl border border-white/10 px-2.5 py-2">
          <summary className="cursor-pointer list-none text-[11px] font-medium tracking-[0.08em] text-zinc-400">Expand steps</summary>
          <ul className="mt-2 space-y-2">
            {steps.map((step, idx) => (
              <li key={step.id} className="flex items-start gap-2 text-[11px] text-zinc-300">
                <span className={`mt-0.5 h-1.5 w-1.5 rounded-full ${step.status === 'completed' ? 'bg-emerald-300' : step.status === 'failed' ? 'bg-rose-300' : idx === steps.length - 1 ? 'bg-sky-300' : 'bg-zinc-600'}`} />
                <span>{step.label}{step.summary ? ` — ${step.summary}` : ''}</span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
