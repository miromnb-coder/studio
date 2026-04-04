import type { SystemStatus } from "./types";
import { cn } from "@/lib/utils";

const statusStyles: Record<SystemStatus, string> = {
  active: "bg-success/10 text-success ring-1 ring-success/30",
  connected: "bg-success/10 text-success ring-1 ring-success/30",
  idle: "bg-muted-foreground/10 text-muted-foreground ring-1 ring-muted-foreground/20",
  syncing: "bg-primary/10 text-primary ring-1 ring-primary/30",
  error: "bg-danger/10 text-danger ring-1 ring-danger/30",
  disconnected: "bg-warning/10 text-warning ring-1 ring-warning/30",
};

const labels: Record<SystemStatus, string> = {
  active: "Active",
  connected: "Connected",
  idle: "Idle",
  syncing: "Syncing",
  error: "Error",
  disconnected: "Disconnected",
};

export function SystemStatusBadge({ status }: { status: SystemStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest",
        statusStyles[status]
      )}
    >
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
      {labels[status]}
    </span>
  );
}
