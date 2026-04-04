"use client";

import { ToolDefinition } from './types';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { ToolStatusBadge } from './ToolStatusBadge';
import * as LucideIcons from 'lucide-react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowUpRight } from 'lucide-react';

interface ToolCardProps {
  tool: ToolDefinition;
  onOpen: (tool: ToolDefinition) => void;
}

export function ToolCard({ tool, onOpen }: ToolCardProps) {
  const Icon = (LucideIcons as any)[tool.icon] || LucideIcons.Package;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.01 }}
      className="group"
    >
      <GlassCard className="h-full flex flex-col justify-between !p-6 border-white/40 hover:border-primary/20 transition-all duration-500">
        <div className="space-y-6">
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

          <div className="flex items-center gap-4 pt-2">
            <div className="space-y-0.5">
              <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Category</p>
              <p className="text-[10px] font-bold text-slate-600">{tool.category}</p>
            </div>
            <div className="w-px h-6 bg-slate-100" />
            <div className="space-y-0.5">
              <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Impact</p>
              <p className="text-[10px] font-bold text-success">
                {tool.metrics.moneySavedAmount > 0 ? `+$${tool.metrics.moneySavedAmount}` : `~${tool.metrics.timeSavedMinutes}m`}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-50 flex gap-2">
          <GlassButton 
            size="sm" 
            variant="primary" 
            className="flex-1 !h-10 text-[9px]"
            onClick={() => onOpen(tool)}
          >
            Manage <ArrowUpRight className="w-3 h-3 ml-1.5" />
          </GlassButton>
        </div>
      </GlassCard>
    </motion.div>
  );
}
