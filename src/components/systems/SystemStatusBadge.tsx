import type { SystemStatus } from "./types";
import { cn } from "@/lib/utils";

const statusStyles: Record<SystemStatus, string> = {
  active: "bg-success/10 text-success border-success/20",
  connected: "bg-success/5 text-success border-success/10",
  idle: "bg-slate-100 text-slate-400 border-slate-200",
  syncing: "bg-primary/10 text-primary border-primary/20",
  error: "bg-danger/10 text-danger border-danger/20",
  disconnected: "bg-slate-100 text-slate-400 border-slate-200",
};

const labels: Record<SystemStatus, string> = {
  active: "Operational",
  connected: "Connected",
  idle: "Standby",
  syncing: "Syncing",
  error: "Critical",
  disconnected: "Offline",
};

export function SystemStatusBadge({ status }: { status: SystemStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider",
        statusStyles[status]
      )}
    >
      <span className={cn(
        "mr-1.5 h-1.5 w-1.5 rounded-full bg-current",
        status === 'active' || status === 'syncing' ? "animate-pulse" : ""
      )} />
      {labels[status]}
    </span>
  );
}