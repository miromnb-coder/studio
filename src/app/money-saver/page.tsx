
"use client";

import { Navbar } from '@/components/layout/Navbar';
import { MoneySaver } from '@/components/MoneySaver';
import { motion } from 'framer-motion';
import { Cpu, Zap, ListChecks } from 'lucide-react';

export default function MoneySaverPage() {
  return (
    <div className="min-h-screen bg-background pb-32 md:pt-32">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-8 space-y-24">
        <header className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3 text-primary mb-4">
              <Zap className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-[0.4em]">Autonomous Optimization</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-bold font-headline leading-[0.9] tracking-tight text-white">Efficiency Autopilot.</h1>
            <p className="text-muted-foreground text-xl max-w-md font-medium">The high-impact intelligence engine for recurring burn mitigation.</p>
          </motion.div>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="mb-12">
             <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground mb-6 flex items-center gap-2">
                <ListChecks className="w-3.5 h-3.5" />
                Active AI Recommendations
             </h3>
             <div className="grid grid-cols-1 gap-4 opacity-50 cursor-not-allowed">
               <div className="premium-card bg-white/[0.02] flex items-center justify-between">
                  <span className="text-sm font-bold">Consolidate redundant subscriptions</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Pending Pattern Audit</span>
               </div>
             </div>
          </div>
          <MoneySaver />
        </motion.div>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-12">
          <div className="premium-card bg-white/[0.01] space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Neural Analysis</p>
            <h3 className="text-xl font-bold font-headline text-foreground">Pattern Recognition</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Autopilot scans market rates for every subscription detected to find you a better deal instantly via neutral logic.
            </p>
          </div>
          <div className="premium-card bg-white/[0.01] space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-success">Execution</p>
            <h3 className="text-xl font-bold font-headline text-foreground">Protocol Generation</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              For every high-burn item, Autopilot prepares a professional negotiation or cancellation script for immediate use.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
