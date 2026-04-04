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
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.1 }}
          className={cn(
            "px-4 py-1.5 rounded-full flex items-center gap-3 border border-white/40 shadow-sm",
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