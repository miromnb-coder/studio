import type { ValueStripItem } from "./types";
import { cn } from "@/lib/utils";

const toneStyles = {
  neutral: "bg-slate-50 border-slate-100 text-slate-600",
  positive: "bg-success/5 border-success/10 text-success",
  warning: "bg-warning/5 border-warning/10 text-warning",
};

export function ValueStrip({ items }: { items: ValueStripItem[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(
            "px-8 py-6 rounded-3xl border transition-all duration-300 hover:scale-[1.01] hover:shadow-premium group",
            toneStyles[item.tone ?? "neutral"]
          )}
        >
          <div className="text-[10px] uppercase font-bold tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">
            {item.label}
          </div>
          <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}