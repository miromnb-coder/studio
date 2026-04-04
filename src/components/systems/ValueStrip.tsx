import type { ValueStripItem } from "./types";
import { cn } from "@/lib/utils";

const toneStyles = {
  neutral: "text-slate-900 bg-white border border-slate-100 shadow-sm",
  positive: "text-nordic-sage bg-nordic-moss/20 border border-nordic-moss/30 shadow-[0_8px_20px_rgba(91,109,68,0.05)]",
  warning: "text-warning bg-amber-50 border border-amber-100 shadow-sm",
};

export function ValueStrip({ items }: { items: ValueStripItem[] }) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(
            "rounded-[2.5rem] px-10 py-8 transition-all duration-500 hover:scale-[1.02] group cursor-default",
            toneStyles[item.tone ?? "neutral"]
          )}
        >
          <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400 group-hover:text-nordic-sage transition-colors">
            {item.label}
          </div>
          <div className="mt-3 text-4xl font-bold tracking-tighter tabular-nums text-slate-900 group-hover:translate-x-1 transition-transform duration-500 origin-left">
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}