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
  CheckCircle2
} from 'lucide-react';
import { UpgradeFeatureCard } from '@/components/upgrade/UpgradeFeatureCard';
import { UpgradeComparison } from '@/components/upgrade/UpgradeComparison';
import { UpgradePlanCard } from '@/components/upgrade/UpgradePlanCard';
import { UpgradeValueMetrics } from '@/components/upgrade/UpgradeValueMetrics';
import { GlassButton } from '@/components/ui/GlassButton';
import { useState, useEffect } from 'react';
import { SubscriptionService } from '@/services/subscription-service';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const FEATURES = [
  { title: "Unlimited Reasoning", desc: "No daily caps on agent intelligence cycles.", benefit: "Infinite Logic", icon: "BrainCircuit" },
  { title: "Leak Detector Pro", desc: "Advanced forensic scan for all signals.", benefit: "Max Savings", icon: "Search" },
  { title: "Neural Memory", desc: "Agent remembers every detail of your setup.", benefit: "Deep Context", icon: "Database" },
  { title: "Custom Forging", desc: "Create specialized autonomous tools.", benefit: "New Skills", icon: "Hammer" },
];

export default function UpgradePage() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const userRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid);
  }, [db, user]);

  const { data: profile } = useDoc(userRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login?redirect=/upgrade');
    }
  }, [user, isUserLoading, router]);

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
        toast({ title: "Protocol Elevated", description: `Welcome to ${planId.toUpperCase()}. Your clearance is updated.` });
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

  const currentPlan = profile?.plan || 'FREE';

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="fixed top-0 inset-x-0 z-50 h-20 bg-white/40 backdrop-blur-3xl border-b border-white/60 flex items-center px-8 justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors group">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Operator
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <Star className="w-4 h-4 fill-white" />
          </div>
          <span className="text-sm font-black tracking-tighter text-slate-900 uppercase">Operator Ultra</span>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-100 rounded-full">
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Clearance:</span>
          <span className="text-[8px] font-bold text-primary uppercase tracking-widest">{currentPlan}</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto pt-40 px-6 space-y-32">
        <section className="text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.3em]"
          >
            <Zap className="w-3 h-3 fill-primary" />
            Strategic Elevation Available
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-black tracking-tighter text-slate-900 leading-[0.85]"
          >
            Maximize your<br/>Intelligence.
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed"
          >
            Ultra clearance removes daily cognitive limits and enables forensic-grade automation for your entire digital life.
          </motion.p>
        </section>

        <section className="space-y-12">
          <div className="flex items-center justify-center gap-4 text-slate-400">
            <Activity className="w-5 h-5" />
            <h3 className="text-[11px] font-black uppercase tracking-[0.4em]">Historical Yield</h3>
          </div>
          <UpgradeValueMetrics />
        </section>

        <section id="plans" className="space-y-16 scroll-mt-32">
          <div className="text-center space-y-2">
            <h2 className="text-5xl font-black tracking-tighter text-slate-900">Select your level.</h2>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Flexible monthly cognitive protocols</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <UpgradePlanCard 
              name="Starter" 
              price="€9" period="/mo" 
              description="Boost your efficiency core."
              features={["20 Runs / Day", "Advanced Tool Access", "30 Day Neural Memory", "Priority Support"]}
              onSelect={() => handleSelectPlan('starter')}
              loading={loadingPlan === 'starter'}
              isPopular={false}
            />
            <UpgradePlanCard 
              name="Ultra" 
              price="€19" period="/mo" 
              description="Full cognitive automation."
              isPopular
              features={["Unlimited Reasoning", "Full Marketplace Access", "Permanent Neural Memory", "Priority Tool Forge", "Early Feature Access"]}
              onSelect={() => handleSelectPlan('premium')}
              loading={loadingPlan === 'premium'}
            />
          </div>
        </section>

        <section className="space-y-16">
          <div className="text-center space-y-2">
            <h3 className="text-3xl font-bold tracking-tighter text-slate-900">Advanced Capabilities</h3>
            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Forensic logic for Ultra users</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {FEATURES.map((f, i) => (
              <UpgradeFeatureCard key={i} {...f} idx={i} />
            ))}
          </div>
        </section>

        <section className="py-20 bg-primary/5 rounded-[4rem] px-8 md:px-12 border border-primary/10">
          <UpgradeComparison />
        </section>

        <footer className="text-center space-y-6 pt-20 border-t border-slate-100">
          <div className="flex items-center justify-center gap-3">
            <ShieldCheck className="w-6 h-6 text-success" />
            <p className="text-sm font-bold text-slate-900">Secure Protocol via Stripe Encryption</p>
          </div>
          <p className="text-xs text-slate-400 max-w-sm mx-auto font-medium">
            Subscriptions renew automatically. Manage or cancel anytime via your billing dashboard.
          </p>
        </footer>
      </main>

      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-lg px-6 z-50"
      >
        <GlassButton 
          onClick={() => {
            const el = document.getElementById('plans');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="w-full !h-16 !text-lg !rounded-[2.5rem] shadow-2xl shadow-primary/20 group relative overflow-hidden"
        >
          Elevate Clearance Now
          <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </GlassButton>
      </motion.div>
    </div>
  );
}
