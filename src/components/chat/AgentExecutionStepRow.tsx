'use client';

import { CheckCircle2, Circle, CircleAlert, Loader2 } from 'lucide-react';

export type AgentExecutionStepStatus = 'pending' | 'running' | 'completed' | 'failed';

export type AgentExecutionStep = {
  label: string;
  detail?: string;
  status: AgentExecutionStepStatus;
};

type AgentExecutionStepRowProps = {
  step: AgentExecutionStep;
};

const statusStyles: Record<AgentExecutionStepStatus, string> = {
  pending: 'text-[#778194]',
  running: 'bg-[#f4f7ff] text-[#3c4e7a] ring-1 ring-[#dce5ff]',
  completed: 'text-[#3d6a4d]',
  failed: 'bg-[#fff7f5] text-[#90514c] ring-1 ring-[#ffd8d1]',
};

function StepIcon({ status }: { status: AgentExecutionStepStatus }) {
  if (status === 'completed') {
    return <CheckCircle2 className="h-3.5 w-3.5" />;
  }

  if (status === 'running') {
    return <Loader2 className="h-3.5 w-3.5 animate-spin" />;
  }

  if (status === 'failed') {
    return <CircleAlert className="h-3.5 w-3.5" />;
  }

  return <Circle className="h-3.5 w-3.5" />;
}

export function AgentExecutionStepRow({ step }: AgentExecutionStepRowProps) {
  return (
    <li
      className={`flex items-center gap-2 rounded-[10px] px-2 py-1.5 text-[12px] leading-4 ${statusStyles[step.status]}`}
    >
      <span className="shrink-0">
        <StepIcon status={step.status} />
      </span>
      <span className="min-w-0 font-medium">{step.label}</span>
      {step.detail ? (
        <span className="truncate text-[11px] opacity-80">· {step.detail}</span>
      ) : null}
    </li>
  );
}
