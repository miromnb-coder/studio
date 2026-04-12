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
    <div className="rounded-[16px] border border-white/[0.03] bg-white/[0.012] px-3 py-2.5 shadow-[0_8px_22px_rgba(0,0,0,0.15)] backdrop-blur-[14px]">
      <ul className="space-y-2">
        {steps.map((step) => {
          const isRunning = step.status === 'running';
          const isCompleted = step.status === 'completed';
          const isFailed = step.status === 'failed';

          return (
            <li key={step.id} className="flex items-start gap-2">
              <span className="relative mt-[2px] inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center">
                {isCompleted ? (
                  <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-emerald-300/14 bg-emerald-300/8">
                    <Check className="h-2.5 w-2.5 text-emerald-300/90" />
                  </span>
                ) : isFailed ? (
                  <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-rose-300/14 bg-rose-300/8">
                    <CircleAlert className="h-2.5 w-2.5 text-rose-300/90" />
                  </span>
                ) : isRunning ? (
                  <span className="relative inline-flex h-3.5 w-3.5 items-center justify-center">
                    <motion.span
                      className="absolute h-3.5 w-3.5 rounded-full bg-sky-300/10 blur-[2.5px]"
                      animate={{ scale: [0.94, 1.2, 0.94], opacity: [0.32, 0.56, 0.32] }}
                      transition={{ duration: 2.1, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <motion.span
                      className="relative h-1.5 w-1.5 rounded-full bg-sky-300/90"
                      animate={{ scale: [0.92, 1.14, 0.92], opacity: [0.68, 0.94, 0.68] }}
                      transition={{ duration: 1.9, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  </span>
                ) : (
                  <span className="inline-flex h-3.5 w-3.5 items-center justify-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-600/90" />
                  </span>
                )}
              </span>

              <div className="min-w-0">
                <p
                  className={`text-[11.5px] leading-5 ${
                    isRunning
                      ? 'text-zinc-200/95'
                      : isCompleted
                        ? 'text-zinc-300/88'
                        : isFailed
                          ? 'text-zinc-300/88'
                          : 'text-zinc-500'
                  }`}
                >
                  {step.label}
                </p>

                {step.summary ? (
                  <p className="mt-0.5 text-[10.5px] leading-[1.2rem] text-zinc-600">
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
