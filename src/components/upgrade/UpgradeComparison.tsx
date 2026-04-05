"use client";

import { Check, X, ShieldCheck, Zap, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const COMPARISON = [
  { feature: "Daily Intelligence Runs", free: "5", ultra: "Unlimited", highlight: true },
  { feature: "Forensic Leak Detector", free: false, ultra: true },
  { feature: "Memory Retention", free: "7 Days", ultra: "Permanent", highlight: true },
  { feature: "Custom Protocol Forge", free: false, ultra: true },
  { feature: "Logic Execution Latency", free: "Standard", ultra: "Priority (0.04ms)" },
  { feature: "Encrypted Data Vault", free: true, ultra: true },
  { feature: "Multi-Intent Routing", free: true, ultra: true },
  { feature: "Early Feature Access", free: false, ultra: true },
];

export function UpgradeComparison() {
  return (
    <div className="space-y-10 relative z-10">
      <div className="flex items-center justify-between px-4">
        <div className="space-y-1">
          <h3 className="text-2xl font-bold tracking-tighter text-slate-900">Protocol Comparison</h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Forensic Detail</p>
        </div>
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Ultra Optimized</span>
        </div>
      </div>

      <div className="rounded-[2.5rem] bg-white/60 border border-white/80 overflow-hidden shadow-2xl">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-white/80">
              <th className="p-8 font-bold text-slate-400 uppercase tracking-widest text-[10px]">Capability</th>
              <th className="p-8 font-bold text-slate-400 uppercase tracking-widest text-center text-[10px]">Free Clearance</th>
              <th className="p-8 font-bold text-primary uppercase tracking-widest text-center bg-primary/5 text-[10px]">Ultra Clearance</th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON.map((row, i) => (
              <tr 
                key={row.feature} 
                className={cn(
                  "transition-colors hover:bg-white/40",
                  i !== COMPARISON.length - 1 && "border-b border-white/40"
                )}
              >
                <td className="p-8">
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "font-bold text-slate-700 tracking-tight",
                      row.highlight && "text-slate-900 underline underline-offset-4 decoration-primary/20"
                    )}>{row.feature}</span>
                  </div>
                </td>
                <td className="p-8 text-center">
                  {typeof row.free === 'boolean' ? (
                    row.free ? <Check className="w-5 h-5 text-success/40 mx-auto" /> : <X className="w-5 h-5 text-slate-300 mx-auto" />
                  ) : (
                    <span className="font-bold text-slate-400 text-xs">{row.free}</span>
                  )}
                </td>
                <td className="p-8 text-center bg-primary/5">
                  {typeof row.ultra === 'boolean' ? (
                    row.ultra ? <Check className="w-6 h-6 text-primary mx-auto animate-pulse" /> : <X className="w-6 h-6 text-slate-300 mx-auto" />
                  ) : (
                    <span className="font-black text-primary text-base tracking-tighter">{row.ultra}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
