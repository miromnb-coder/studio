"use client";

import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { StatusDot } from '@/components/ui/StatusDot';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { ChevronRight, Activity } from 'lucide-react';

interface SystemCardProps {
  title: string;
  description: string;
  status: 'active' | 'syncing' | 'idle' | 'error';
  value?: string;
  metrics?: Array<{ label: string; value: string }>;
  actions: Array<{ label: string; onClick?: () => void; variant?: 'primary' | 'secondary' }>;
  children?: ReactNode;
}

export function SystemCard({ title, description, status, value, metrics, actions, children }: SystemCardProps) {
  return (
    <GlassCard className="flex flex-col h-full">
      <div className="flex items-start justify-between mb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold tracking-tighter text-slate-900">{title}</h3>
            <StatusDot status={status} />
          </div>
          <p className="text-xs font-medium text-slate-500 leading-relaxed max-w-[240px]">
            {description}
          </p>
        </div>
        {value && (
          <div className="text-right">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Impact</p>
            <p className="text-3xl font-bold tracking-tighter text-primary">{value}</p>
          </div>
        )}
      </div>

      {metrics && (
        <div className="grid grid-cols-2 gap-4 mb-8">
          {metrics.map((m) => (
            <div key={m.label} className="p-4 rounded-3xl bg-white/40 border border-white/60">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{m.label}</p>
              <p className="text-sm font-bold text-slate-900 tracking-tight">{m.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex-1">
        {children && (
          <div className="mb-8 pt-6 border-t border-slate-100">
            {children}
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-auto">
        {actions.map((action) => (
          <GlassButton 
            key={action.label} 
            variant={action.variant || 'secondary'}
            onClick={action.onClick}
            className="flex-1"
          >
            {action.label}
            {action.variant === 'primary' && <ChevronRight className="w-3.5 h-3.5 ml-2" />}
          </GlassButton>
        ))}
      </div>
    </GlassCard>
  );
}