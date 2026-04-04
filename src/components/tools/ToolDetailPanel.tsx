"use client";

import { ToolDefinition } from './types';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { ToolStatusBadge } from './ToolStatusBadge';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ShieldCheck, Activity, Cpu, 
  Terminal, History, Zap, Trash2,
  Lock, CheckCircle2, AlertCircle
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { ToolRegistryManager } from './ToolRegistryManager';

interface ToolDetailPanelProps {
  tool: ToolDefinition | null;
  onClose: () => void;
}

export function ToolDetailPanel({ tool, onClose }: ToolDetailPanelProps) {
  if (!tool) return null;

  const Icon = (LucideIcons as any)[tool.icon] || LucideIcons.Package;

  const handleAction = (status: 'active' | 'disabled' | 'installed') => {
    ToolRegistryManager.updateToolStatus(tool.id, status);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] pointer-events-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/10 backdrop-blur-md pointer-events-auto"
        />

        {/* Panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="absolute right-0 top-0 bottom-0 w-full max-w-xl bg-white/80 backdrop-blur-3xl border-l border-white/60 shadow-2xl pointer-events-auto overflow-y-auto"
        >
          <div className="p-8 md:p-12 space-y-12 pb-32">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div className="w-16 h-16 rounded-[2rem] bg-white border border-slate-100 shadow-sm flex items-center justify-center text-primary">
                <Icon className="w-8 h-8" />
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <h2 className="text-4xl font-bold tracking-tighter text-slate-900">{tool.name}</h2>
                <ToolStatusBadge status={tool.status} />
              </div>
              <p className="text-xl text-slate-500 font-medium leading-relaxed italic">
                "{tool.description}"
              </p>
            </div>

            {/* Metrics HUD */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Utilization', val: tool.metrics.usageCount, icon: Activity },
                { label: 'Time Reclaimed', val: `~${tool.metrics.timeSavedMinutes}m`, icon: Zap },
                { label: 'Version', val: `v${tool.version}`, icon: Cpu }
              ].map((m, i) => (
                <div key={i} className="p-4 rounded-3xl bg-white/40 border border-white/60 shadow-sm">
                  <m.icon className="w-4 h-4 text-primary/40 mb-3" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{m.label}</p>
                  <p className="text-sm font-bold text-slate-900">{m.val}</p>
                </div>
              ))}
            </div>

            {/* Detailed Description */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Intelligence Scope</h4>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                {tool.longDescription}
              </p>
            </div>

            {/* Permissions */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-success" />
                <h4 className="text-sm font-bold text-slate-900">Security & Clearance</h4>
              </div>
              <div className="space-y-3">
                {tool.permissions.map((p, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-50/50 border border-slate-100">
                    <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                    <span className="text-xs font-bold text-slate-600">{p}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Schemas */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Terminal className="w-5 h-5 text-slate-400" />
                <h4 className="text-sm font-bold text-slate-900">Technical Interface</h4>
              </div>
              <GlassCard className="!p-6 bg-slate-900 border-0 shadow-none overflow-hidden group">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Protocol Definition</span>
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                </div>
                <code className="text-[10px] font-mono text-primary leading-relaxed">
                  {`tool "${tool.id}" {\n  input: { context: "string" },\n  output: { result: "Analysis" }\n}`}
                </code>
              </GlassCard>
            </div>
          </div>

          {/* Action Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-8 bg-white/80 backdrop-blur-xl border-t border-slate-100 flex gap-4">
            {tool.status === 'active' ? (
              <GlassButton 
                variant="secondary" 
                className="flex-1 !h-14 !rounded-2xl"
                onClick={() => handleAction('disabled')}
              >
                Disable Engine
              </GlassButton>
            ) : (
              <GlassButton 
                variant="primary" 
                className="flex-1 !h-14 !rounded-2xl shadow-xl shadow-primary/20"
                onClick={() => handleAction('active')}
              >
                Activate Protocol
              </GlassButton>
            )}
            <GlassButton 
              variant="ghost" 
              className="w-14 !h-14 !rounded-2xl text-danger hover:bg-danger/10"
              onClick={() => handleAction('available')}
            >
              <Trash2 className="w-5 h-5" />
            </GlassButton>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
