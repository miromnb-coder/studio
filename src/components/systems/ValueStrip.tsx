import type { ValueStripItem } from "./types";
import { cn } from "@/lib/utils";

const toneStyles = {
  neutral: "text-muted-foreground bg-stealth-onyx border border-stealth-slate",
  positive: "text-primary bg-primary/5 border border-primary/30 shadow-[0_0_20px_rgba(225,29,72,0.05)]",
  warning: "text-primary bg-primary/10 border border-primary/50",
};

export function ValueStrip({ items }: { items: ValueStripItem[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(
            "px-8 py-6 transition-all duration-300 hover:border-primary group border-l-4",
            toneStyles[item.tone ?? "neutral"]
          )}
        >
          <div className="text-[9px] uppercase font-bold tracking-[0.3em] text-muted-foreground group-hover:text-primary transition-colors">
            {item.label}
          </div>
          <div className="mt-2 text-3xl font-bold tracking-tighter tabular-nums text-white group-hover:translate-x-1 transition-all duration-500 origin-left uppercase glow-text">
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}
