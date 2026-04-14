'use client';

import { Check, Circle, Loader2 } from 'lucide-react';

export type WorkflowStepStatus = 'pending' | 'running' | 'completed' | 'failed';

type AgentWorkflowStepBoxProps = {
  label: string;
  status: WorkflowStepStatus;
};

function StatusIcon({ status }: { status: WorkflowStepStatus }) {
  if (status === 'completed') {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#d7ddd6] bg-white text-[#8f9893] shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
        <Check className="h-[14px] w-[14px]" strokeWidth={2.5} />
      </span>
    );
  }

  if (status === 'running') {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#d9dee5] bg-white text-[#7f8896] shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
        <Loader2 className="h-[14px] w-[14px] animate-spin" strokeWidth={2.3} />
      </span>
    );
  }

  if (status === 'failed') {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#ead9d9] bg-white text-[#b56565] shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
        <span className="text-[13px] font-semibold leading-none">!</span>
      </span>
    );
  }

  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#dde2e8] bg-white text-[#a2aab6] shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <Circle className="h-[11px] w-[11px]" strokeWidth={2.2} />
    </span>
  );
}

function toneStyles(status: WorkflowStepStatus) {
  if (status === 'running') {
    return 'border-[#dfe4ea] bg-[#fbfcfd] shadow-[0_2px_6px_rgba(15,23,42,0.03)]';
  }

  if (status === 'completed') {
    return 'border-[#e3e7ec] bg-[#fafbfc] shadow-[0_1px_4px_rgba(15,23,42,0.025)]';
  }

  if (status === 'failed') {
    return 'border-[#eddcdb] bg-[#fdf8f8] shadow-[0_1px_4px_rgba(15,23,42,0.025)]';
  }

  return 'border-[#e7ebf0] bg-[#fcfcfd] shadow-[0_1px_4px_rgba(15,23,42,0.02)]';
}

export function AgentWorkflowStepBox({
  label,
  status,
}: AgentWorkflowStepBoxProps) {
  return (
    <div
      className={`flex min-h-[44px] items-center gap-3 rounded-[16px] border px-4 py-3 text-[#2f3746] ${toneStyles(
        status,
      )}`}
    >
      <StatusIcon status={status} />

      <span className="min-w-0 flex-1 text-[15px] font-medium leading-[1.32] tracking-[-0.015em] text-[#464e5b]">
        {label}
      </span>
    </div>
  );
}
