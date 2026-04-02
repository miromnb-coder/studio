"use client";

import { Navbar } from '@/components/layout/Navbar';
import { MoneySaver } from '@/components/MoneySaver';
import { motion } from 'framer-motion';

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
            <h1 className="text-6xl md:text-8xl font-bold font-headline leading-[0.9] tracking-tight">Optimizer</h1>
            <p className="text-muted-foreground text-xl max-w-md font-medium">The autonomous agent for recurring burn.</p>
          </motion.div>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <MoneySaver />
        </motion.div>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-12">
          <div className="premium-card bg-white/[0.01] space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Intelligence</p>
            <h3 className="text-xl font-bold font-headline text-foreground">Alternative Detection</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              I scan current market rates for every subscription detected to find you a better deal instantly.
            </p>
          </div>
          <div className="premium-card bg-white/[0.01] space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-success">Autonomous</p>
            <h3 className="text-xl font-bold font-headline text-foreground">Draft Generation</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              For every high-burn item, I prepare a professional cancellation or price-match script for you.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
