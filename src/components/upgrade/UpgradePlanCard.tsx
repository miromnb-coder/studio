"use client";

import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { Check, Star } from 'lucide-react';
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
    <GlassCard className={cn(
      "relative flex flex-col gap-8 h-full transition-all duration-500",
      isPopular ? "border-primary/40 shadow-2xl bg-white/60" : "border-white/40 bg-white/20"
    )}>
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-primary text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2">
          <Star className="w-3 h-3 fill-white" /> Recommended
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-2xl font-bold tracking-tighter text-slate-900">{name}</h3>
        <p className="text-xs text-slate-500 font-medium">{description}</p>
      </div>

      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-bold tracking-tighter text-slate-900">{price}</span>
        <span className="text-sm font-bold text-slate-400">{period}</span>
      </div>

      <div className="space-y-4">
        {features.map((f, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-3 h-3 text-success" />
            </div>
            <span className="text-xs font-bold text-slate-600 leading-tight">{f}</span>
          </div>
        ))}
      </div>

      <GlassButton 
        variant={isPopular ? 'primary' : 'secondary'}
        className="w-full !h-14 mt-auto rounded-2xl shadow-xl"
        onClick={onSelect}
        loading={loading}
      >
        Select {name}
      </GlassButton>
    </GlassCard>
  );
}
