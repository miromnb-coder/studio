import { ToolStatus } from './types';
import { cn } from '@/lib/utils';

export function ToolStatusBadge({ status }: { status: ToolStatus }) {
  const styles: Record<ToolStatus, string> = {
    active: "bg-success/10 text-success border-success/20",
    installed: "bg-primary/10 text-primary border-primary/20",
    available: "bg-slate-100 text-slate-400 border-slate-200",
    disabled: "bg-slate-100 text-slate-400 border-slate-200",
    error: "bg-danger/10 text-danger border-danger/20"
  };

  const labels: Record<ToolStatus, string> = {
    active: "Operational",
    installed: "Ready",
    available: "Available",
    disabled: "Offline",
    error: "Critical"
  };

  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider",
      styles[status]
    )}>
      <span className={cn(
        "mr-1.5 h-1 w-1 rounded-full bg-current",
        status === 'active' ? "animate-pulse" : ""
      )} />
      {labels[status]}
    </span>
  );
}
