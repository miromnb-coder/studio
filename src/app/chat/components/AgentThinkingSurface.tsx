'use client';

import { ThinkingIndicator } from './ThinkingIndicator';
import { type ExecutionStep } from './AgentExecutionTimeline';

type AgentThinkingSurfaceProps = {
  statusText: string;
  steps: ExecutionStep[];
};

export function AgentThinkingSurface({ statusText, steps }: AgentThinkingSurfaceProps) {
  const running = steps.find((step) => step.status === 'running');
  const failed = steps.find((step) => step.status === 'failed');
  const phase = failed?.label || running?.label || statusText;

  return (
    <div className="max-w-[80%]">
      <ThinkingIndicator phase={phase} />
    </div>
  );
}
