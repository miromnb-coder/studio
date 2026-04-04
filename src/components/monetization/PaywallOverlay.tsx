
"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { Zap, ShieldCheck, Star, ArrowRight, Lock, CheckCircle2, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface PaywallOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: 'limit_reached' | 'premium_tool';
}

export function PaywallOverlay({ isOpen, onClose, reason = 'limit_reached' }: PaywallOverlayProps) {
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
        <GlassCard className="!p-0 border-white/80 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)]">
          <div className="relative h-56 bg-slate-900 overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/20 to-primary/20 animate-shimmer opacity-50" />
            
            {/* Visual Value Indicators */}
            <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10">
              <TrendingUp className="w-3 h-3 text-success" />
              <span className="text-[8px] font-bold text-white uppercase tracking-widest">Avg. Reclaim: $420/yr</span>
            </div>

            <Star className="w-24 h-24 text-primary opacity-20 absolute -right-4 -top-4 rotate-12" />
            
            <div className="relative text-center space-y-4">
              <div className="w-20 h-20 rounded-[2.5rem] bg-primary/20 backdrop-blur-3xl mx-auto flex items-center justify-center text-primary border border-white/20 shadow-2xl">
                <Zap className="w-10 h-10 fill-primary" />
              </div>
              <div className="space-y-1">
                <h2 className="text-4xl font-bold text-white tracking-tighter">Operator Ultra</h2>
                <p className="text-[10px] font-bold text-primary uppercase tracking-[0.4em]">High Clearance Logic Core</p>
              </div>
            </div>
          </div>

          <div className="p-12 space-y-12">
            <div className="space-y-4 text-center">
              <p className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                {reason === 'limit_reached' 
                  ? "Daily intelligence quota finalized."
                  : "This protocol requires Ultra Clearance."}
              </p>
              <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-sm mx-auto">
                Unlock the full cognitive capability of the Operator system to automate your financial forensics.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { title: "Unlimited Reasoning", desc: "No daily quotas on logic cycles." },
                { title: "Leak Detector Pro", desc: "Scan 100% of signals for waste." },
                { title: "Dynamic Forging", desc: "Create custom autonomous tools." },
                { title: "Deep Neural Memory", desc: "Infinite context retention." },
                { title: "Priority Execution", desc: "0.04ms logic latency." },
                { title: "Secure Vault", desc: "Military-grade data encryption." }
              ].map((feature, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center text-success shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-900 uppercase tracking-tight">{feature.title}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-6">
              <Link href="/upgrade">
                <GlassButton 
                  className="w-full !h-16 !text-lg !rounded-[2rem] shadow-2xl shadow-primary/20 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  Upgrade to Ultra • €19/mo
                  <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </GlassButton>
              </Link>
              
              <div className="flex items-center justify-center gap-8">
                <button 
                  onClick={onClose}
                  className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Return to Dashboard
                </button>
                <div className="w-px h-4 bg-slate-100" />
                <Link href="/upgrade#plans" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">
                  View All Plans
                </Link>
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-center gap-3">
            <ShieldCheck className="w-4 h-4 text-slate-400" />
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Encrypted Billing via Stripe Protocol</p>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
