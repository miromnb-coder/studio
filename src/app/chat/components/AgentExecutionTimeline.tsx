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
    <div className="rounded-[18px] border border-white/[0.045] bg-white/[0.018] px-3.5 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.2)] backdrop-blur-[18px]">
      <ul className="space-y-2.5">
        {steps.map((step) => {
          const isRunning = step.status === 'running';
          const isCompleted = step.status === 'completed';
          const isFailed = step.status === 'failed';

          return (
            <li key={step.id} className="flex items-start gap-2.5">
              <span className="relative mt-[3px] inline-flex h-4 w-4 shrink-0 items-center justify-center">
                {isCompleted ? (
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-emerald-300/20 bg-emerald-300/10">
                    <Check className="h-2.5 w-2.5 text-emerald-300" />
                  </span>
                ) : isFailed ? (
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-rose-300/20 bg-rose-300/10">
                    <CircleAlert className="h-2.5 w-2.5 text-rose-300" />
                  </span>
                ) : isRunning ? (
                  <span className="relative inline-flex h-4 w-4 items-center justify-center">
                    <motion.span
                      className="absolute h-4 w-4 rounded-full bg-sky-300/12 blur-[3px]"
                      animate={{ scale: [0.92, 1.25, 0.92], opacity: [0.35, 0.75, 0.35] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <motion.span
                      className="relative h-1.5 w-1.5 rounded-full bg-sky-300"
                      animate={{ scale: [0.92, 1.18, 0.92], opacity: [0.72, 1, 0.72] }}
                      transition={{ duration: 1.55, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  </span>
                ) : (
                  <span className="inline-flex h-4 w-4 items-center justify-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
                  </span>
                )}
              </span>

              <div className="min-w-0">
                <p
                  className={`text-[12px] leading-5 ${
                    isRunning
                      ? 'text-zinc-200'
                      : isCompleted
                        ? 'text-zinc-300'
                        : isFailed
                          ? 'text-zinc-300'
                          : 'text-zinc-400'
                  }`}
                >
                  {step.label}
                </p>

                {step.summary ? (
                  <p className="mt-0.5 text-[11px] leading-5 text-zinc-500">
                    {step.summary}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
