import type { SystemStatus } from "./types";
import { cn } from "@/lib/utils";

const statusStyles: Record<SystemStatus, string> = {
  active: "bg-primary/10 text-primary border border-primary/30 shadow-[0_0_10px_rgba(225,29,72,0.2)]",
  connected: "bg-success/10 text-success border border-success/30",
  idle: "bg-stealth-slate text-muted-foreground border border-muted-foreground/30",
  syncing: "bg-primary/10 text-primary border border-primary/30",
  error: "bg-primary/20 text-primary border border-primary shadow-[0_0_15px_rgba(225,29,72,0.4)]",
  disconnected: "bg-stealth-slate text-muted-foreground border border-muted-foreground/20",
};

const labels: Record<SystemStatus, string> = {
  active: "Operational",
  connected: "Online",
  idle: "Standby",
  syncing: "Syncing",
  error: "Critical",
  disconnected: "Offline",
};

export function SystemStatusBadge({ status }: { status: SystemStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest",
        statusStyles[status]
      )}
    >
      <span className={cn(
        "mr-1.5 h-1 w-1 bg-current",
        status === 'active' || status === 'error' ? "animate-glow-pulse" : ""
      )} />
      {labels[status]}
    </span>
  );
}
