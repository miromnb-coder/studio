'use client';

import { useMemo } from 'react';
import { ThinkingIndicator } from './ThinkingIndicator';
import { AgentExecutionTimeline, type ExecutionStep } from './AgentExecutionTimeline';

type AgentThinkingSurfaceProps = {
  statusText: string;
  steps: ExecutionStep[];
};

export function AgentThinkingSurface({ statusText, steps }: AgentThinkingSurfaceProps) {
  const running = steps.find((step) => step.status === 'running');
  const failed = steps.find((step) => step.status === 'failed');
  const completedCount = steps.filter((step) => step.status === 'completed').length;

  const phase = failed?.label || running?.label || statusText;
  const detail = failed?.summary || running?.summary || 'Reviewing context and preparing the best next action';

  const progressLabel = useMemo(() => {
    if (!steps.length) return 'Preparing workflow';
    if (failed) return 'Needs attention';
    if (running) return `Step ${Math.max(completedCount + 1, 1)} of ${steps.length}`;
    return `${steps.length} steps complete`;
  }, [completedCount, failed, running, steps]);

  const progress = useMemo(() => {
    if (!steps.length) return 12;
    return Math.min(100, Math.round((completedCount / steps.length) * 100));
  }, [completedCount, steps]);

  return (
    <div className="max-w-[96%] space-y-2.5 rounded-[22px] border border-white/[0.06] bg-[linear-gradient(170deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] p-3.5 shadow-[0_14px_30px_rgba(0,0,0,0.24)]">
      <ThinkingIndicator phase={phase} detail={detail} />

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-2.5 py-2">
        <div className="mb-1.5 flex items-center justify-between text-[10.5px] text-zinc-400">
          <span>{progressLabel}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/[0.06]">
          <div
            className="h-1.5 rounded-full bg-gradient-to-r from-sky-300/85 to-indigo-300/90 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {steps.length > 0 ? (
        <div className="px-0.5 pt-0.5">
          <p className="mb-1.5 text-[10.5px] font-medium uppercase tracking-[0.08em] text-zinc-500">
            Visible work
          </p>
          <AgentExecutionTimeline steps={steps} />
        </div>
      ) : null}

      {!steps.length ? (
        <p className="px-0.5 text-[11px] text-zinc-500">
          Preparing stable work steps…
        </p>
      ) : null}
    </div>
  );
}
