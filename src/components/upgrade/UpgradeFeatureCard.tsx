"use client";

import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';

interface UpgradeFeatureCardProps {
  title: string;
  desc: string;
  benefit: string;
  icon: string;
  idx: number;
}

export function UpgradeFeatureCard({ title, desc, benefit, icon, idx }: UpgradeFeatureCardProps) {
  const Icon = (LucideIcons as any)[icon] || LucideIcons.Zap;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * idx }}
    >
      <GlassCard className="!p-6 h-full flex flex-col gap-4 border-white/40 hover:border-primary/40 group transition-all duration-500">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
          <Icon className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-tight">{title}</h4>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">{desc}</p>
        </div>
        <div className="mt-auto pt-4 border-t border-slate-100/60">
          <p className="text-[10px] font-black text-success uppercase tracking-widest flex items-center gap-2">
            <LucideIcons.Sparkles className="w-3 h-3 fill-success" />
            {benefit}
          </p>
        </div>
      </GlassCard>
    </motion.div>
  );
}
