"use client";

import { ToolDefinition } from './types';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { ToolStatusBadge } from './ToolStatusBadge';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ShieldCheck, Activity, Cpu, 
  Terminal, Zap, Trash2,
  CheckCircle2, Lock, Eye, AlertCircle
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { ToolRegistryManager } from './ToolRegistryManager';
import { cn } from '@/lib/utils';

interface ToolDetailPanelProps {
  tool: ToolDefinition | null;
  onClose: () => void;
}

export function ToolDetailPanel({ tool, onClose }: ToolDetailPanelProps) {
  if (!tool) return null;

  const Icon = (LucideIcons as any)[tool.icon] || LucideIcons.Package;

  const handleAction = (status: 'active' | 'available') => {
    ToolRegistryManager.updateToolStatus(tool.id, status);
    onClose();
  };

  const isAccessBlocked = tool.id === 'finance' && !localStorage.getItem('operator_gmail_token');

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] pointer-events-none">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/10 backdrop-blur-md pointer-events-auto"
        />

        <motion.div
          initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="absolute right-0 top-0 bottom-0 w-full max-w-xl bg-white/80 backdrop-blur-3xl border-l border-white/60 shadow-2xl pointer-events-auto overflow-y-auto"
        >
          <div className="p-8 md:p-12 space-y-12 pb-32">
            <div className="flex justify-between items-start">
              <div className="w-16 h-16 rounded-[2rem] bg-white border border-slate-100 shadow-sm flex items-center justify-center text-primary">
                <Icon className="w-8 h-8" />
              </div>
              <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors">
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

            {/* Deep Value Tracking */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-5 rounded-[2rem] bg-white/40 border border-white/60 shadow-sm">
                <Activity className="w-4 h-4 text-primary/40 mb-3" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Impact</p>
                <p className="text-lg font-bold text-slate-900">High</p>
              </div>
              <div className="p-5 rounded-[2rem] bg-white/40 border border-white/60 shadow-sm">
                <Zap className="w-4 h-4 text-success/40 mb-3" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Reclaimed</p>
                <p className="text-lg font-bold text-success">${tool.metrics.moneySavedAmount}</p>
              </div>
              <div className="p-5 rounded-[2rem] bg-white/40 border border-white/60 shadow-sm">
                <Cpu className="w-4 h-4 text-primary/40 mb-3" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Used</p>
                <p className="text-lg font-bold text-slate-900">{tool.metrics.usageCount}x</p>
              </div>
            </div>

            {/* Access Scopes */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-success" />
                  <h4 className="text-sm font-bold text-slate-900">Clearance & Permissions</h4>
                </div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Audit Status: Verified</div>
              </div>
              <div className="space-y-3">
                {tool.permissions.map((p, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-4 rounded-2xl bg-slate-50/50 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">{p}</span>
                    </div>
                    <Eye className="w-3.5 h-3.5 text-slate-300" />
                  </div>
                ))}
                {isAccessBlocked && (
                  <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-danger/5 border border-danger/10">
                    <AlertCircle className="w-4 h-4 text-danger" />
                    <span className="text-xs font-bold text-danger">Connection missing for this scope.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Protocol Interface */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Terminal className="w-5 h-5 text-slate-400" />
                <h4 className="text-sm font-bold text-slate-900">Technical Logic Interface</h4>
              </div>
              <GlassCard className="!p-8 bg-slate-900 border-0 shadow-none overflow-hidden group">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Protocol V{tool.version}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-bold text-success uppercase">Executable</span>
                    <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  </div>
                </div>
                <code className="text-[11px] font-mono text-primary/80 leading-relaxed block">
                  {`tool "${tool.id}" {\n  input: { context: "string" },\n  output: { \n    impact: number,\n    findings: array\n  }\n}`}
                </code>
              </GlassCard>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-8 bg-white/80 backdrop-blur-xl border-t border-slate-100 flex gap-4">
            {tool.status === 'active' ? (
              <GlassButton 
                variant="secondary" 
                className="flex-1 !h-14 !rounded-2xl"
                onClick={() => handleAction('available')}
              >
                Disable Protocol
              </GlassButton>
            ) : (
              <GlassButton 
                variant="primary" 
                className="flex-1 !h-14 !rounded-2xl shadow-xl shadow-primary/20"
                onClick={() => handleAction('active')}
              >
                Enable Logic Loop
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
