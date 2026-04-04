"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowRight, Activity, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SystemModule, SystemStatus } from "./types";
import Link from "next/link";

interface SystemModuleCardProps {
  module: SystemModule;
  className?: string;
}

const statusColors: Record<SystemStatus, string> = {
  active: "text-success bg-success/10",
  idle: "text-muted-foreground bg-white/5",
  error: "text-danger bg-danger/10",
  syncing: "text-primary bg-primary/10",
  connected: "text-success bg-success/10",
  disconnected: "text-muted-foreground bg-white/5",
};

export function SystemModuleCard({ module, className }: SystemModuleCardProps) {
  const isSyncing = module.status === "syncing";

  return (
    <Card className={cn("premium-card flex flex-col justify-between group h-full", className)}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="text-xl font-bold font-headline text-white tracking-tight flex items-center gap-2">
              {module.title}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-[200px]">
              {module.description}
            </p>
          </div>
          <Badge 
            variant="outline" 
            className={cn(
              "text-[9px] font-bold uppercase tracking-widest border-0 px-2 py-0.5 rounded-full flex items-center gap-1.5",
              statusColors[module.status]
            )}
          >
            {isSyncing ? (
              <Loader2 className="w-2.5 h-2.5 animate-spin" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
            )}
            {module.status}
          </Badge>
        </div>

        {/* Value/Metrics */}
        {module.value && (
          <div className="py-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-1">Impact Level</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold font-headline text-white tracking-tighter">
                {module.value}
              </span>
              {module.subvalue && (
                <span className="text-xs font-bold text-muted-foreground">
                  {module.subvalue}
                </span>
              )}
            </div>
          </div>
        )}

        {module.metrics && module.metrics.length > 0 && (
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
            {module.metrics.map((m, i) => (
              <div key={i} className="space-y-0.5">
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">{m.label}</p>
                <p className="text-sm font-bold text-white">{m.value}</p>
              </div>
            ))}
          </div>
        )}

        {module.details && (
          <div className="pt-2">
            {module.details}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-col gap-2">
        {module.actions.map((action, i) => {
          const isPrimary = action.variant === "primary";
          const isGhost = action.variant === "ghost";

          const content = (
            <>
              {action.loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : null}
              {action.label}
              {!action.loading && isPrimary && <ArrowRight className="w-3.5 h-3.5 ml-2 group-hover:translate-x-1 transition-transform" />}
            </>
          );

          if (action.href) {
            return (
              <Button
                key={i}
                asChild
                disabled={action.disabled || action.loading}
                className={cn(
                  "rounded-xl h-11 text-[10px] font-bold uppercase tracking-widest transition-all",
                  isPrimary ? "bg-primary text-background hover:scale-[1.02]" : 
                  isGhost ? "bg-transparent text-muted-foreground hover:text-white" :
                  "bg-white/5 text-white hover:bg-white/10"
                )}
              >
                <Link href={action.href}>{content}</Link>
              </Button>
            );
          }

          return (
            <Button
              key={i}
              onClick={action.onClick}
              disabled={action.disabled || action.loading}
              className={cn(
                "rounded-xl h-11 text-[10px] font-bold uppercase tracking-widest transition-all",
                isPrimary ? "bg-primary text-background hover:scale-[1.02]" : 
                isGhost ? "bg-transparent text-muted-foreground hover:text-white" :
                "bg-white/5 text-white hover:bg-white/10"
              )}
            >
              {content}
            </Button>
          );
        })}
      </div>
    </Card>
  );
}
