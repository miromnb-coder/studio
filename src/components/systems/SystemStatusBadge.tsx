import type { SystemStatus } from "./types";
import { cn } from "@/lib/utils";

const statusStyles: Record<SystemStatus, string> = {
  active: "bg-success/10 text-success border border-success/20",
  connected: "bg-success/10 text-success border border-success/20",
  idle: "bg-slate-100 text-slate-400 border border-slate-200",
  syncing: "bg-nordic-sage/10 text-nordic-sage border border-nordic-sage/20",
  error: "bg-danger/10 text-danger border border-danger/20",
  disconnected: "bg-amber-100 text-amber-600 border border-amber-200",
};

const labels: Record<SystemStatus, string> = {
  active: "Active",
  connected: "Online",
  idle: "Standby",
  syncing: "Syncing",
  error: "Fault",
  disconnected: "Offline",
};

export function SystemStatusBadge({ status }: { status: SystemStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-widest",
        statusStyles[status]
      )}
    >
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
      {labels[status]}
    </span>
  );
}