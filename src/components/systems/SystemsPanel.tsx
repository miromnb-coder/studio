"use client";

import { useMemo, useState } from "react";
import { ValueStrip } from "./ValueStrip";
import { SystemModuleCard } from "./SystemModuleCard";
import type { SystemModule, ValueStripItem } from "./types";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type FocusMode = "all" | "command" | "memory" | "autopilot" | "integrations";

export function SystemsPanel({
  systems,
  valueStrip,
}: {
  systems: SystemModule[];
  valueStrip: ValueStripItem[];
}) {
  const [focus, setFocus] = useState<FocusMode>("all");

  const filteredSystems = useMemo(() => {
    if (focus === "all") return systems;

    const matchers: Record<Exclude<FocusMode, "all">, string[]> = {
      command: ["Action Engine", "Command Center"],
      memory: ["Memory", "Neural"],
      autopilot: ["Efficiency", "Autopilot", "Optimization"],
      integrations: ["Integration", "Core", "Status"],
    };

    return systems.filter((system) =>
      matchers[focus].some((label) => 
        system.title.toLowerCase().includes(label.toLowerCase()) ||
        system.id.toLowerCase().includes(label.toLowerCase())
      )
    );
  }, [focus, systems]);

  return (
    <div className="space-y-12">
      <div className="flex flex-wrap items-center gap-3 pb-4 border-b border-slate-200/40">
        {(["all", "command", "memory", "autopilot", "integrations"] as FocusMode[]).map(
          (mode) => {
            const active = focus === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => setFocus(mode)}
                className={cn(
                  "rounded-2xl px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.25em] transition-all duration-500 active:scale-95",
                  active
                    ? "bg-white text-primary shadow-[0_8px_20px_rgba(59,130,246,0.15)] ring-1 ring-primary/20"
                    : "text-slate-400 hover:text-slate-900 hover:bg-white/60"
                )}
              >
                {mode === "all"
                  ? "Global"
                  : mode === "command"
                  ? "Action"
                  : mode === "memory"
                  ? "Neural"
                  : mode === "autopilot"
                  ? "Optimize"
                  : "Status"}
              </button>
            );
          }
        )}
      </div>

      <ValueStrip items={valueStrip} />

      <motion.div 
        layout
        className="grid gap-8 lg:grid-cols-2"
      >
        {filteredSystems.map((system) => (
          <SystemModuleCard key={system.id} system={system} />
        ))}
      </motion.div>
    </div>
  );
}
