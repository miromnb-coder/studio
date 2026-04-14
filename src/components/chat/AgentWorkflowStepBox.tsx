'use client';

import { Check, ChevronDown, Circle, Github, Loader2, TerminalSquare } from 'lucide-react';

export type WorkflowStepStatus = 'pending' | 'running' | 'completed' | 'failed';

type AgentWorkflowStepBoxProps = {
  label: string;
  status: WorkflowStepStatus;
};

function StatusIcon({ status }: { status: WorkflowStepStatus }) {
  if (status === 'completed') {
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#d7ddd7] bg-white text-[#8e9797] shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <Check className="h-[13px] w-[13px]" strokeWidth={2.4} />
      </span>
    );
  }

  if (status === 'running') {
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#dadfe6] bg-white text-[#7d8796] shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <Loader2 className="h-[13px] w-[13px] animate-spin" strokeWidth={2.2} />
      </span>
    );
  }

  if (status === 'failed') {
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#e7d4d4] bg-white text-[#b35d5d] shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <span className="text-[13px] font-semibold leading-none">!</span>
      </span>
    );
  }

  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#dadfe6] bg-white text-[#9aa3b1] shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <Circle className="h-[11px] w-[11px]" strokeWidth={2.1} />
    </span>
  );
}

function StepTone({ status }: { status: WorkflowStepStatus }) {
  if (status === 'running') {
    return 'border-[#dfe4eb] bg-[#fbfcfd] shadow-[0_1px_2px_rgba(15,23,42,0.03)]';
  }

  if (status === 'completed') {
    return 'border-[#e2e7ec] bg-[#fafbfc] shadow-[0_1px_2px_rgba(15,23,42,0.02)]';
  }

  if (status === 'failed') {
    return 'border-[#ecdcdc] bg-[#fdf8f8] shadow-[0_1px_2px_rgba(15,23,42,0.02)]';
  }

  return 'border-[#e7ebf0] bg-[#fcfcfd] shadow-[0_1px_2px_rgba(15,23,42,0.02)]';
}

function inferMiniIcon(label: string) {
  const text = label.toLowerCase();

  if (/github|repo|repository/.test(text)) {
    return <Github className="h-[13px] w-[13px]" strokeWidth={2.1} />;
  }

  if (/src\/|file|tiedosto|planner|synthesizer|agent/.test(text)) {
    return <TerminalSquare className="h-[13px] w-[13px]" strokeWidth={2.1} />;
  }

  return null;
}

export function AgentWorkflowStepBox({
  label,
  status,
}: AgentWorkflowStepBoxProps) {
  const miniIcon = inferMiniIcon(label);

  return (
    <div
      className={`flex min-h-[52px] items-center gap-3 rounded-[18px] border px-3.5 py-3 text-[#2f3746] ${StepTone({
        status,
      })}`}
    >
      <StatusIcon status={status} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2.5">
          {miniIcon ? (
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[8px] border border-[#e3e7ec] bg-white text-[#727b88] shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
              {miniIcon}
            </span>
          ) : null}

          <span className="line-clamp-2 text-[15px] font-medium leading-[1.35] tracking-[-0.015em] text-[#3a4250]">
            {label}
          </span>
        </div>
      </div>

      <span className="shrink-0 text-[#9ba3af]">
        <ChevronDown className="h-[16px] w-[16px]" strokeWidth={2.2} />
      </span>
    </div>
  );
}
