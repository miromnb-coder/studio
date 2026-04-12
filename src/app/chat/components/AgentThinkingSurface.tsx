'use client';

import { useMemo, useState } from 'react';
import { ThinkingIndicator } from './ThinkingIndicator';
import { AgentExecutionTimeline, type ExecutionStep } from './AgentExecutionTimeline';

type AgentThinkingSurfaceProps = {
  statusText: string;
  steps: ExecutionStep[];
};

export function AgentThinkingSurface({ statusText, steps }: AgentThinkingSurfaceProps) {
  const [showDetails, setShowDetails] = useState(false);

  const running = steps.find((step) => step.status === 'running');
  const failed = steps.find((step) => step.status === 'failed');
  const completedCount = steps.filter((step) => step.status === 'completed').length;

  const phase = failed?.label || running?.label || statusText;

  const detail = failed?.summary || running?.summary || 'Reviewing subscriptions and recurring costs';

  const progressLabel = useMemo(() => {
    if (!steps.length) return null;
    if (failed) return 'Execution hit an issue';
    if (running) return `Working through ${Math.max(completedCount + 1, 1)} of ${steps.length} steps`;
    return `${steps.length} steps prepared`;
  }, [completedCount, failed, running, steps]);

  return (
    <div className="max-w-[94%] space-y-1.5">
      <ThinkingIndicator phase={phase} detail={detail} />

      {steps.length > 0 ? (
        <div className="pl-1.5 pt-0.5">
          <button
            type="button"
            onClick={() => setShowDetails((current) => !current)}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.04] bg-white/[0.012] px-2.5 py-1 text-[10.5px] font-medium tracking-[0.005em] text-zinc-500 transition-all duration-200 hover:border-white/[0.065] hover:bg-white/[0.024] hover:text-zinc-400"
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                failed
                  ? 'bg-rose-300/90'
                  : running
                    ? 'bg-sky-300/90'
                    : 'bg-zinc-500/90'
              }`}
            />
            <span>{progressLabel || 'Working through steps'}</span>
            <span className="text-zinc-600">{showDetails ? 'Hide' : 'Details'}</span>
          </button>
        </div>
      ) : null}

      {showDetails ? (
        <div className="pt-0.5 pl-0.5">
          <AgentExecutionTimeline steps={steps} />
        </div>
      ) : null}
    </div>
  );
}
