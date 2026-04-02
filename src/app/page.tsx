"use client";

import { Navbar } from '@/components/layout/Navbar';
import { motion } from 'framer-motion';
import { Zap, ShieldCheck, Mail, ArrowRight, Sparkles, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 flex flex-col items-center justify-center px-6 relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-4xl w-full text-center space-y-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border-white/10 text-[10px] font-bold uppercase tracking-widest text-primary"
          >
            <Sparkles className="w-3 h-3" />
            V1 Core Engine Active
          </motion.div>

          <div className="space-y-6">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-6xl md:text-8xl font-bold font-headline tracking-tighter leading-[0.9] text-gradient"
            >
              Find hidden spending <br />before it drains you.
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed"
            >
              AI Life Operator is your autonomous financial scout. It hunts for trials, price hikes, and forgotten subscriptions while you sleep.
            </motion.p>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Button asChild size="lg" className="h-16 px-10 rounded-2xl text-lg font-bold glow-primary group">
              <Link href="/analyze">
                Initialize Analysis
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="lg" className="h-16 px-10 rounded-2xl text-lg font-medium hover:bg-white/5">
              <Link href="/dashboard">Enter Console</Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="grid grid-cols-2 md:grid-cols-3 gap-8 pt-24 border-t border-white/5"
          >
            <div className="space-y-2">
              <p className="text-2xl font-bold font-headline">$420M+</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Unclaimed Waste</p>
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold font-headline">24/7</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Autonomous Monitoring</p>
            </div>
            <div className="space-y-2 hidden md:block">
              <p className="text-2xl font-bold font-headline">98.2%</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Detection Accuracy</p>
            </div>
          </motion.div>
        </div>
      </main>

      <footer className="p-8 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground/30">
        © 2024 Operator Protocol • Intelligence at Scale
      </footer>
    </div>
  );
}
