'use client';

import { CheckCircle2, Circle, CircleAlert, Loader2 } from 'lucide-react';

export type WorkflowStepStatus = 'pending' | 'running' | 'completed' | 'failed';

type AgentWorkflowStepBoxProps = {
  label: string;
  status: WorkflowStepStatus;
};

function StatusIcon({ status }: { status: WorkflowStepStatus }) {
  if (status === 'completed') {
    return <CheckCircle2 className="h-4 w-4 text-[#2f7a49]" aria-hidden="true" />;
  }

  if (status === 'running') {
    return <Loader2 className="h-4 w-4 animate-spin text-[#3f5ea8]" aria-hidden="true" />;
  }

  if (status === 'failed') {
    return <CircleAlert className="h-4 w-4 text-[#b54d49]" aria-hidden="true" />;
  }

  return <Circle className="h-4 w-4 text-[#8b96a8]" aria-hidden="true" />;
}

const toneStyles: Record<WorkflowStepStatus, string> = {
  completed: 'border-[#d8eadf] bg-[#f4fbf6]',
  running: 'border-[#d8e3ff] bg-[#f4f7ff]',
  pending: 'border-[#e5e9f0] bg-[#fafbfd]',
  failed: 'border-[#f6d8d3] bg-[#fff7f6]',
};

export function AgentWorkflowStepBox({ label, status }: AgentWorkflowStepBoxProps) {
  return (
    <div
      className={`flex items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-[13px] leading-5 text-[#2f3746] ${toneStyles[status]}`}
    >
      <StatusIcon status={status} />
      <span className="font-medium">{label}</span>
    </div>
  );
}
