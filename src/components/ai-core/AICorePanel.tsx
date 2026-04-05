'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useAICore } from './AICoreContext';
import { 
  X, 
  Target, 
  Zap, 
  Activity, 
  Cpu, 
  Terminal, 
  CheckCircle2, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';

interface AICorePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AICorePanel({ isOpen, onClose }: AICorePanelProps) {
  const { state } = useAICore();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[190] bg-slate-900/10 backdrop-blur-sm md:hidden"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20, x: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20, x: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-24 right-6 md:right-8 z-[200] w-[calc(100%-3rem)] md:w-96"
          >
            <GlassCard className="!p-0 border-white/80 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] overflow-hidden">
              {/* Header */}
              <div className="p-6 bg-white/40 border-b border-white/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black tracking-tighter text-slate-900 uppercase">Logic Center</h3>
                    <div className="flex items-center gap-1.5">
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full animate-pulse",
                        state.status === 'error' ? 'bg-danger' : 
                        state.status === 'idle' ? 'bg-slate-300' : 'bg-success'
                      )} />
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{state.status}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/60 transition-colors"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Current Intent */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <Target className="w-3 h-3" />
                    Active Objective
                  </div>
                  <div className="p-4 rounded-2xl bg-white/40 border border-white/60 text-xs font-bold text-slate-700 leading-relaxed italic">
                    "{state.intent || 'Monitoring digital signals...'}"
                  </div>
                </div>

                {/* Status Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 flex flex-col gap-2">
                    <Activity className="w-3.5 h-3.5 text-primary opacity-40" />
                    <div className="space-y-0.5">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Current Tool</p>
                      <p className="text-[10px] font-bold text-slate-900 truncate">{state.currentTool || 'Internal Logic'}</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 flex flex-col gap-2">
                    <Zap className="w-3.5 h-3.5 text-success opacity-40" />
                    <div className="space-y-0.5">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Efficiency</p>
                      <p className="text-[10px] font-bold text-slate-900">0.04ms Latency</p>
                    </div>
                  </div>
                </div>

                {/* Activity Log */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <Terminal className="w-3 h-3" />
                      Execution Steps
                    </div>
                    {state.status === 'thinking' && <Loader2 className="w-3 h-3 text-primary animate-spin" />}
                  </div>
                  
                  <div className="space-y-2.5">
                    {state.steps.length > 0 ? (
                      state.steps.map((step, i) => (
                        <div key={i} className="flex items-center gap-3 group">
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full transition-colors",
                            step.status === 'active' ? 'bg-primary animate-pulse' : 
                            step.status === 'complete' ? 'bg-success' : 'bg-slate-200'
                          )} />
                          <span className={cn(
                            "text-[10px] font-bold transition-colors",
                            step.status === 'active' ? 'text-slate-900' : 'text-slate-400'
                          )}>
                            {step.label}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center gap-3 opacity-40 italic">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                        <span className="text-[10px] font-bold text-slate-400">Standby for instructions...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-success opacity-40" />
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Neural Link Verified</p>
              </div>
            </GlassCard>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
