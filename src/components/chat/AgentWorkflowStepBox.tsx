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
  const baseClass = 'h-[18px] w-[18px] text-[#7a8b98]';

  if (icon === 'memory') return <Database className={baseClass} strokeWidth={2.05} />;
  if (icon === 'gmail') return <Mail className={baseClass} strokeWidth={2.05} />;
  if (icon === 'research') return <Globe className={baseClass} strokeWidth={2.05} />;
  if (icon === 'compare') return <Waypoints className={baseClass} strokeWidth={2.05} />;
  if (icon === 'finance') return <Wallet className={baseClass} strokeWidth={2.05} />;
  if (icon === 'file') return <FileText className={baseClass} strokeWidth={2.05} />;
  if (icon === 'quality') return <ShieldCheck className={baseClass} strokeWidth={2.05} />;

  if (icon === 'build') {
    return (
      <div className="relative h-[18px] w-[18px] text-[#7a8b98]">
        <Sparkles className="absolute -top-[1px] -left-[1px] h-[12px] w-[12px]" strokeWidth={2.2} />
        <MessageSquare className="absolute bottom-0 right-0 h-[12px] w-[12px]" strokeWidth={2.2} />
      </div>
    );
  }

  return <Circle className={baseClass} strokeWidth={2} />;
}

function StatusIndicator({ status }: { status: WorkflowStepStatus }) {
  if (status === 'completed') {
    return <Check className="h-[18px] w-[18px] text-[#7292a1]" strokeWidth={2.6} />;
  }

  if (status === 'running') {
    return (
      <span className="relative inline-flex h-[18px] w-[18px] items-center justify-center text-[#7f97ac]">
        <span className="absolute h-4 w-4 animate-ping rounded-full bg-[#dbe6ef] opacity-60" />
        <Loader2 className="relative h-[14px] w-[14px] animate-spin" strokeWidth={2.2} />
      </span>
    );
  }

  if (status === 'failed') {
    return (
      <span className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-full border border-[#d8c4c1] text-[11px] leading-none text-[#ae6f68]">
        !
      </span>
    );
  }

  return (
    <span className="inline-flex h-[14px] w-[14px] rounded-full border border-[#c2ced8] bg-[#eef3f7]" />
  );
}

export function AgentWorkflowStepBox({
  label,
  status,
  icon,
}: AgentWorkflowStepBoxProps) {
  return (
    <div className="relative ml-3 rounded-[24px] border border-[#d8dee5] bg-[#eef1f4] px-3.5 py-3 shadow-[0_4px_10px_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#d4dce4] bg-[#e6ebf0] shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]">
          <StepIcon icon={icon} />
        </span>

        <p className="min-w-0 flex-1 text-[17px] font-medium leading-[1.35] tracking-[-0.015em] text-[#2f3947]">
          {label}
        </p>

        <span className="shrink-0 pr-1">
          <StatusIndicator status={status} />
        </span>
      </div>
    </div>
  );
}
