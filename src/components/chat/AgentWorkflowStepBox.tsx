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

function StepIcon({ icon, status }: { icon: WorkflowStepIcon; status: WorkflowStepStatus }) {
  const baseClass =
    status === 'running'
      ? 'h-[17px] w-[17px] text-[#66788a]'
      : status === 'completed'
        ? 'h-[17px] w-[17px] text-[#6f8292]'
        : status === 'failed'
          ? 'h-[17px] w-[17px] text-[#8c6b67]'
          : 'h-[17px] w-[17px] text-[#7e8b98]';

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
      <div className="relative h-[17px] w-[17px]">
        <Sparkles
          className={`absolute -left-[1px] -top-[1px] h-[11px] w-[11px] ${
            status === 'running'
              ? 'text-[#66788a]'
              : status === 'completed'
                ? 'text-[#6f8292]'
                : status === 'failed'
                  ? 'text-[#8c6b67]'
                  : 'text-[#7e8b98]'
          }`}
          strokeWidth={2.2}
        />
        <MessageSquare
          className={`absolute bottom-0 right-0 h-[11px] w-[11px] ${
            status === 'running'
              ? 'text-[#66788a]'
              : status === 'completed'
                ? 'text-[#6f8292]'
                : status === 'failed'
                  ? 'text-[#8c6b67]'
                  : 'text-[#7e8b98]'
          }`}
          strokeWidth={2.2}
        />
      </div>
    );
  }

  return <Circle className={baseClass} strokeWidth={2} />;
}

function StatusIndicator({ status }: { status: WorkflowStepStatus }) {
  if (status === 'completed') {
    return (
      <span className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[rgba(237,243,248,0.86)]">
        <Check className="h-[16px] w-[16px] text-[#7690a3]" strokeWidth={2.8} />
      </span>
    );
  }

  if (status === 'running') {
    return (
      <span className="relative inline-flex h-[22px] w-[22px] items-center justify-center">
        <span className="absolute h-[18px] w-[18px] rounded-full bg-[rgba(216,228,238,0.72)] animate-pulse" />
        <Loader2
          className="relative h-[13px] w-[13px] animate-spin text-[#7b94a8]"
          strokeWidth={2.3}
        />
      </span>
    );
  }

  if (status === 'failed') {
    return (
      <span className="inline-flex h-[20px] w-[20px] items-center justify-center rounded-full border border-[#e2d1cf] bg-[rgba(244,235,234,0.92)] text-[11px] font-semibold leading-none text-[#ae6d66]">
        !
      </span>
    );
  }

  return (
    <span className="inline-flex h-[14px] w-[14px] rounded-full border border-[rgba(203,212,222,0.9)] bg-[rgba(241,245,249,0.92)]" />
  );
}

function getTone(status: WorkflowStepStatus) {
  if (status === 'running') {
    return {
      outer:
        'border-[rgba(217,225,233,0.85)] bg-[linear-gradient(180deg,rgba(255,255,255,0.62),rgba(246,249,252,0.72))] shadow-[0_12px_28px_rgba(15,23,42,0.04)]',
      iconWrap:
        'border-[rgba(211,220,228,0.95)] bg-[linear-gradient(180deg,rgba(244,248,251,0.96),rgba(236,242,247,0.98))]',
      label: 'text-[#2f3b48]',
      topLine: 'bg-[rgba(255,255,255,0.78)]',
    };
  }

  if (status === 'completed') {
    return {
      outer:
        'border-[rgba(221,227,234,0.86)] bg-[linear-gradient(180deg,rgba(255,255,255,0.56),rgba(244,247,251,0.68))] shadow-[0_10px_24px_rgba(15,23,42,0.032)]',
      iconWrap:
        'border-[rgba(214,222,230,0.92)] bg-[linear-gradient(180deg,rgba(243,247,250,0.96),rgba(236,241,246,0.98))]',
      label: 'text-[#344150]',
      topLine: 'bg-[rgba(255,255,255,0.74)]',
    };
  }

  if (status === 'failed') {
    return {
      outer:
        'border-[rgba(230,216,214,0.92)] bg-[linear-gradient(180deg,rgba(250,244,243,0.66),rgba(246,239,238,0.8))] shadow-[0_8px_18px_rgba(15,23,42,0.02)]',
      iconWrap:
        'border-[rgba(224,211,208,0.94)] bg-[linear-gradient(180deg,rgba(246,238,237,0.96),rgba(241,232,231,0.98))]',
      label: 'text-[#5a4744]',
      topLine: 'bg-[rgba(255,255,255,0.68)]',
    };
  }

  return {
    outer:
      'border-[rgba(224,229,235,0.9)] bg-[linear-gradient(180deg,rgba(255,255,255,0.48),rgba(243,246,250,0.58))] shadow-[0_8px_18px_rgba(15,23,42,0.024)]',
    iconWrap:
      'border-[rgba(216,223,230,0.92)] bg-[linear-gradient(180deg,rgba(242,246,250,0.94),rgba(235,240,245,0.98))]',
    label: 'text-[#465363]',
    topLine: 'bg-[rgba(255,255,255,0.66)]',
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
      className={`relative overflow-hidden rounded-[24px] border px-3.5 py-3 ${tone.outer}`}
    >
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-px ${tone.topLine}`}
      />

      <div className="flex items-center gap-3">
        <span
          className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[18px] border ${tone.iconWrap}`}
        >
          <StepIcon icon={icon} status={status} />
        </span>

        <p
          className={`min-w-0 flex-1 text-[15px] font-medium leading-[1.35] tracking-[-0.02em] ${tone.label}`}
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
