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
  Lock,
  Sparkles,
  ShieldCheck
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
            className="fixed inset-0 z-[190] bg-slate-900/20 backdrop-blur-md md:hidden"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20, x: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20, x: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-24 right-6 md:right-8 z-[200] w-[calc(100%-3rem)] md:w-[420px]"
          >
            <GlassCard className="!p-0 border-white/80 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.25)] overflow-hidden rounded-[2.5rem]">
              {/* Header */}
              <div className="p-8 bg-white/60 border-b border-white/80 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                    <Cpu className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black tracking-tighter text-slate-900 uppercase">Intelligence Hub</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        state.status === 'error' ? 'bg-danger' : 
                        state.status === 'idle' ? 'bg-slate-300' : 'bg-success animate-pulse'
                      )} />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{state.status} mode</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white transition-all active:scale-90"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-8 space-y-10 max-h-[60vh] overflow-y-auto stealth-scrollbar">
                {/* Current Intent */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                    <Target className="w-4 h-4 text-primary" />
                    Strategic Objective
                  </div>
                  <div className="p-6 rounded-3xl bg-white/40 border border-white/80 text-sm font-bold text-slate-700 leading-relaxed italic shadow-inner">
                    "{state.intent || 'Passive signal monitoring active...'}"
                  </div>
                </div>

                {/* Technical Telemetry */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 rounded-3xl bg-slate-50/50 border border-slate-100 flex flex-col gap-3 group hover:bg-white transition-all">
                    <Activity className="w-4 h-4 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Logic Node</p>
                      <p className="text-xs font-bold text-slate-900 truncate">{state.currentTool || 'Central Reasoning'}</p>
                    </div>
                  </div>
                  <div className="p-5 rounded-3xl bg-slate-50/50 border border-slate-100 flex flex-col gap-3 group hover:bg-white transition-all">
                    <Zap className="w-4 h-4 text-success opacity-40 group-hover:opacity-100 transition-opacity" />
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Latency</p>
                      <p className="text-xs font-bold text-slate-900">0.04ms Adaptive</p>
                    </div>
                  </div>
                </div>

                {/* Execution Trace */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                      <Terminal className="w-4 h-4 text-slate-400" />
                      Protocol Steps
                    </div>
                    {state.status === 'thinking' && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
                  </div>
                  
                  <div className="space-y-4">
                    {state.steps.length > 0 ? (
                      state.steps.map((step, i) => (
                        <motion.div 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          key={i} 
                          className="flex items-center gap-4 group"
                        >
                          <div className={cn(
                            "w-2 h-2 rounded-full transition-all duration-500",
                            step.status === 'active' ? 'bg-primary ring-4 ring-primary/10 animate-pulse' : 
                            step.status === 'complete' ? 'bg-success' : 'bg-slate-200'
                          )} />
                          <span className={cn(
                            "text-[11px] font-bold transition-colors",
                            step.status === 'active' ? 'text-slate-900' : 'text-slate-400'
                          )}>
                            {step.label}
                          </span>
                        </motion.div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 opacity-30 gap-4">
                        <Sparkles className="w-10 h-10 text-slate-200" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Waiting for data signals</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Security Badge */}
              <div className="p-6 bg-slate-50/80 border-t border-slate-100 flex items-center justify-center gap-3">
                <ShieldCheck className="w-4 h-4 text-success opacity-60" />
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">End-to-End Neural Encryption</p>
              </div>
            </GlassCard>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
