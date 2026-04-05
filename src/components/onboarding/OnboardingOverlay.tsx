"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { 
  Zap, 
  Clock, 
  Camera, 
  ShieldCheck, 
  Cpu, 
  ChevronRight,
  Loader2,
  Activity,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingOverlayProps {
  onSelectGoal: (goal: string) => void;
}

const GOALS = [
  {
    id: 'save_money',
    title: 'Maximize Liquidity',
    description: 'Analyze signals for recurring waste, trial traps, and hidden fees.',
    icon: Zap,
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
    stat: 'Avg. €420 saved/yr'
  },
  {
    id: 'save_time',
    title: 'Temporal Optimization',
    description: 'Identify low-value tasks and automate complex research protocols.',
    icon: Clock,
    color: 'text-success',
    bg: 'bg-success/10',
    border: 'border-success/20',
    stat: 'Avg. 14h saved/mo'
  },
  {
    id: 'analyze_visual',
    title: 'Deep Forensic Audit',
    description: 'Analyze statements, receipts, or technical documents for structural anomalies.',
    icon: Camera,
    color: 'text-accent',
    bg: 'bg-accent/10',
    border: 'border-accent/20',
    stat: '0.04ms logic latency'
  }
];

export function OnboardingOverlay({ onSelectGoal }: OnboardingOverlayProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [isCalibrating, setIsCalibrating] = useState(false);

  const handleSelect = (goalId: string) => {
    setSelected(goalId);
    setIsCalibrating(true);
    // Simulate high-end calibration logic before proceeding
    setTimeout(() => {
      onSelectGoal(goalId);
    }, 2500);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-[#FBFBFE]/95 backdrop-blur-3xl flex items-center justify-center p-6 overflow-y-auto"
    >
      <div className="max-w-5xl w-full py-12">
        <AnimatePresence mode="wait">
          {!isCalibrating ? (
            <motion.div 
              key="selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-16"
            >
              <header className="text-center space-y-8">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="w-20 h-20 rounded-[2.5rem] bg-white border border-slate-100 shadow-xl mx-auto flex items-center justify-center text-primary"
                >
                  <Cpu className="w-10 h-10" />
                </motion.div>
                
                <div className="space-y-3">
                  <motion.h1 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-6xl md:text-8xl font-bold tracking-tighter text-slate-900 leading-[0.85]"
                  >
                    Initialize.<br/>Protocol
                  </motion.h1>
                  <motion.p 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-lg text-slate-500 font-medium max-w-lg mx-auto"
                  >
                    Select your primary objective to calibrate the Agent Engine for your first autonomous audit.
                  </motion.p>
                </div>
              </header>

              <div className="grid md:grid-cols-3 gap-8">
                {GOALS.map((goal, idx) => (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + (idx * 0.1), ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Card 
                      className={cn(
                        "glass-card h-full flex flex-col p-8 cursor-pointer transition-all hover:scale-[1.03] active:scale-[0.98] group relative overflow-hidden border-white/80 shadow-lg hover:shadow-2xl",
                        selected === goal.id && "ring-2 ring-primary border-transparent"
                      )}
                      onClick={() => handleSelect(goal.id)}
                    >
                      <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700", goal.bg)} />
                      
                      <div className="relative z-10 space-y-8 flex-1 flex flex-col">
                        <div className="flex justify-between items-start">
                          <div className={cn("w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-500", goal.color)}>
                            <goal.icon className="w-7 h-7" />
                          </div>
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                            {goal.stat}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h3 className="text-2xl font-bold tracking-tight text-slate-900 leading-none">{goal.title}</h3>
                          <p className="text-sm text-slate-500 leading-relaxed font-medium">{goal.description}</p>
                        </div>

                        <div className="mt-auto pt-8">
                          <div className={cn("flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em]", goal.color)}>
                            Activate Node <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>

              <footer className="flex flex-col items-center gap-6 pt-12">
                <div className="flex items-center gap-3 px-6 py-2 bg-white/40 border border-white/80 rounded-full shadow-sm backdrop-blur-md">
                  <ShieldCheck className="w-4 h-4 text-success" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Secure Logic Sandbox Active</p>
                </div>
                <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest max-w-xs text-center leading-relaxed">
                  First calibration takes ~2s. All data is encrypted and processed via isolated reasoning cores.
                </p>
              </footer>
            </motion.div>
          ) : (
            <motion.div 
              key="calibrating"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center space-y-12 text-center"
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="w-32 h-32 rounded-full border-2 border-primary/10 border-t-primary"
                />
                <Activity className="w-10 h-10 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h2 className="text-4xl font-bold tracking-tighter text-slate-900">Neural Calibration</h2>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <p className="text-sm font-bold uppercase tracking-[0.3em] text-slate-400 animate-pulse">
                    Aligning reasoning vectors...
                  </p>
                  <div className="flex items-center gap-4 text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-4 py-1.5 rounded-full border border-primary/10">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Target: {GOALS.find(g => g.id === selected)?.title}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
