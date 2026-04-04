"use client";

import Link from "next/link";
import { ExpandableSection } from "./ExpandableSection";
import { SystemStatusBadge } from "./SystemStatusBadge";
import type { SystemAction, SystemModule } from "./types";
import { cn } from "@/lib/utils";
import { Loader2, ArrowRight } from "lucide-react";

function ActionButton({ action }: { action: SystemAction }) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all disabled:cursor-not-allowed disabled:opacity-50";

  const variantClass =
    action.variant === "ghost"
      ? "text-muted-foreground hover:bg-white/5 hover:text-white"
      : action.variant === "secondary"
      ? "bg-white/5 text-foreground border border-white/10 hover:bg-white/10"
      : "bg-primary text-background hover:scale-[1.02] shadow-lg shadow-primary/10";

  if (action.href) {
    return (
      <Link className={cn(base, variantClass)} href={action.href}>
        {action.label}
        {action.variant === 'primary' && <ArrowRight className="w-3 h-3 ml-2" />}
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
      {action.loading && <Loader2 className="w-3 h-3 mr-2 animate-spin" />}
      {action.label}
      {!action.loading && action.variant === 'primary' && <ArrowRight className="w-3 h-3 ml-2" />}
    </button>
  );
}

export function SystemModuleCard({ system }: { system: SystemModule }) {
  return (
    <section className="premium-card !p-8 bg-[#1e1e22] border border-white/5 shadow-2xl flex flex-col justify-between h-full">
      <div>
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold font-headline text-white tracking-tight">{system.title}</h3>
              <SystemStatusBadge status={system.status} />
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground/70 font-medium">
              {system.description}
            </p>
          </div>

          {system.value ? (
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/40 mb-1">
                Impact
              </div>
              <div className="text-2xl font-bold font-headline text-white tracking-tighter tabular-nums">
                {system.value}
              </div>
              {system.subvalue ? (
                <div className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1">{system.subvalue}</div>
              ) : null}
            </div>
          ) : null}
        </div>

        {system.metrics?.length ? (
          <div className="grid gap-3 sm:grid-cols-2 mb-6">
            {system.metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3"
              >
                <div className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground/40">
                  {metric.label}
                </div>
                <div className="mt-1 text-base font-bold text-white tracking-tight">
                  {metric.value}
                </div>
                {metric.hint ? (
                  <div className="mt-1 text-[10px] font-medium text-primary/60">{metric.hint}</div>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2 mb-6">
          {system.actions.map((action) => (
            <ActionButton
              key={`${system.id}-${action.label}`}
              action={action}
            />
          ))}
        </div>
      </div>

      <ExpandableSection label="Diagnostic Feed">
        {system.details ? (
          system.details
        ) : system.emptyState ? (
          <div className="text-xs italic opacity-50">{system.emptyState}</div>
        ) : (
          <div className="text-xs italic opacity-50">No operational logs available for this cycle.</div>
        )}
      </ExpandableSection>
    </section>
  );
}
