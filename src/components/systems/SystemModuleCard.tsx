"use client";

import Link from "next/link";
import { ExpandableSection } from "./ExpandableSection";
import { SystemStatusBadge } from "./SystemStatusBadge";
import type { SystemAction, SystemModule } from "./types";
import { cn } from "@/lib/utils";
import { Loader2, ChevronRight, Terminal } from "lucide-react";

function ActionButton({ action }: { action: SystemAction }) {
  const base =
    "inline-flex items-center justify-center px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 border transition-all duration-300";

  const variantClass =
    action.variant === "ghost"
      ? "text-muted-foreground hover:bg-primary/10 hover:text-primary border-transparent hover:border-primary/30"
      : action.variant === "secondary"
      ? "bg-stealth-ebon text-foreground border-stealth-slate hover:border-primary/50"
      : "bg-primary text-white border-primary hover:bg-primary/80 hover:shadow-[0_0_15px_rgba(225,29,72,0.4)]";

  if (action.href) {
    return (
      <Link className={cn(base, variantClass)} href={action.href}>
        {action.label}
        {action.variant === 'primary' && <ChevronRight className="w-3 h-3 ml-1.5" />}
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
      {!action.loading && action.variant === 'primary' && <ChevronRight className="w-3 h-3 ml-1.5" />}
    </button>
  );
}

export function SystemModuleCard({ system }: { system: SystemModule }) {
  return (
    <section className="bg-stealth-onyx border border-stealth-slate border-l-4 border-l-primary p-8 flex flex-col justify-between h-full group hover:border-primary/50 transition-all duration-300">
      <div>
        <div className="flex items-start justify-between gap-4 mb-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold tracking-tighter text-white uppercase glow-text">{system.title}</h3>
              <SystemStatusBadge status={system.status} />
            </div>
            <p className="text-[10px] leading-relaxed text-muted-foreground font-bold uppercase tracking-widest max-w-sm">
              {system.description}
            </p>
          </div>

          {system.value ? (
            <div className="text-right">
              <div className="text-[8px] uppercase font-bold tracking-[0.2em] text-muted-foreground mb-1">
                Data_Yield
              </div>
              <div className="text-2xl font-bold tracking-tighter text-primary glow-text">
                {system.value}
              </div>
              {system.subvalue ? (
                <div className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{system.subvalue}</div>
              ) : null}
            </div>
          ) : null}
        </div>

        {system.metrics?.length ? (
          <div className="grid gap-2 sm:grid-cols-2 mb-8">
            {system.metrics.map((metric) => (
              <div
                key={metric.label}
                className="border border-stealth-slate bg-stealth-ebon px-4 py-3 group/metric hover:border-primary/30 transition-all"
              >
                <div className="text-[8px] uppercase font-bold tracking-widest text-muted-foreground mb-1">
                  {metric.label}
                </div>
                <div className="text-sm font-bold text-white tracking-widest uppercase">
                  {metric.value}
                </div>
                {metric.hint ? (
                  <div className="mt-1 text-[8px] font-bold text-primary/60 uppercase">{metric.hint}</div>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2 mb-8">
          {system.actions.map((action) => (
            <ActionButton
              key={`${system.id}-${action.label}`}
              action={action}
            />
          ))}
        </div>
      </div>

      <ExpandableSection label="In_Depth_Telemetry">
        {system.details ? (
          system.details
        ) : (
          <div className="text-[9px] italic text-muted-foreground/50 font-bold uppercase tracking-widest">Awaiting_Cycle_Synchronization.</div>
        )}
      </ExpandableSection>
    </section>
  );
}
