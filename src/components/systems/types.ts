import type { ReactNode } from "react";

export type SystemStatus =
  | "active"
  | "idle"
  | "error"
  | "syncing"
  | "connected"
  | "disconnected";

export type ActionVariant = "primary" | "secondary" | "ghost";

export type SystemAction = {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: ActionVariant;
  loading?: boolean;
  disabled?: boolean;
};

export type SystemMetric = {
  label: string;
  value: string;
  hint?: string;
};

export type SystemModule = {
  id: string;
  title: string;
  description: string;
  status: SystemStatus;
  value?: string;
  subvalue?: string;
  accent?: string;
  metrics?: SystemMetric[];
  actions: SystemAction[];
  details?: ReactNode;
  emptyState?: string;
};

export type ValueStripItem = {
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "warning";
};
