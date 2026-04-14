'use client';

import {
  Check,
  Circle,
  Database,
  FileText,
  Globe,
  Loader2,
  Mail,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Wallet,
  Waypoints,
} from 'lucide-react';

export type WorkflowStepStatus = 'pending' | 'running' | 'completed' | 'failed';

export type WorkflowStepIcon =
  | 'memory'
  | 'gmail'
  | 'research'
  | 'compare'
  | 'finance'
  | 'file'
  | 'quality'
  | 'build'
  | 'process';

type AgentWorkflowStepBoxProps = {
  label: string;
  status: WorkflowStepStatus;
  icon: WorkflowStepIcon;
};

function StepIcon({ icon }: { icon: WorkflowStepIcon }) {
  const baseClass = 'h-[17px] w-[17px] text-[#788894]';

  if (icon === 'memory') {
    return <Database className={baseClass} strokeWidth={2.05} />;
  }

  if (icon === 'gmail') {
    return <Mail className={baseClass} strokeWidth={2.05} />;
  }

  if (icon === 'research') {
    return <Globe className={baseClass} strokeWidth={2.05} />;
  }

  if (icon === 'compare') {
    return <Waypoints className={baseClass} strokeWidth={2.05} />;
  }

  if (icon === 'finance') {
    return <Wallet className={baseClass} strokeWidth={2.05} />;
  }

  if (icon === 'file') {
    return <FileText className={baseClass} strokeWidth={2.05} />;
  }

  if (icon === 'quality') {
    return <ShieldCheck className={baseClass} strokeWidth={2.05} />;
  }

  if (icon === 'build') {
    return (
      <div className="relative h-[17px] w-[17px] text-[#788894]">
        <Sparkles
          className="absolute -left-[1px] -top-[1px] h-[11px] w-[11px]"
          strokeWidth={2.25}
        />
        <MessageSquare
          className="absolute bottom-0 right-0 h-[11px] w-[11px]"
          strokeWidth={2.25}
        />
      </div>
    );
  }

  return <Circle className={baseClass} strokeWidth={2} />;
}

function StatusIndicator({ status }: { status: WorkflowStepStatus }) {
  if (status === 'completed') {
    return (
      <span className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-full">
        <Check className="h-[18px] w-[18px] text-[#7393a0]" strokeWidth={2.65} />
      </span>
    );
  }

  if (status === 'running') {
    return (
      <span className="relative inline-flex h-[22px] w-[22px] items-center justify-center">
        <span className="absolute h-[18px] w-[18px] rounded-full bg-[#dbe6ef] opacity-70 animate-pulse" />
        <Loader2
          className="relative h-[14px] w-[14px] animate-spin text-[#7f97ac]"
          strokeWidth={2.25}
        />
      </span>
    );
  }

  if (status === 'failed') {
    return (
      <span className="inline-flex h-[20px] w-[20px] items-center justify-center rounded-full border border-[#ddc7c4] bg-[#f5eceb] text-[11px] font-semibold leading-none text-[#ad6b64] shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        !
      </span>
    );
  }

  return (
    <span className="inline-flex h-[14px] w-[14px] rounded-full border border-[#c9d3dc] bg-[#eef3f7]" />
  );
}

function getTone(status: WorkflowStepStatus) {
  if (status === 'running') {
    return {
      outer:
        'border-[#d7dee6] bg-[linear-gradient(180deg,rgba(235,239,243,0.92),rgba(232,237,241,0.98))] shadow-[0_8px_20px_rgba(15,23,42,0.045)]',
      iconWrap:
        'border-[#d2dae3] bg-[linear-gradient(180deg,rgba(228,234,239,0.96),rgba(222,229,235,0.98))] shadow-[inset_0_1px_0_rgba(255,255,255,0.48)]',
      label: 'text-[#2e3947]',
      topLine: 'bg-[#edf2f6]',
    };
  }

  if (status === 'completed') {
    return {
      outer:
        'border-[#d9dfe6] bg-[linear-gradient(180deg,rgba(236,240,243,0.9),rgba(233,237,241,0.96))] shadow-[0_6px_16px_rgba(15,23,42,0.035)]',
      iconWrap:
        'border-[#d3dbe3] bg-[linear-gradient(180deg,rgba(229,234,239,0.95),rgba(224,230,235,0.98))] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]',
      label: 'text-[#32404e]',
      topLine: 'bg-[#eff3f6]',
    };
  }

  if (status === 'failed') {
    return {
      outer:
        'border-[#e1d3d0] bg-[linear-gradient(180deg,rgba(241,235,234,0.9),rgba(239,232,231,0.96))] shadow-[0_6px_16px_rgba(15,23,42,0.03)]',
      iconWrap:
        'border-[#ddd0cd] bg-[linear-gradient(180deg,rgba(238,231,230,0.94),rgba(233,226,225,0.98))] shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]',
      label: 'text-[#554341]',
      topLine: 'bg-[#f4eceb]',
    };
  }

  return {
    outer:
      'border-[#dce2e8] bg-[linear-gradient(180deg,rgba(237,241,244,0.9),rgba(234,238,242,0.96))] shadow-[0_5px_14px_rgba(15,23,42,0.03)]',
    iconWrap:
      'border-[#d5dde5] bg-[linear-gradient(180deg,rgba(230,235,240,0.94),rgba(225,231,236,0.98))] shadow-[inset_0_1px_0_rgba(255,255,255,0.48)]',
    label: 'text-[#445161]',
    topLine: 'bg-[#f1f4f7]',
  };
}

export function AgentWorkflowStepBox({
  label,
  status,
  icon,
}: AgentWorkflowStepBoxProps) {
  const tone = getTone(status);

  return (
    <div
      className={`relative ml-4 overflow-hidden rounded-[22px] border px-3.5 py-2.5 ${tone.outer}`}
    >
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-px ${tone.topLine}`} />

      <div className="flex items-center gap-3">
        <span
          className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[18px] border ${tone.iconWrap}`}
        >
          <StepIcon icon={icon} />
        </span>

        <p
          className={`min-w-0 flex-1 text-[16px] font-medium leading-[1.32] tracking-[-0.018em] ${tone.label}`}
        >
          {label}
        </p>

        <span className="shrink-0 pr-0.5">
          <StatusIndicator status={status} />
        </span>
      </div>
    </div>
  );
}
