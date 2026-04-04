"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { Zap, ShieldCheck, Star, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { SubscriptionService } from '@/services/subscription-service';
import { useFirestore, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

interface PaywallOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: 'limit_reached' | 'premium_tool';
}

export function PaywallOverlay({ isOpen, onClose, reason = 'limit_reached' }: PaywallOverlayProps) {
  const [loading, setLoading] = useState(false);
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const handleUpgrade = async () => {
    if (!user || !db) return;
    setLoading(true);
    const success = await SubscriptionService.upgradeToPremium(db, user.uid);
    if (success) {
      toast({ title: "Welcome to Premium", description: "Your intelligence limits have been removed." });
      onClose();
      window.location.reload(); // Refresh to update all state
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-2xl overflow-hidden"
      >
        <GlassCard className="!p-0 border-white/80 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)]">
          <div className="relative h-48 bg-primary overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-accent to-primary animate-shimmer opacity-50" />
            <Star className="w-20 h-20 text-white opacity-20 absolute -right-4 -top-4 rotate-12" />
            <div className="relative text-center space-y-2">
              <div className="w-16 h-16 rounded-3xl bg-white/20 backdrop-blur-xl mx-auto flex items-center justify-center text-white border border-white/30 mb-4">
                <Zap className="w-8 h-8 fill-white" />
              </div>
              <h2 className="text-3xl font-bold text-white tracking-tight">Unlock Operator Ultra</h2>
            </div>
          </div>

          <div className="p-10 space-y-10">
            <div className="space-y-4 text-center">
              <p className="text-xl font-medium text-slate-600 leading-relaxed">
                {reason === 'limit_reached' 
                  ? "You've reached your daily intelligence quota. Upgrade to maintain peak operational performance."
                  : "This protocol requires Ultra Clearance. Upgrade to access advanced financial forensics."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                "Unlimited Agent Reasoning",
                "Advanced 'Leak Detector' Protocol",
                "Custom Dynamic Tool Creation",
                "Full Neural Memory History",
                "Priority Logic Ingestion",
                "Encrypted Data Vault"
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center text-success">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm font-bold text-slate-700">{feature}</span>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <GlassButton 
                onClick={handleUpgrade}
                loading={loading}
                className="w-full !h-16 !text-lg !rounded-[2rem] shadow-xl shadow-primary/20 group"
              >
                Upgrade to Ultra • €19/mo
                <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </GlassButton>
              <button 
                onClick={onClose}
                className="w-full text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>

          <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-center gap-3">
            <ShieldCheck className="w-4 h-4 text-slate-400" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Secure Billing via Stripe</p>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
