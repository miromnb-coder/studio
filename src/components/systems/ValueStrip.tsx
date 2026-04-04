import type { ValueStripItem } from "./types";
import { cn } from "@/lib/utils";

const toneStyles = {
  neutral: "text-foreground bg-white/5 border border-white/5",
  positive: "text-success bg-success/5 border border-success/10",
  warning: "text-warning bg-warning/5 border border-warning/10",
};

export function ValueStrip({ items }: { items: ValueStripItem[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(
            "rounded-3xl px-6 py-5 backdrop-blur-xl transition-all hover:scale-[1.02]",
            toneStyles[item.tone ?? "neutral"]
          )}
        >
          <div className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-50">
            {item.label}
          </div>
          <div className="mt-2 text-3xl font-bold font-headline tracking-tighter tabular-nums">{item.value}</div>
        </div>
      ))}
    </div>
  );
}
