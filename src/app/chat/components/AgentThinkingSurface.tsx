'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ThinkingIndicator } from './ThinkingIndicator';
import { AgentExecutionTimeline, type ExecutionStep } from './AgentExecutionTimeline';

type AgentThinkingSurfaceProps = {
  statusText: string;
  steps: ExecutionStep[];
};

function buildFallbackDetail(statusText: string) {
  const normalized = statusText.toLowerCase();

  if (normalized.includes('memory')) return 'Reviewing relevant memory and user context';
  if (normalized.includes('subscription')) return 'Checking recurring costs and billing signals';
  if (normalized.includes('context')) return 'Reviewing context before forming a recommendation';
  if (normalized.includes('rank')) return 'Comparing options and ranking the strongest next move';
  if (normalized.includes('recommend')) return 'Shaping the clearest recommendation for this situation';
  if (normalized.includes('plan')) return 'Mapping the best next steps before answering';

  return 'Reviewing context and preparing the best next action';
}

export function AgentThinkingSurface({ statusText, steps }: AgentThinkingSurfaceProps) {
  const running = steps.find((step) => step.status === 'running');
  const failed = steps.find((step) => step.status === 'failed');
  const completed = steps.filter((step) => step.status === 'completed');
  const pending = steps.filter((step) => step.status === 'pending');

  const activePhase = failed?.label || running?.label || statusText || 'Preparing recommendation';
  const activeDetail =
    failed?.summary ||
    running?.summary ||
    buildFallbackDetail(activePhase);

  const progressLabel = useMemo(() => {
    if (!steps.length) return 'Preparing work';
    if (failed) return 'Work paused';
    if (running) return `${Math.max(completed.length + 1, 1)} of ${steps.length} steps in progress`;
    if (pending.length > 0) return `${completed.length} of ${steps.length} steps completed`;
    return `${steps.length} steps completed`;
  }, [completed.length, failed, pending.length, running, steps.length]);

  const progress = useMemo(() => {
    if (!steps.length) return 10;
    if (failed) return Math.max(18, Math.round((completed.length / steps.length) * 100));
    if (running) {
      return Math.min(
        94,
        Math.max(18, Math.round(((completed.length + 0.55) / steps.length) * 100)),
      );
    }
    return Math.min(100, Math.max(24, Math.round((completed.length / steps.length) * 100)));
  }, [completed.length, failed, running, steps.length]);

  const helperCopy = useMemo(() => {
    if (!steps.length) return 'Building stable work steps…';
    if (failed) return 'Kivo hit a small issue but is preserving the work already completed.';
    if (running) return 'Live work remains visible while the answer is being prepared.';
    return 'Completed work stays visible so the reasoning path is easy to follow.';
  }, [failed, running, steps.length]);

  return (
    <div className="max-w-[96%] space-y-3">
      <motion.div
        initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -6, filter: 'blur(3px)' }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden rounded-[24px] border border-white/[0.06] bg-[linear-gradient(165deg,rgba(255,255,255,0.055),rgba(255,255,255,0.018))] p-3.5 shadow-[0_14px_30px_rgba(0,0,0,0.22)] backdrop-blur-xl"
      >
        <ThinkingIndicator phase={activePhase} detail={activeDetail} compact />

        <div className="mt-3 rounded-[18px] border border-white/[0.05] bg-white/[0.02] px-3 py-2.5">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-zinc-500">
                Working now
              </p>
              <p className="mt-0.5 truncate text-[12px] text-zinc-400">
                {progressLabel}
              </p>
            </div>
            <div className="shrink-0 rounded-full border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[11px] text-zinc-300">
              {progress}%
            </div>
          </div>

          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <motion.div
              className="h-full rounded-full bg-[linear-gradient(90deg,rgba(125,211,252,0.9),rgba(165,180,252,0.88))]"
              initial={{ width: '8%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>

        <div className="mt-3 px-0.5">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-[10.5px] font-medium uppercase tracking-[0.1em] text-zinc-500">
              Visible work
            </p>
            {steps.length ? (
              <p className="text-[11px] text-zinc-500">
                {completed.length}/{steps.length}
              </p>
            ) : null}
          </div>

          {steps.length > 0 ? (
            <AgentExecutionTimeline steps={steps} />
          ) : (
            <div className="rounded-[18px] border border-white/[0.05] bg-white/[0.02] px-3 py-2.5">
              <p className="text-[12px] text-zinc-500">{helperCopy}</p>
            </div>
          )}
        </div>

        {steps.length > 0 ? (
          <div className="mt-3 rounded-[18px] border border-white/[0.05] bg-white/[0.02] px-3 py-2.5">
            <p className="text-[12px] leading-5 text-zinc-400">
              {helperCopy}
            </p>
          </div>
        ) : null}
      </motion.div>
    </div>
  );
}
