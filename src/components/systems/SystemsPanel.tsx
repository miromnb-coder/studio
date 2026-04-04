"use client";

import { useMemo, useState } from "react";
import { ValueStrip } from "./ValueStrip";
import { SystemModuleCard } from "./SystemModuleCard";
import type { SystemModule, ValueStripItem } from "./types";
import { cn } from "@/lib/utils";

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
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-white/5">
        {(["all", "command", "memory", "autopilot", "integrations"] as FocusMode[]).map(
          (mode) => {
            const active = focus === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => setFocus(mode)}
                className={cn(
                  "rounded-full px-5 py-2 text-[10px] font-bold uppercase tracking-[0.2em] transition-all",
                  active
                    ? "bg-primary text-background shadow-lg shadow-primary/20"
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                )}
              >
                {mode === "all"
                  ? "All Modules"
                  : mode === "command"
                  ? "Action"
                  : mode === "memory"
                  ? "Memory"
                  : mode === "autopilot"
                  ? "Optimizer"
                  : "Systems"}
              </button>
            );
          }
        )}
      </div>

      <ValueStrip items={valueStrip} />

      <div className="grid gap-6 lg:grid-cols-2">
        {filteredSystems.map((system) => (
          <SystemModuleCard key={system.id} system={system} />
        ))}
      </div>
    </div>
  );
}
