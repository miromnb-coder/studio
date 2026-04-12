'use client';

import { motion } from 'framer-motion';
import { Check, ChevronDown, CircleAlert } from 'lucide-react';

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
  const completedCount = steps.filter((step) => step.status === 'completed').length;
  const failedCount = steps.filter((step) => step.status === 'failed').length;
  const totalCount = steps.length;

  return (
    <details className="group rounded-2xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-2.5 shadow-[0_10px_28px_rgba(0,0,0,0.24)] backdrop-blur-xl">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xs text-zinc-400 marker:content-none">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.02]">
            {activeStep.status === 'failed' ? (
              <CircleAlert className="h-3 w-3 text-rose-300" />
            ) : activeStep.status === 'completed' ? (
              <Check className="h-3 w-3 text-emerald-300" />
            ) : (
              <motion.span
                className="h-1.5 w-1.5 rounded-full bg-sky-300"
                animate={{ scale: [0.95, 1.25, 0.95], opacity: [0.72, 1, 0.72] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
          </span>
          <p className="truncate text-[12px] tracking-[0.01em] text-zinc-300">
            {failedCount > 0 ? 'Encountered an issue in execution' : `Working through ${Math.max(completedCount + (activeStep.status === 'running' ? 1 : 0), 1)} of ${totalCount} steps`}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.08em] text-zinc-500 transition group-open:text-zinc-400">
          Details
          <ChevronDown className="h-3.5 w-3.5 transition group-open:rotate-180" />
        </span>
      </summary>

      <div className="mt-2 hidden border-t border-white/[0.08] pt-2.5 group-open:block">
        <ul className="space-y-2">
          {steps.map((step) => (
            <li key={step.id} className="flex items-start gap-2.5 text-[11px] text-zinc-300">
              <span
                className={`mt-1 h-1.5 w-1.5 rounded-full ${
                  step.status === 'completed'
                    ? 'bg-emerald-300'
                    : step.status === 'failed'
                      ? 'bg-rose-300'
                      : step.status === 'running'
                        ? 'bg-sky-300'
                        : 'bg-zinc-600'
                }`}
              />
              <span className="leading-5 text-zinc-400">
                <span className="text-zinc-300">{step.label}</span>
                {step.summary ? ` — ${step.summary}` : ''}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
