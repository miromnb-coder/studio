import { Navbar } from '@/components/layout/Navbar';
import { MoneySaver } from '@/components/MoneySaver';
import { motion } from 'framer-motion';
import { Zap, ShieldCheck, TrendingDown } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 max-w-5xl mx-auto px-8 pt-32 pb-32 space-y-24">
        {/* Savings Hero */}
        <header className="space-y-8 text-center md:text-left">
          <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-primary/5 border border-primary/10 text-[10px] font-bold uppercase tracking-widest text-primary">
            <Zap className="w-3 h-3 animate-pulse" />
            Agentic Savings Engine V1
          </div>
          
          <div className="space-y-4">
            <h1 className="text-7xl md:text-9xl font-bold font-headline leading-[0.9] tracking-tighter">
              Stop the <span className="text-primary glow-primary">Bleed.</span>
            </h1>
            <p className="text-2xl text-muted-foreground max-w-2xl font-medium leading-relaxed">
              The proactive operator that hunts subscriptions, kills hidden fees, and negotiates your bills while you sleep.
            </p>
          </div>
        </header>

        {/* Primary Action Area */}
        <section className="relative">
          <div className="absolute inset-0 bg-primary/5 blur-[120px] rounded-full -z-10" />
          <MoneySaver />
        </section>

        {/* Trust Indicators */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-12">
          <div className="space-y-4">
            <ShieldCheck className="w-8 h-8 text-success" />
            <h3 className="text-xl font-bold font-headline">Zero-Knowledge</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">Your data is processed in a secure sandbox and never sold to third parties.</p>
          </div>
          <div className="space-y-4">
            <Zap className="w-8 h-8 text-primary" />
            <h3 className="text-xl font-bold font-headline">Instant Scripts</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">We don't just find savings; we write the cancellation emails for you.</p>
          </div>
          <div className="space-y-4">
            <TrendingDown className="w-8 h-8 text-accent" />
            <h3 className="text-xl font-bold font-headline">Passive Defense</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">Forward your receipts once, and our operator monitors for price hikes automatically.</p>
          </div>
        </section>
      </main>

      <footer className="py-12 px-8 border-t border-white/5">
        <div className="max-w-5xl mx-auto flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
          <p>© 2024 AI Life Operator. Reclaim your burn.</p>
          <div className="flex gap-8">
            <span>Privacy</span>
            <span>Security</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
