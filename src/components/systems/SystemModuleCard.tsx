"use client";

import Link from "next/link";
import { ExpandableSection } from "./ExpandableSection";
import { SystemStatusBadge } from "./SystemStatusBadge";
import type { SystemAction, SystemModule } from "./types";
import { cn } from "@/lib/utils";
import { Loader2, ChevronRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

function ActionButton({ action }: { action: SystemAction }) {
  const base =
    "inline-flex items-center justify-center px-5 py-2.5 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 active:scale-95";

  const variantClass =
    action.variant === "ghost"
      ? "text-slate-500 hover:bg-white/60 border border-transparent"
      : action.variant === "secondary"
      ? "bg-white/60 text-slate-900 hover:bg-white/90 border border-white/60 shadow-sm"
      : "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20";

  if (action.href) {
    return (
      <Link className={cn(base, variantClass)} href={action.href}>
        {action.label}
        {action.variant === 'primary' && <ChevronRight className="w-3 h-3 ml-2" />}
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
      {!action.loading && action.variant === 'primary' && <ChevronRight className="w-3 h-3 ml-2" />}
    </button>
  );
}

export function SystemModuleCard({ system }: { system: SystemModule }) {
  return (
    <motion.section 
      whileHover={{ y: -4, scale: 1.01 }}
      className="glass-card p-8 flex flex-col justify-between h-full group relative overflow-hidden rounded-[2.5rem]"
    >
      {/* Decorative Spatial Light */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-all duration-700" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4 mb-10">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-bold tracking-tighter text-slate-900">{system.title}</h3>
              <SystemStatusBadge status={system.status} />
            </div>
            <p className="text-xs leading-relaxed text-slate-500 font-medium max-w-[280px]">
              {system.description}
            </p>
          </div>

          {system.value ? (
            <div className="text-right">
              <div className="text-[9px] uppercase font-bold tracking-[0.2em] text-slate-400 mb-1 flex items-center justify-end gap-1.5">
                <Sparkles className="w-2.5 h-2.5 text-primary" /> Yield
              </div>
              <div className="text-3xl font-bold tracking-tighter text-primary">
                {system.value}
              </div>
              {system.subvalue ? (
                <div className="text-[10px] font-bold text-slate-400 mt-1">{system.subvalue}</div>
              ) : null}
            </div>
          ) : null}
        </div>

        {system.metrics?.length ? (
          <div className="grid gap-4 sm:grid-cols-2 mb-10">
            {system.metrics.map((metric) => (
              <div
                key={metric.label}
                className="bg-white/40 border border-white/60 rounded-3xl px-5 py-4 group/metric hover:bg-white/80 transition-all shadow-sm"
              >
                <div className="text-[9px] uppercase font-bold tracking-widest text-slate-400 mb-1.5">
                  {metric.label}
                </div>
                <div className="text-base font-bold text-slate-900 tracking-tight">
                  {metric.value}
                </div>
                {metric.hint ? (
                  <div className="mt-1 text-[9px] font-bold text-slate-400/60">{metric.hint}</div>
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
        <ExpandableSection label="Operational Telemetry">
          {system.details ? (
            system.details
          ) : (
            <div className="text-[11px] text-slate-400 font-bold uppercase tracking-widest py-2 italic text-center opacity-40">
              {system.emptyState || "No active telemetry signals"}
            </div>
          )}
        </ExpandableSection>
      </div>
    </motion.section>
  );
}
