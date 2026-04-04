"use client";

import { ToolDefinition } from './types';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { ToolStatusBadge } from './ToolStatusBadge';
import * as LucideIcons from 'lucide-react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Zap, Clock, Repeat, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ToolCardProps {
  tool: ToolDefinition;
  onOpen: (tool: ToolDefinition) => void;
  isRecommended?: boolean;
}

export function ToolCard({ tool, onOpen, isRecommended }: ToolCardProps) {
  const Icon = (LucideIcons as any)[tool.icon] || LucideIcons.Package;
  const [stats, setStats] = useState({ uses: 0, last: '' });

  useEffect(() => {
    const s = localStorage.getItem(`tool_stats_${tool.id}`);
    if (s) setStats(JSON.parse(s));
  }, [tool.id]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.01 }}
      className={cn("group relative", isRecommended && "ring-2 ring-primary/20 rounded-4xl")}
    >
      {isRecommended && (
        <div className="absolute -top-3 left-6 z-20 px-3 py-1 bg-primary text-white rounded-full text-[8px] font-bold uppercase tracking-widest shadow-lg">
          AI Suggests
        </div>
      )}

      <GlassCard className="h-full flex flex-col justify-between !p-6 border-white/40 hover:border-primary/20 transition-all duration-500 overflow-hidden">
        {/* Hover Glow Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

        <div className="space-y-6 relative z-10">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500">
              <Icon className="w-6 h-6" />
            </div>
            <ToolStatusBadge status={tool.status} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold tracking-tight text-slate-900">{tool.name}</h3>
              {tool.isPremium && <Sparkles className="w-3.5 h-3.5 text-warning fill-warning" />}
            </div>
            <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2">
              {tool.description}
            </p>
          </div>

          {/* Proof of Value Grid */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-2xl bg-slate-50/50 border border-slate-100 flex items-center gap-3">
              <Zap className="w-3.5 h-3.5 text-success" />
              <div className="space-y-0.5">
                <p className="text-[8px] font-bold uppercase text-slate-400">Saved</p>
                <p className="text-[10px] font-bold text-slate-900">${tool.metrics.moneySavedAmount}</p>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50/50 border border-slate-100 flex items-center gap-3">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <div className="space-y-0.5">
                <p className="text-[8px] font-bold uppercase text-slate-400">Time</p>
                <p className="text-[10px] font-bold text-slate-900">{tool.metrics.timeSavedMinutes}m</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-slate-400 px-1">
            <div className="flex items-center gap-1.5">
              <Repeat className="w-3 h-3" />
              {stats.uses || tool.metrics.usageCount} Runs
            </div>
            {stats.last && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                {new Date(stats.last).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-50 flex gap-2 relative z-10">
          <GlassButton 
            size="sm" 
            variant="primary" 
            className="flex-1 !h-10 text-[9px] group/btn"
            onClick={() => onOpen(tool)}
          >
            Open Registry <ArrowRight className="w-3 h-3 ml-1.5 group-hover/btn:translate-x-1 transition-transform" />
          </GlassButton>
          <GlassButton 
            size="sm" 
            variant="secondary" 
            className="!w-10 !h-10 !p-0"
            title="Instant Action"
          >
            <LucideIcons.Play className="w-3.5 h-3.5" />
          </GlassButton>
        </div>
      </GlassCard>
    </motion.div>
  );
}
