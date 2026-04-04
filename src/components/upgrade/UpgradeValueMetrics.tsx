"use client";

import { motion } from 'framer-motion';
import { TrendingUp, Clock, Zap } from 'lucide-react';

export function UpgradeValueMetrics() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {[
        { label: 'Time Saved', val: '14.2h', icon: Clock, color: 'text-primary' },
        { label: 'Money Saved', val: '$420', icon: TrendingUp, color: 'text-success' },
        { label: 'Automations', val: '84', icon: Zap, color: 'text-accent' }
      ].map((m, i) => (
        <div key={i} className="bg-white/40 border border-white/80 p-5 rounded-[2rem] text-center space-y-2 shadow-sm">
          <m.icon className={cn("w-5 h-5 mx-auto", m.color)} />
          <div className="space-y-0.5">
            <p className="text-lg font-bold text-slate-900 tracking-tight">{m.val}</p>
            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">{m.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
