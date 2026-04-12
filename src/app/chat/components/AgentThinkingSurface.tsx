'use client';

import { ThinkingIndicator } from './ThinkingIndicator';
import { AgentExecutionTimeline, type ExecutionStep } from './AgentExecutionTimeline';

type AgentThinkingSurfaceProps = {
  statusText: string;
  steps: ExecutionStep[];
};

export function AgentThinkingSurface({ statusText, steps }: AgentThinkingSurfaceProps) {
  const running = steps.find((step) => step.status === 'running');
  const failed = steps.find((step) => step.status === 'failed');
  const phase = failed?.label || running?.label || statusText;
  const detail = running?.summary || failed?.summary || 'Reviewing subscriptions and recurring costs';

  return (
    <div className="max-w-[94%] space-y-2.5">
      <ThinkingIndicator phase={phase} detail={detail} />
      <AgentExecutionTimeline steps={steps} />
    </div>
  );
}
