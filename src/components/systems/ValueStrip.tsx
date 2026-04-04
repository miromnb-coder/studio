import type { ValueStripItem } from "./types";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const toneStyles = {
  neutral: "bg-white/40 border-white/60 text-slate-600 shadow-sm",
  positive: "bg-success/5 border-success/20 text-success shadow-[0_8px_20px_rgba(34,197,94,0.05)]",
  warning: "bg-warning/5 border-warning/20 text-warning shadow-[0_8px_20px_rgba(245,158,11,0.05)]",
};

export function ValueStrip({ items }: { items: ValueStripItem[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((item, idx) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1, duration: 0.8 }}
          className={cn(
            "px-8 py-6 rounded-[2rem] border transition-all duration-500 group relative overflow-hidden",
            toneStyles[item.tone ?? "neutral"]
          )}
        >
          {/* Inner Spatial Glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          
          <div className="relative z-10">
            <div className="text-[10px] uppercase font-bold tracking-[0.3em] opacity-50 group-hover:opacity-100 transition-opacity mb-2">
              {item.label}
            </div>
            <div className="text-4xl font-bold tracking-tighter text-slate-900 tabular-nums">
              {item.value}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
