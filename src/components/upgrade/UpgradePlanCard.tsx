"use client";

import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { Check, Star, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UpgradePlanCardProps {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  isPopular?: boolean;
  onSelect: () => void;
  loading?: boolean;
}

export function UpgradePlanCard({ name, price, period, description, features, isPopular, onSelect, loading }: UpgradePlanCardProps) {
  return (
    <motion.div
      whileHover={{ y: -8 }}
      className="h-full"
    >
      <GlassCard className={cn(
        "relative flex flex-col gap-10 h-full transition-all duration-700 p-10 rounded-[3rem]",
        isPopular 
          ? "border-primary/40 shadow-[0_40px_80px_-15px_rgba(59,130,246,0.15)] bg-white/80 ring-1 ring-primary/20" 
          : "border-white/60 bg-white/20"
      )}>
        {isPopular && (
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-6 py-2 bg-primary text-white rounded-full text-[10px] font-black uppercase tracking-[0.25em] shadow-xl flex items-center gap-2 z-20">
            <Star className="w-3.5 h-3.5 fill-white" /> Recommended Choice
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className={cn(
              "text-3xl font-black tracking-tighter uppercase",
              isPopular ? "text-primary" : "text-slate-900"
            )}>{name}</h3>
            {isPopular && <Zap className="w-6 h-6 text-primary fill-primary opacity-20" />}
          </div>
          <p className="text-sm text-slate-500 font-medium leading-relaxed">{description}</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-baseline gap-1">
            <span className="text-6xl font-black tracking-tighter text-slate-900">{price}</span>
            <span className="text-xl font-bold text-slate-400">{period}</span>
          </div>
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Billed Monthly</p>
        </div>

        <div className="space-y-5 flex-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Capabilities Included:</p>
          {features.map((f, i) => (
            <div key={i} className="flex items-start gap-4 group">
              <div className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                <Check className="w-3.5 h-3.5 text-success" />
              </div>
              <span className="text-sm font-bold text-slate-600 leading-tight tracking-tight">{f}</span>
            </div>
          ))}
        </div>

        <GlassButton 
          variant={isPopular ? 'primary' : 'secondary'}
          className={cn(
            "w-full !h-16 mt-8 rounded-[1.5rem] text-sm font-black shadow-xl transition-all duration-500",
            isPopular ? "bg-primary text-white" : "bg-slate-900 text-white border-0"
          )}
          onClick={onSelect}
          loading={loading}
        >
          Activate {name} Protocol
        </GlassButton>
      </GlassCard>
    </motion.div>
  );
}
