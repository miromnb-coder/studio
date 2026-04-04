"use client";

import Link from "next/link";
import { ExpandableSection } from "./ExpandableSection";
import { SystemStatusBadge } from "./SystemStatusBadge";
import type { SystemAction, SystemModule } from "./types";
import { cn } from "@/lib/utils";
import { Loader2, ArrowRight, ChevronRight } from "lucide-react";

function ActionButton({ action }: { action: SystemAction }) {
  const base =
    "inline-flex items-center justify-center rounded-2xl px-5 py-3 text-[11px] font-bold uppercase tracking-widest transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50";

  const variantClass =
    action.variant === "ghost"
      ? "text-muted-foreground hover:bg-white/5 hover:text-white"
      : action.variant === "secondary"
      ? "bg-white/[0.03] text-foreground border border-white/5 hover:bg-white/10 hover:border-white/10"
      : "bg-primary text-background hover:scale-[1.02] shadow-lg shadow-primary/10 active:scale-[0.98]";

  if (action.href) {
    return (
      <Link className={cn(base, variantClass)} href={action.href}>
        {action.label}
        {action.variant === 'primary' && <ChevronRight className="w-3.5 h-3.5 ml-1.5" />}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={action.onClick}
      disabled={action.disabled || action.loading}
      className={cn(base, variantClass)}
    >
      {action.loading && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
      {action.label}
      {!action.loading && action.variant === 'primary' && <ChevronRight className="w-3.5 h-3.5 ml-1.5" />}
    </button>
  );
}

export function SystemModuleCard({ system }: { system: SystemModule }) {
  return (
    <section className="premium-card !p-8 flex flex-col justify-between h-full group">
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-bold font-headline text-white tracking-tight group-hover:text-primary transition-colors">{system.title}</h3>
              <SystemStatusBadge status={system.status} />
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground/70 font-medium max-w-sm">
              {system.description}
            </p>
          </div>

          {system.value ? (
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground/40 mb-1">
                Yield
              </div>
              <div className="text-3xl font-bold font-headline text-white tracking-tighter tabular-nums text-gradient">
                {system.value}
              </div>
              {system.subvalue ? (
                <div className="text-[10px] font-bold text-primary/60 uppercase tracking-widest mt-1">{system.subvalue}</div>
              ) : null}
            </div>
          ) : null}
        </div>

        {system.metrics?.length ? (
          <div className="grid gap-4 sm:grid-cols-2 mb-8">
            {system.metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-[1.5rem] border border-white/[0.03] bg-white/[0.01] px-5 py-4 group/metric hover:bg-white/[0.03] transition-colors"
              >
                <div className="text-[9px] uppercase font-bold tracking-[0.2em] text-muted-foreground/40 mb-1 group-hover/metric:text-primary/40 transition-colors">
                  {metric.label}
                </div>
                <div className="text-lg font-bold text-white tracking-tight">
                  {metric.value}
                </div>
                {metric.hint ? (
                  <div className="mt-1.5 text-[10px] font-medium text-muted-foreground/30">{metric.hint}</div>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3 mb-8">
          {system.actions.map((action) => (
            <ActionButton
              key={`${system.id}-${action.label}`}
              action={action}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10">
        <ExpandableSection label="Operational Diagnostics">
          {system.details ? (
            system.details
          ) : system.emptyState ? (
            <div className="text-[11px] italic opacity-40 font-medium uppercase tracking-widest">{system.emptyState}</div>
          ) : (
            <div className="text-[11px] italic opacity-40 font-medium uppercase tracking-widest">No active diagnostic logs for this cycle.</div>
          )}
        </ExpandableSection>
      </div>
      
      {/* Dynamic Glow Background */}
      <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-primary/5 rounded-full blur-[80px] group-hover:bg-primary/10 transition-all duration-700" />
    </section>
  );
}