
"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Zap, 
  Clock, 
  Camera, 
  ArrowRight,
  ShieldCheck,
  Cpu
} from 'lucide-react';

interface OnboardingOverlayProps {
  onSelectGoal: (goal: string) => void;
}

const GOALS = [
  {
    id: 'save_money',
    title: 'Save me money',
    description: 'Find subscriptions, fees, and market better alternatives.',
    icon: Zap,
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
  },
  {
    id: 'save_time',
    title: 'Save me time',
    description: 'Automate negotiations and protocol research.',
    icon: Clock,
    color: 'text-accent',
    bg: 'bg-accent/10',
    border: 'border-accent/20',
  },
  {
    id: 'analyze_visual',
    title: 'Analyze Document',
    description: 'Scan bank statements or receipts for anomalies.',
    icon: Camera,
    color: 'text-success',
    bg: 'bg-success/10',
    border: 'border-success/20',
  }
];

export function OnboardingOverlay({ onSelectGoal }: OnboardingOverlayProps) {
  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-4xl w-full space-y-12"
      >
        <header className="text-center space-y-6">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-16 h-16 rounded-3xl bg-primary mx-auto flex items-center justify-center text-background shadow-2xl shadow-primary/20"
          >
            <Cpu className="w-8 h-8" />
          </motion.div>
          
          <div className="space-y-2">
            <h1 className="text-5xl md:text-7xl font-bold font-headline tracking-tighter text-white">Select Protocol.</h1>
            <p className="text-xl text-muted-foreground font-medium uppercase tracking-widest text-[10px] font-bold">Initialize your AI Life Operator intent.</p>
          </div>
        </header>

        <div className="grid md:grid-cols-3 gap-6">
          {GOALS.map((goal, idx) => (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card 
                className={`premium-card h-full flex flex-col items-center text-center p-8 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] group ${goal.bg} ${goal.border}`}
                onClick={() => onSelectGoal(goal.id)}
              >
                <div className={`w-14 h-14 rounded-2xl bg-black/20 flex items-center justify-center mb-6 ${goal.color} group-hover:scale-110 transition-transform`}>
                  <goal.icon className="w-7 h-7" />
                </div>
                <div className="space-y-2 mb-8">
                  <h3 className="text-xl font-bold font-headline text-white">{goal.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed font-medium">{goal.description}</p>
                </div>
                <Button variant="ghost" className={`mt-auto w-full rounded-xl uppercase tracking-widest text-[10px] font-bold gap-2 ${goal.color}`}>
                  Initialize <ArrowRight className="w-3 h-3" />
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>

        <footer className="flex justify-center items-center gap-3">
          <ShieldCheck className="w-4 h-4 text-muted-foreground/30" />
          <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-muted-foreground/30">Secure Logic Sandbox Active</p>
        </footer>
      </motion.div>
    </div>
  );
}
