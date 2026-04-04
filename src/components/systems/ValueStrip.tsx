"use client";

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ValueItem {
  label: string;
  value: string;
  tone?: 'positive' | 'neutral' | 'warning';
}

export function ValueStrip({ items }: { items: ValueItem[] }) {
  const tones = {
    positive: "text-success bg-success/5",
    neutral: "text-slate-600 bg-slate-50",
    warning: "text-warning bg-warning/5",
  };

  return (
    <div className="flex items-center gap-3">
      {items.map((item, idx) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: idx * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "px-4 py-1.5 rounded-full flex items-center gap-3 border border-white/40 shadow-sm backdrop-blur-sm hover:border-white/80 transition-all",
            tones[item.tone || 'neutral']
          )}
        >
          <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">{item.label}</span>
          <span className="text-xs font-bold tracking-tight">{item.value}</span>
        </motion.div>
      ))}
    </div>
  );
}
