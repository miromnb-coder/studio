'use client';

import { Check, Circle, Loader2, AlertTriangle } from 'lucide-react';

export type WorkflowStepStatus = 'pending' | 'running' | 'completed' | 'failed';

type AgentWorkflowStepBoxProps = {
  label: string;
  status: WorkflowStepStatus;
};

function StatusIcon({ status }: { status: WorkflowStepStatus }) {
  if (status === 'completed') {
    return (
      <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#d8ddd5] bg-white text-[#8d988b] shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
        <Check className="h-[14px] w-[14px]" strokeWidth={2.6} />
      </span>
    );
  }

  if (status === 'running') {
    return (
      <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#dce2ea] bg-white text-[#6f7d90] shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
        <span className="absolute inset-0 rounded-full bg-[#edf2f8]" />
        <Loader2 className="relative z-[1] h-[14px] w-[14px] animate-spin" strokeWidth={2.4} />
      </span>
    );
  }

  if (status === 'failed') {
    return (
      <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#ecd8d6] bg-white text-[#ba6762] shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
        <AlertTriangle className="h-[13px] w-[13px]" strokeWidth={2.2} />
      </span>
    );
  }

  return (
    <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#dfe4ea] bg-white text-[#a4acb8] shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <Circle className="h-[10px] w-[10px] fill-current stroke-[0]" />
    </span>
  );
}

function getTone(status: WorkflowStepStatus) {
  if (status === 'running') {
    return {
      outer:
        'border-[#dde4ec] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.98))] shadow-[0_8px_24px_rgba(15,23,42,0.05)]',
      label: 'text-[#394252]',
      glow: 'bg-[#edf3f9]',
      bar: 'bg-[#cfd9e6]',
    };
  }

  if (status === 'completed') {
    return {
      outer:
        'border-[#e3e8ec] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(250,251,252,0.98))] shadow-[0_4px_16px_rgba(15,23,42,0.03)]',
      label: 'text-[#4a5361]',
      glow: 'bg-[#f1f5f1]',
      bar: 'bg-[#d9e1d7]',
    };
  }

  if (status === 'failed') {
    return {
      outer:
        'border-[#ecdedd] bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(253,249,249,0.98))] shadow-[0_4px_16px_rgba(15,23,42,0.03)]',
      label: 'text-[#5a4242]',
      glow: 'bg-[#fbefee]',
      bar: 'bg-[#e7cccc]',
    };
  }

  return {
    outer:
      'border-[#e7ebf0] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(251,252,253,0.98))] shadow-[0_3px_12px_rgba(15,23,42,0.02)]',
    label: 'text-[#596171]',
    glow: 'bg-[#f3f5f8]',
    bar: 'bg-[#d9dfe8]',
  };
}

export function AgentWorkflowStepBox({
  label,
  status,
}: AgentWorkflowStepBoxProps) {
  const tone = getTone(status);

  return (
    <div
      className={`group relative overflow-hidden rounded-[18px] border px-3.5 py-3 ${tone.outer}`}
    >
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-px ${tone.bar}`} />
      <div className={`pointer-events-none absolute -left-8 top-1/2 h-16 w-16 -translate-y-1/2 rounded-full blur-2xl ${tone.glow} opacity-70`} />

      <div className="relative flex min-h-[24px] items-center gap-3">
        <StatusIcon status={status} />

        <div className="min-w-0 flex-1">
          <div
            className={`text-[15px] font-medium leading-[1.35] tracking-[-0.018em] ${tone.label}`}
          >
            {label}
          </div>
        </div>
      </div>
    </div>
  );
}
