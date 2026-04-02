"use client";

import { Navbar } from '@/components/layout/Navbar';
import { MoneySaver } from '@/components/MoneySaver';
import { motion } from 'framer-motion';
import { Zap, ShieldCheck, Mail, CircleCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-32 pb-32 px-8 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-full -z-10 blur-[120px] opacity-10 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary rounded-full" />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-success rounded-full" />
          </div>

          <div className="max-w-5xl mx-auto text-center space-y-12">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-primary animate-in fade-in slide-in-from-bottom-2 duration-700"
            >
              <Zap className="w-3 h-3 animate-pulse" />
              Autonomous Inbox Operator
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-7xl md:text-9xl font-bold font-headline leading-[0.9] tracking-tighter animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100"
            >
              Your inbox is full of <span className="text-primary glow-primary">hidden money.</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200"
            >
              AI Life Operator proactively hunts for trials, price hikes, and forgotten subscriptions within your forwarded receipts. Plug the leaks automatically.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-8 pt-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300"
            >
              <Button asChild size="lg" className="h-20 px-16 rounded-full text-xl font-bold shadow-2xl shadow-primary/20 group">
                <Link href="/dashboard">
                  Initialize Operator
                  <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <div className="flex items-center gap-4 text-muted-foreground font-bold uppercase tracking-widest text-[10px]">
                <Mail className="w-4 h-4 text-primary" />
                100% Email Driven
              </div>
            </motion.div>
          </div>
        </section>

        {/* Feature Section */}
        <section className="px-8 py-32 max-w-7xl mx-auto grid md:grid-cols-2 gap-24 items-center">
          <div className="space-y-12">
            <div className="w-16 h-16 rounded-[24px] bg-primary/10 flex items-center justify-center text-primary border border-primary/10">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-5xl md:text-7xl font-bold font-headline leading-[0.9] tracking-tight">
              The Proactive <br />Advantage.
            </h2>
            <p className="text-xl text-muted-foreground font-medium leading-relaxed">
              Manual auditing is for the past. Forward your receipts once, and let your operator monitor for price hikes and trial endings in the background.
            </p>
            <ul className="space-y-6">
              {[
                "Automatic Trial Expiration Alerts",
                "Subscription Price Hike Detection",
                "Pre-written Negotiation Scripts",
                "One-click Cancellation Pipeline"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-4 text-foreground/80 font-bold uppercase tracking-widest text-[10px]">
                  <CircleCheck className="w-5 h-5 text-success" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="w-full">
            <div className="premium-card !p-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 bg-primary/10 text-primary text-[10px] font-bold rounded-bl-3xl uppercase tracking-widest">
                Active Hunt
              </div>
              <div className="flex items-center gap-6 mb-12">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h4 className="text-2xl font-bold font-headline">Inbox Analysis</h4>
                  <p className="text-sm text-muted-foreground font-medium">Forwarded 12 minutes ago</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="p-8 rounded-[32px] bg-white/[0.02] border border-white/5 flex justify-between items-center group hover:bg-white/[0.04] transition-all">
                  <div>
                    <p className="text-xl font-bold font-headline">Trial Ending Alert</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Adobe Creative Cloud</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-danger tracking-tight">-$54.99</p>
                    <p className="text-[10px] text-danger/60 font-bold uppercase tracking-widest">Due in 3 days</p>
                  </div>
                </div>

                <div className="p-8 rounded-[32px] bg-white/[0.02] border border-white/5 flex justify-between items-center group hover:bg-white/[0.04] transition-all">
                  <div>
                    <p className="text-xl font-bold font-headline">Negotiation Ready</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Netflix Premium</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-success glow-success tracking-tight">+$4.00</p>
                    <p className="text-[10px] text-success/60 font-bold uppercase tracking-widest">Monthly Saved</p>
                  </div>
                </div>

                <div className="pt-8 border-t border-white/5 flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Reclaim Potential</span>
                  <span className="text-4xl font-bold text-success glow-success font-headline">$58.99</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-24 px-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-background font-bold text-sm">O</div>
            <span className="font-headline font-bold text-xl tracking-tight">AI Life Operator</span>
          </div>
          <div className="flex items-center gap-12 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms</Link>
            <Link href="#" className="hover:text-white transition-colors">Contact</Link>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/30">© 2024 Operator. Reclaim your burn.</p>
        </div>
      </footer>
    </div>
  );
}