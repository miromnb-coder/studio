"use client";

import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  ArrowRight, 
  Zap, 
  Star, 
  ChevronLeft,
  Activity,
  BrainCircuit,
  Search,
  Database,
  Hammer,
  Loader2,
  CheckCircle2,
  Lock,
  Sparkles,
  TrendingUp,
  Clock,
  HelpCircle
} from 'lucide-react';
import { UpgradeFeatureCard } from '@/components/upgrade/UpgradeFeatureCard';
import { UpgradeComparison } from '@/components/upgrade/UpgradeComparison';
import { UpgradePlanCard } from '@/components/upgrade/UpgradePlanCard';
import { UpgradeValueMetrics } from '@/components/upgrade/UpgradeValueMetrics';
import { GlassButton } from '@/components/ui/GlassButton';
import { useState, useEffect } from 'react';
import { SubscriptionService } from '@/services/subscription-service';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const FEATURES = [
  { 
    title: "Unlimited Reasoning", 
    desc: "Remove daily cognitive limits. Let the agent process unlimited messages and complex multi-step tasks.", 
    benefit: "Infinite Logic", 
    icon: "BrainCircuit" 
  },
  { 
    title: "Forensic Leak Detector", 
    desc: "Advanced visual and textual scanning for predatory subscriptions, hidden fees, and billing anomalies.", 
    benefit: "Max Liquidity", 
    icon: "Search" 
  },
  { 
    title: "Permanent Neural Memory", 
    desc: "Agent retains context across every session forever. Deeply personalized responses based on your entire history.", 
    benefit: "Deep Context", 
    icon: "Database" 
  },
  { 
    title: "Custom Protocol Forging", 
    desc: "Create specialized autonomous tools for your specific needs—from specialized research to automated follow-ups.", 
    benefit: "Expert Skills", 
    icon: "Hammer" 
  },
];

export default function UpgradePage() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [status, setStatus] = useState<any>(null);
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login?redirect=/upgrade');
    }
  }, [user, isUserLoading, router]);

  // Real-time status listener
  useEffect(() => {
    if (db && user) {
      const unsub = onSnapshot(doc(db, 'users', user.uid), () => {
        SubscriptionService.getUserStatus(db, user.uid).then(setStatus);
      });
      return () => unsub();
    }
  }, [db, user]);

  const handleSelectPlan = async (planId: string) => {
    if (!user || !db) return;
    setLoadingPlan(planId);
    
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, planId }),
      });

      const result = await response.json();

      if (result.success) {
        toast({ 
          title: "Clearance Elevated", 
          description: `Welcome to ${planId.toUpperCase()} clearance. Your protocols are now active.` 
        });
        router.push(result.redirectUrl || '/dashboard');
      } else {
        throw new Error(result.error || "Checkout failed");
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: "Sync Failed", description: err.message });
    } finally {
      setLoadingPlan(null);
    }
  };

  if (isUserLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const currentPlan = status?.plan || 'FREE';

  return (
    <div className="min-h-screen bg-[#FBFBFE] pb-48 selection:bg-primary/10">
      {/* Dynamic Header */}
      <header className="fixed top-0 inset-x-0 z-[100] h-20 bg-white/40 backdrop-blur-3xl border-b border-white/60 flex items-center px-8 justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors group">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Return to Console
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <Star className="w-4 h-4 fill-white" />
          </div>
          <span className="text-sm font-black tracking-tighter text-slate-900 uppercase">Operator Ultra</span>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-100 rounded-full">
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Active Level:</span>
          <span className="text-[8px] font-black text-primary uppercase tracking-widest">{currentPlan}</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto pt-40 px-6 space-y-32">
        {/* Hero Section */}
        <section className="text-center space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.3em]"
          >
            <Zap className="w-3 h-3 fill-primary" />
            Strategic Elevation Required
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-7xl md:text-9xl font-black tracking-tighter text-slate-900 leading-[0.8] mb-4"
          >
            Scale your<br/>Intelligence.
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed"
          >
            Ultra clearance removes daily cognitive caps and enables high-frequency forensics for your entire digital ecosystem.
          </motion.p>
        </section>

        {/* Personalized Value Telemetry */}
        <section className="space-y-12">
          <div className="flex items-center justify-center gap-4 text-slate-400">
            <div className="h-px w-12 bg-slate-100" />
            <Activity className="w-5 h-5" />
            <h3 className="text-[11px] font-black uppercase tracking-[0.4em]">Real-Time Value Signal</h3>
            <div className="h-px w-12 bg-slate-100" />
          </div>
          <UpgradeValueMetrics />
        </section>

        {/* Advanced Capabilities Grid */}
        <section className="space-y-16">
          <div className="text-center space-y-2">
            <h3 className="text-4xl font-bold tracking-tighter text-slate-900">Ultra Protocols</h3>
            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Exclusive to High-Clearance Operators</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f, i) => (
              <UpgradeFeatureCard key={i} {...f} idx={i} />
            ))}
          </div>
        </section>

        {/* Comparison Analysis */}
        <section className="py-24 bg-primary/5 rounded-[4rem] px-8 md:px-16 border border-primary/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px] -mr-48 -mt-48" />
          <UpgradeComparison />
        </section>

        {/* Plan Selection */}
        <section id="plans" className="space-y-20 scroll-mt-32">
          <div className="text-center space-y-4">
            <h2 className="text-6xl font-black tracking-tighter text-slate-900">Select Clearance.</h2>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Flexible monthly cognitive cycles. Cancel anytime.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <UpgradePlanCard 
              name="Starter" 
              price="€9" period="/mo" 
              description="Boost your efficiency core."
              features={[
                "20 Reasoning Runs / Day",
                "Advanced Tool Access",
                "30 Day Neural Memory",
                "Priority Support Loop"
              ]}
              onSelect={() => handleSelectPlan('starter')}
              loading={loadingPlan === 'starter'}
              isPopular={false}
            />
            <UpgradePlanCard 
              name="Ultra" 
              price="€19" period="/mo" 
              description="Complete cognitive automation."
              isPopular
              features={[
                "Unlimited Reasoning Cycles",
                "Full Marketplace Access",
                "Permanent Neural Context",
                "Priority Protocol Forging",
                "Early Beta Feature Access"
              ]}
              onSelect={() => handleSelectPlan('premium')}
              loading={loadingPlan === 'premium'}
            />
          </div>
        </section>

        {/* Security & Trust */}
        <footer className="text-center space-y-12 pt-20 border-t border-slate-100">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
            <div className="flex flex-col items-center gap-3">
              <ShieldCheck className="w-8 h-8" />
              <span className="text-[9px] font-black uppercase tracking-widest">AES-256 Encryption</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <Lock className="w-8 h-8" />
              <span className="text-[9px] font-black uppercase tracking-widest">Secure Checkout</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <Sparkles className="w-8 h-8" />
              <span className="text-[9px] font-black uppercase tracking-widest">AI Verified</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <HelpCircle className="w-8 h-8" />
              <span className="text-[9px] font-black uppercase tracking-widest">24/7 Priority</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 max-w-sm mx-auto font-bold uppercase tracking-widest leading-relaxed">
            Subscriptions billed monthly. Managing or terminating your session is available via System Setup.
          </p>
        </footer>
      </main>

      {/* Sticky Primary CTA */}
      {currentPlan !== 'PREMIUM' && (
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-lg px-6 z-[150]"
        >
          <GlassButton 
            onClick={() => {
              const el = document.getElementById('plans');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full !h-16 !text-lg !rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(59,130,246,0.3)] group relative overflow-hidden bg-primary border-0 text-white"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            Elevate Clearance Now
            <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </GlassButton>
        </motion.div>
      )}
    </div>
  );
}
