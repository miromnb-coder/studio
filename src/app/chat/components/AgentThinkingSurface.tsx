'use client';

import { ThinkingCore } from '@/components/ai/ThinkingCore';
import { type ExecutionStep } from './AgentExecutionTimeline';

type AgentThinkingSurfaceProps = {
  statusText: string;
  steps: ExecutionStep[];
};

export function AgentThinkingSurface({ statusText, steps }: AgentThinkingSurfaceProps) {
  const running = steps.find((step) => step.status === 'running');
  const failed = steps.find((step) => step.status === 'failed');
  const state = failed ? 'responding' : running ? 'processing' : 'thinking';

  return (
    <div className="space-y-2 px-1 py-0.5">
      <div className="rounded-2xl border border-black/5 bg-white/70 px-3 py-3 backdrop-blur-sm">
        <ThinkingCore state={state} />
        <p className="pt-1 text-xs text-[#4d5a74]">{statusText}</p>
      </div>
    </div>
  );
}
