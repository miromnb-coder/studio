"use client";

import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const COMPARISON = [
  { feature: "Daily Reasoning Runs", free: "5", ultra: "Unlimited" },
  { feature: "Leak Detector Tool", free: false, ultra: true },
  { feature: "Neural Memory Depth", free: "7 Days", ultra: "Permanent" },
  { feature: "Custom Tool Forging", free: false, ultra: true },
  { feature: "Response Latency", free: "Standard", ultra: "Priority (0.04ms)" },
  { feature: "Encrypted Data Vault", free: true, ultra: true },
];

export function UpgradeComparison() {
  return (
    <div className="space-y-6">
      <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 px-2">Protocol Comparison</h3>
      <div className="rounded-[2.5rem] bg-white/40 border border-white/80 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-white/80">
              <th className="p-6 font-bold text-slate-400 uppercase tracking-widest">Capability</th>
              <th className="p-6 font-bold text-slate-400 uppercase tracking-widest text-center">Free</th>
              <th className="p-6 font-bold text-primary uppercase tracking-widest text-center bg-primary/5">Ultra</th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON.map((row, i) => (
              <tr key={row.feature} className={cn(i !== COMPARISON.length - 1 && "border-b border-white/40")}>
                <td className="p-6 font-bold text-slate-700">{row.feature}</td>
                <td className="p-6 text-center">
                  {typeof row.free === 'boolean' ? (
                    row.free ? <Check className="w-4 h-4 text-success mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />
                  ) : (
                    <span className="font-bold text-slate-500">{row.free}</span>
                  )}
                </td>
                <td className="p-6 text-center bg-primary/5">
                  {typeof row.ultra === 'boolean' ? (
                    row.ultra ? <Check className="w-4 h-4 text-primary mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />
                  ) : (
                    <span className="font-black text-primary">{row.ultra}</span>
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
