"use client";

import { motion } from 'framer-motion';
import { TrendingUp, Clock, Zap, Target, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export function UpgradeValueMetrics() {
  const metrics = [
    { label: 'Time Reclaimed', val: '14.2h', sub: 'Projected monthly', icon: Clock, color: 'text-primary', bg: 'bg-primary/5' },
    { label: 'Liquidity Optimized', val: '€420', sub: 'Potential annual', icon: TrendingUp, color: 'text-success', bg: 'bg-success/5' },
    { label: 'Signals Scanned', val: '1,280', sub: 'Total logic inputs', icon: Target, color: 'text-accent', bg: 'bg-accent/5' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {metrics.map((m, i) => (
        <motion.div 
          key={i} 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 * i }}
          className="group relative"
        >
          <div className="absolute inset-0 bg-white/40 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[2.5rem]" />
          <div className="relative bg-white/60 border border-white/80 p-8 rounded-[2.5rem] text-center space-y-4 shadow-sm hover:shadow-xl transition-all duration-500">
            <div className={cn("w-14 h-14 mx-auto rounded-[1.25rem] flex items-center justify-center shadow-inner", m.bg)}>
              <m.icon className={cn("w-7 h-7", m.color)} />
            </div>
            <div className="space-y-1">
              <p className="text-4xl font-black text-slate-900 tracking-tighter">{m.val}</p>
              <div className="space-y-0.5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{m.label}</p>
                <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{m.sub}</p>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-50 flex items-center justify-center gap-2 text-[9px] font-black text-primary uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
              <Sparkles className="w-3 h-3" /> Real-Time Signal
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
