"use client";

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

type Status = 'active' | 'syncing' | 'idle' | 'error' | 'offline';

export function StatusDot({ status }: { status: Status }) {
  const colors = {
    active: "bg-success shadow-[0_0_8px_rgba(34,197,94,0.4)]",
    syncing: "bg-primary shadow-[0_0_8px_rgba(59,130,246,0.4)]",
    idle: "bg-slate-300",
    error: "bg-danger shadow-[0_0_8px_rgba(239,68,68,0.4)]",
    offline: "bg-slate-200",
  };

  return (
    <div className="flex items-center gap-2">
      <motion.div 
        animate={status === 'syncing' || status === 'active' ? {
          opacity: [1, 0.5, 1],
          scale: [1, 1.2, 1]
        } : {}}
        transition={{ duration: 2, repeat: Infinity }}
        className={cn("w-1.5 h-1.5 rounded-full transition-colors", colors[status])} 
      />
      <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
        {status}
      </span>
    </div>
  );
}
