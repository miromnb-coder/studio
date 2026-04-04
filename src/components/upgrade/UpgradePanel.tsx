"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, ArrowRight, Zap, Star } from 'lucide-react';
import { UpgradeFeatureCard } from './UpgradeFeatureCard';
import { UpgradeComparison } from './UpgradeComparison';
import { UpgradePlanCard } from './UpgradePlanCard';
import { UpgradeValueMetrics } from './UpgradeValueMetrics';
import { GlassButton } from '@/components/ui/GlassButton';
import { useState } from 'react';
import { SubscriptionService } from '@/services/subscription-service';
import { useFirestore, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

const FEATURES = [
  { title: "Unlimited Reasoning", desc: "No daily caps on agent intelligence cycles.", benefit: "Infinite Logic", icon: "BrainCircuit" },
  { title: "Leak Detector Pro", desc: "Advanced forensic scan for all signals.", benefit: "Max Savings", icon: "Search" },
  { title: "Neural Memory", desc: "Agent remembers every detail of your setup.", benefit: "Deep Context", icon: "Database" },
  { title: "Custom Forging", desc: "Create specialized autonomous tools.", benefit: "New Skills", icon: "Hammer" },
];

interface UpgradePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradePanel({ isOpen, onClose }: UpgradePanelProps) {
  const [loading, setLoading] = useState(false);
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const handleUpgrade = async () => {
    if (!user || !db) return;
    setLoading(true);
    const success = await SubscriptionService.upgradeToPremium(db, user.uid);
    if (success) {
      toast({ title: "Welcome to Ultra", description: "Clearance level elevated successfully." });
      onClose();
      window.location.reload();
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 md:p-6 lg:p-12 overflow-hidden">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl pointer-events-auto"
        />

        {/* Content Container */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 40 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative w-full max-w-4xl max-h-full bg-white/80 backdrop-blur-3xl border border-white/80 rounded-[3.5rem] shadow-2xl flex flex-col pointer-events-auto overflow-hidden ring-1 ring-white/40"
        >
          {/* Header */}
          <div className="flex justify-between items-center px-10 py-8 border-b border-white/60 bg-white/40 relative z-20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-xl shadow-primary/20">
                <Star className="w-6 h-6 fill-white" />
              </div>
              <div>
                <h2 className="text-3xl font-black tracking-tighter text-slate-900 leading-none">Operator Ultra</h2>
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mt-1.5">Elevate your intelligence</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="w-12 h-12 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors active:scale-90"
            >
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>

          {/* Scrollable Area */}
          <div className="flex-1 overflow-y-auto px-10 py-12 space-y-20 stealth-scrollbar pb-40">
            {/* Value Section */}
            <section className="space-y-10">
              <div className="text-center space-y-4">
                <h3 className="text-4xl font-bold tracking-tighter text-slate-900">Your Intelligence Telemetry</h3>
                <p className="text-slate-500 font-medium max-w-lg mx-auto leading-relaxed">
                  You've already started optimizing your life. Ultra access removes the friction and scales your results.
                </p>
              </div>
              <UpgradeValueMetrics />
            </section>

            {/* Features Grid */}
            <section className="space-y-10">
              <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 px-2 text-center">Elite Protocol Access</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {FEATURES.map((f, i) => (
                  <UpgradeFeatureCard key={i} {...f} idx={i} />
                ))}
              </div>
            </section>

            {/* Comparison */}
            <UpgradeComparison />

            {/* Plans */}
            <section className="space-y-10 pt-10 border-t border-slate-100/60">
              <div className="text-center space-y-2">
                <h3 className="text-3xl font-bold tracking-tighter text-slate-900">Choose Your Clearance</h3>
                <p className="text-sm font-medium text-slate-400 uppercase tracking-widest">Flexible monthly protocols</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <UpgradePlanCard 
                  name="Starter" 
                  price="€9" period="/mo" 
                  description="Boost your efficiency core."
                  features={["20 Runs / Day", "Advanced Tool Access", "30 Day Memory"]}
                  onSelect={handleUpgrade}
                  loading={loading}
                />
                <UpgradePlanCard 
                  name="Ultra" 
                  price="€19" period="/mo" 
                  description="Full cognitive automation."
                  isPopular
                  features={["Unlimited Reasoning", "Full Marketplace Access", "Permanent Neural Memory", "Priority Forge"]}
                  onSelect={handleUpgrade}
                  loading={loading}
                />
              </div>
            </section>
          </div>

          {/* Sticky Footer CTA */}
          <div className="absolute bottom-0 left-0 right-0 p-8 bg-white/80 backdrop-blur-3xl border-t border-white/80 flex flex-col items-center gap-4 z-30">
            <GlassButton 
              className="w-full max-w-lg !h-16 !text-lg !rounded-[2.5rem] shadow-2xl shadow-primary/20 group relative overflow-hidden"
              onClick={handleUpgrade}
              loading={loading}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              Upgrade to Ultra Now
              <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </GlassButton>
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <ShieldCheck className="w-4 h-4" />
              Secure Checkout via Stripe Protocol
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
