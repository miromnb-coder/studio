"use client";

import Link from "next/link";
import { ExpandableSection } from "./ExpandableSection";
import { SystemStatusBadge } from "./SystemStatusBadge";
import type { SystemAction, SystemModule } from "./types";
import { cn } from "@/lib/utils";
import { Loader2, ChevronRight } from "lucide-react";

function ActionButton({ action }: { action: SystemAction }) {
  const base =
    "inline-flex items-center justify-center rounded-2xl px-5 py-3 text-[11px] font-bold uppercase tracking-widest transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50";

  const variantClass =
    action.variant === "ghost"
      ? "text-slate-400 hover:bg-slate-100 hover:text-slate-900"
      : action.variant === "secondary"
      ? "bg-slate-50 text-slate-600 border border-slate-100 hover:bg-slate-100"
      : "bg-nordic-sage text-white hover:scale-[1.02] shadow-lg shadow-nordic-sage/10 active:scale-[0.98]";

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
    <section className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between h-full group hover:shadow-[0_20px_50px_rgba(91,109,68,0.08)] transition-all duration-500">
      <div>
        <div className="flex items-start justify-between gap-4 mb-10">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-bold tracking-tight text-slate-900 group-hover:text-nordic-sage transition-colors">{system.title}</h3>
              <SystemStatusBadge status={system.status} />
            </div>
            <p className="text-sm leading-relaxed text-slate-500 font-medium max-w-sm">
              {system.description}
            </p>
          </div>

          {system.value ? (
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold tracking-widest text-slate-300 mb-1">
                Yield
              </div>
              <div className="text-3xl font-bold tracking-tighter text-slate-900">
                {system.value}
              </div>
              {system.subvalue ? (
                <div className="text-[10px] font-bold text-nordic-sage uppercase tracking-widest mt-1">{system.subvalue}</div>
              ) : null}
            </div>
          ) : null}
        </div>

        {system.metrics?.length ? (
          <div className="grid gap-4 sm:grid-cols-2 mb-10">
            {system.metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-3xl border border-slate-50 bg-slate-50/50 px-6 py-5 group/metric hover:bg-white hover:border-nordic-moss/30 transition-all duration-300"
              >
                <div className="text-[9px] uppercase font-bold tracking-widest text-slate-400 mb-1">
                  {metric.label}
                </div>
                <div className="text-xl font-bold text-slate-900 tracking-tight">
                  {metric.value}
                </div>
                {metric.hint ? (
                  <div className="mt-1.5 text-[10px] font-medium text-nordic-sage/60">{metric.hint}</div>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3 mb-10">
          {system.actions.map((action) => (
            <ActionButton
              key={`${system.id}-${action.label}`}
              action={action}
            />
          ))}
        </div>
      </div>

      <ExpandableSection label="Operational Details">
        {system.details ? (
          system.details
        ) : (
          <div className="text-[11px] italic text-slate-400 font-medium uppercase tracking-widest">Ready for next cycle.</div>
        )}
      </ExpandableSection>
    </section>
  );
}