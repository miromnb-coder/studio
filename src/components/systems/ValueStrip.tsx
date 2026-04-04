import type { ValueStripItem } from "./types";
import { cn } from "@/lib/utils";

const toneStyles = {
  neutral: "text-foreground bg-white/[0.02] border border-white/[0.05] shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]",
  positive: "text-success bg-success/5 border border-success/10 shadow-[0_0_20px_rgba(57,217,138,0.05)]",
  warning: "text-warning bg-warning/5 border border-warning/10 shadow-[0_0_20px_rgba(245,196,81,0.05)]",
};

export function ValueStrip({ items }: { items: ValueStripItem[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(
            "rounded-[2rem] px-8 py-6 backdrop-blur-xl transition-all duration-500 hover:scale-[1.02] group cursor-default",
            toneStyles[item.tone ?? "neutral"]
          )}
        >
          <div className="text-[10px] uppercase font-bold tracking-[0.3em] opacity-40 group-hover:opacity-100 transition-opacity">
            {item.label}
          </div>
          <div className="mt-3 text-4xl font-bold font-headline tracking-tighter tabular-nums text-gradient group-hover:scale-105 transition-transform duration-500 origin-left">
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}