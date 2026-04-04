"use client";

import Link from "next/link";
import { ExpandableSection } from "./ExpandableSection";
import { SystemStatusBadge } from "./SystemStatusBadge";
import type { SystemAction, SystemModule } from "./types";
import { cn } from "@/lib/utils";
import { Loader2, ChevronRight } from "lucide-react";

function ActionButton({ action }: { action: SystemAction }) {
  const base =
    "inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]";

  const variantClass =
    action.variant === "ghost"
      ? "text-slate-500 hover:bg-slate-50 border border-transparent"
      : action.variant === "secondary"
      ? "bg-slate-100 text-slate-900 hover:bg-slate-200 border border-slate-200"
      : "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/10";

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
    <section className="glass-card p-8 flex flex-col justify-between h-full group">
      <div>
        <div className="flex items-start justify-between gap-4 mb-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold tracking-tight text-slate-900">{system.title}</h3>
              <SystemStatusBadge status={system.status} />
            </div>
            <p className="text-xs leading-relaxed text-slate-500 font-medium max-w-sm">
              {system.description}
            </p>
          </div>

          {system.value ? (
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">
                Yield
              </div>
              <div className="text-2xl font-bold tracking-tight text-primary">
                {system.value}
              </div>
              {system.subvalue ? (
                <div className="text-[10px] font-bold text-slate-400 mt-1">{system.subvalue}</div>
              ) : null}
            </div>
          ) : null}
        </div>

        {system.metrics?.length ? (
          <div className="grid gap-3 sm:grid-cols-2 mb-8">
            {system.metrics.map((metric) => (
              <div
                key={metric.label}
                className="bg-white/40 border border-slate-100 rounded-2xl px-4 py-3.5 group/metric hover:border-primary/20 transition-all"
              >
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
                  {metric.label}
                </div>
                <div className="text-sm font-bold text-slate-900 tracking-tight">
                  {metric.value}
                </div>
                {metric.hint ? (
                  <div className="mt-1 text-[10px] font-medium text-slate-400">{metric.hint}</div>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2.5 mb-8">
          {system.actions.map((action) => (
            <ActionButton
              key={`${system.id}-${action.label}`}
              action={action}
            />
          ))}
        </div>
      </div>

      <ExpandableSection label="Operational Log">
        {system.details ? (
          system.details
        ) : (
          <div className="text-xs text-slate-400 font-medium py-2">No recent anomalies detected in this module.</div>
        )}
      </ExpandableSection>
    </section>
  );
}