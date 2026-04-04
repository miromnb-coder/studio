"use client";

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { 
  TrendingUp, 
  Activity, 
  Database,
  Cpu,
  ChevronRight,
  Terminal,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { SystemsPanel } from '@/components/systems/SystemsPanel';
import type { SystemModule, ValueStripItem } from '@/components/systems/types';
import Link from 'next/link';

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [activeProtocol, setActiveProtocol] = useState<string | null>(null);
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  const analysesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'users', user.uid, 'analyses'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
  }, [db, user]);

  const { data: analyses, isLoading } = useCollection(analysesQuery);
  const totalReclaimed = (analyses || []).reduce((acc, a) => acc + (a.estimatedMonthlySavings || 0), 0);

  const triggerProtocol = async (name: string) => {
    if (!user) return;
    setActiveProtocol(name);
    toast({
      title: "Protocol Initialized",
      description: `Synchronizing ${name} intelligence...`,
    });
    await new Promise(r => setTimeout(r, 2000));
    setActiveProtocol(null);
  };

  const dashboardModules: SystemModule[] = [
    {
      id: 'action-hub',
      title: 'Action Engine',
      description: 'Autonomous reasoning loop for immediate tactical execution.',
      status: activeProtocol ? 'syncing' : 'active',
      actions: [
        { label: 'Global Audit', variant: 'primary', onClick: () => triggerProtocol('Global Audit'), loading: activeProtocol === 'Global Audit' },
        { label: 'Neural Sync', variant: 'secondary', onClick: () => triggerProtocol('Sync'), loading: activeProtocol === 'Sync' },
      ],
      details: (
        <div className="space-y-4">
          <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-slate-400">Live Mission Logs</p>
          <div className="p-5 bg-white/20 rounded-[1.5rem] border border-white/40 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-2.5 h-2.5 rounded-full bg-success shadow-[0_0_10px_rgba(34,197,94,0.4)] animate-pulse" />
              <span className="text-xs font-bold text-slate-700">All logic cores synchronized.</span>
            </div>
            <Activity className="w-4 h-4 text-slate-300" />
          </div>
        </div>
      )
    },
    {
      id: 'system-status',
      title: 'Logic Core',
      description: 'Intelligence latency and infrastructure health tracking.',
      status: 'active',
      metrics: [
        { label: 'Neural Latency', value: '0.04ms', hint: 'Ultra Stable' },
        { label: 'Signal Auth', value: 'Verified', hint: 'Encrypted' },
      ],
      actions: [
        { label: 'Diagnostics', variant: 'secondary', onClick: () => triggerProtocol('Diagnostics') }
      ]
    },
    {
      id: 'optimization-brief',
      title: 'Optimization Hub',
      description: 'Deep pattern recognition results and mitigation vectors.',
      status: 'active',
      value: `$${totalReclaimed.toFixed(0)}`,
      subvalue: 'Reclaimed Monthly',
      actions: [
        { label: 'View Insights', href: '/money-saver', variant: 'primary' }
      ],
      emptyState: analyses?.length === 0 ? "No anomalies detected in current scan." : undefined
    }
  ];

  const valueStrip: ValueStripItem[] = [
    { label: "Tactical Reclaim", value: `$${totalReclaimed.toFixed(0)}`, tone: totalReclaimed > 0 ? "positive" : "neutral" },
    { label: "Intelligence Gain", value: "14.2h", tone: "positive" },
    { label: "Active Directives", value: "84", tone: "neutral" }
  ];

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-transparent pt-32 pb-32">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-12 space-y-20">
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 border-b border-slate-200/40 pb-16">
          <div className="space-y-8">
            <div className="flex items-center gap-3 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full w-fit shadow-sm">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-bold text-primary uppercase tracking-[0.3em]">Operational Readiness High</span>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-7xl md:text-9xl font-bold tracking-tighter text-slate-900 leading-[0.8]">
                Operate.
              </h1>
              <p className="text-lg text-slate-500 font-bold max-w-lg leading-relaxed opacity-60">
                Strategic command interface. Control autonomous reasoning cycles and optimization protocols from a single spatial workspace.
              </p>
            </div>
          </div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="glass-card bg-white/60 p-12 min-w-[360px] rounded-[3rem] border-white/80 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-success/5 rounded-full blur-3xl -mr-20 -mt-20" />
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400 mb-4 flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-success" /> Neural Vitality
            </p>
            <h2 className="text-8xl font-bold tracking-tighter text-slate-900 leading-none">98%</h2>
            <div className="mt-8 inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.25em] bg-success/10 px-5 py-2.5 rounded-full text-success border border-success/20 shadow-sm">
              <Activity className="w-4 h-4" />
              Compute Sync Active
            </div>
          </motion.div>
        </header>

        <SystemsPanel systems={dashboardModules} valueStrip={valueStrip} />

        <section className="glass-card p-12 rounded-[3.5rem] border-white/60 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/0 via-primary/40 to-primary/0" />
          
          <div className="flex items-center justify-between mb-16 border-b border-slate-100/60 pb-10">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                <Terminal className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-3xl font-bold text-slate-900 tracking-tighter">Activity Stream</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em] mt-1">Operational Telemetry History</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-10">
            {isLoading ? (
              <Skeleton className="h-40 w-full rounded-[2rem] bg-white/40" />
            ) : (analyses || []).length > 0 ? (
              (analyses || []).map((a, idx) => (
                <motion.div 
                  key={a.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex gap-10 group"
                >
                  <div className="flex flex-col items-center pt-2">
                    <div className="w-3 h-3 rounded-full border-2 border-primary/30 group-hover:bg-primary group-hover:shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-500" />
                    <div className="w-px flex-1 bg-slate-100/60 mt-4 group-hover:bg-primary/20 transition-colors" />
                  </div>
                  <div className="flex-1 pb-12 space-y-4 border-b border-slate-50/60 last:border-0">
                    <div className="flex items-center gap-6">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] bg-white/40 px-3 py-1 rounded-lg border border-white/60 shadow-sm">
                        {new Date(a.createdAt?.toDate?.() || Date.now()).toLocaleTimeString()} // TELEMETRY_{a.id.slice(0, 6)}
                      </span>
                      <div className="h-px flex-1 bg-slate-50/60" />
                    </div>
                    <div className="space-y-3">
                      <p className="text-slate-900 font-bold text-2xl tracking-tighter group-hover:text-primary transition-colors">{a.title}</p>
                      <p className="text-slate-500 leading-relaxed text-sm max-w-4xl font-bold opacity-60">"{a.summary.slice(0, 180)}..."</p>
                      <div className="pt-4">
                        <Link href={`/results/${a.id}`} className="inline-flex items-center gap-3 text-primary text-[10px] font-bold uppercase tracking-[0.3em] hover:gap-5 transition-all group/link">
                          Inspect Node <ChevronRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="py-32 text-center opacity-30 space-y-6">
                <Database className="w-16 h-16 mx-auto text-slate-300" />
                <p className="text-[11px] font-bold uppercase tracking-[0.5em] text-slate-400">System Log Empty</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
