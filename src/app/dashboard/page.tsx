"use client";

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { 
  TrendingUp, 
  Activity, 
  ArrowRight,
  Database,
  LayoutGrid,
  Cpu,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { motion } from 'framer-motion';
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
      title: "Protocol Active",
      description: `Initializing ${name} sequence...`,
    });
    await new Promise(r => setTimeout(r, 2000));
    setActiveProtocol(null);
  };

  const dashboardModules: SystemModule[] = [
    {
      id: 'action-hub',
      title: 'Action Engine',
      description: 'Autonomous reasoning and multi-step execution protocols.',
      status: activeProtocol ? 'syncing' : 'active',
      actions: [
        { label: 'Global Audit', variant: 'primary', onClick: () => triggerProtocol('Global Audit'), loading: activeProtocol === 'Global Audit' },
        { label: 'Ingest Signals', variant: 'secondary', onClick: () => triggerProtocol('Sync'), loading: activeProtocol === 'Sync' },
      ],
      details: (
        <div className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Intelligence Queue</p>
          <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between group cursor-default">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_rgba(57,217,138,0.5)]" />
              <span className="text-[11px] font-bold text-white/80">All core protocols nominal.</span>
            </div>
            <Activity className="w-3.5 h-3.5 text-success opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      )
    },
    {
      id: 'system-status',
      title: 'Logic Core',
      description: 'Real-time health and latency of neural infrastructure.',
      status: 'active',
      metrics: [
        { label: 'Sync Latency', value: '14ms', hint: 'Quantum fast' },
        { label: 'Active Links', value: '3 Verified', hint: 'Gmail, Firestore, Groq' },
      ],
      actions: [
        { label: 'Run Diagnostics', variant: 'secondary', onClick: () => triggerProtocol('Diagnostics') }
      ]
    },
    {
      id: 'optimization-brief',
      title: 'Optimization Hub',
      description: 'High-frequency pattern recognition results from last 24h.',
      status: 'active',
      value: `$${totalReclaimed.toFixed(0)}`,
      subvalue: '/mo reclaimed',
      actions: [
        { label: 'Inspect Insights', href: '/money-saver', variant: 'primary' }
      ],
      emptyState: analyses?.length === 0 ? "No inefficiences found in current cycle." : undefined
    }
  ];

  const valueStrip: ValueStripItem[] = [
    { label: "Monthly Saved", value: `$${totalReclaimed.toFixed(0)}`, tone: totalReclaimed > 0 ? "positive" : "neutral" },
    { label: "Time Reclaimed", value: "12.4h", tone: "positive" },
    { label: "Agent Actions", value: "42", tone: "neutral" }
  ];

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background pt-32 pb-40">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-8 space-y-24">
        {/* Cinematic Hero */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-16">
          <div className="space-y-10">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/10">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(148,148,247,0.5)]" />
                <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Neural Link Established</span>
              </div>
            </motion.div>
            
            <div className="space-y-4">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-8xl md:text-[10rem] font-bold font-headline tracking-tighter leading-[0.75] text-white text-gradient"
              >
                Operate.
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl text-muted-foreground/60 font-medium max-w-xl leading-relaxed"
              >
                Your autonomous environment for high-frequency financial and time-optimization protocols.
              </motion.p>
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="premium-card bg-primary text-background min-w-[360px] p-12 flex flex-col items-center justify-center text-center shadow-[0_40px_100px_-12px_rgba(148,148,247,0.4)] border-primary/20"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] opacity-60 mb-4">Neural Efficiency</p>
            <h2 className="text-9xl font-bold font-headline tracking-tighter leading-none">94%</h2>
            <div className="mt-8 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] opacity-60">
              <div className="w-2 h-2 rounded-full bg-background animate-pulse" />
              Real-time Ingestion
            </div>
          </motion.div>
        </header>

        {/* Systems Panel */}
        <SystemsPanel systems={dashboardModules} valueStrip={valueStrip} />

        {/* Operational Log */}
        <section className="premium-card min-h-[500px] flex flex-col">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-primary">
                <LayoutGrid className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-headline text-white tracking-tight">Operational History</h3>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">Neural log of all recent system activity</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="status-dot bg-success shadow-[0_0_8px_rgba(57,217,138,0.5)]" />
              <span className="text-[10px] font-bold uppercase text-success tracking-widest">Sync Active</span>
            </div>
          </div>
          
          <div className="flex-1 space-y-8 overflow-y-auto pr-4 scrollbar-hide">
            {isLoading ? (
              <Skeleton className="h-40 w-full bg-white/5 rounded-[2rem]" />
            ) : (analyses || []).length > 0 ? (
              (analyses || []).map((a, idx) => (
                <motion.div 
                  key={a.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex gap-8 group"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary/20 border border-primary/20 group-hover:bg-primary transition-colors" />
                    <div className="w-px flex-1 bg-white/[0.05] mt-2" />
                  </div>
                  <div className="flex-1 pb-8 space-y-3">
                    <div className="flex items-center gap-4">
                      <span className="text-primary/40 font-mono text-[11px] uppercase tracking-widest">[{new Date(a.createdAt?.toDate?.() || Date.now()).toLocaleTimeString()}]</span>
                      <span className="h-px flex-1 bg-white/[0.03]" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-white font-bold text-lg tracking-tight group-hover:text-primary transition-colors uppercase">PROT: {a.title}</p>
                      <p className="text-muted-foreground/60 leading-relaxed text-sm max-w-3xl font-medium">{a.summary.slice(0, 160)}...</p>
                      <Link href={`/results/${a.id}`} className="inline-flex items-center gap-2 text-primary text-[10px] font-bold uppercase tracking-[0.2em] mt-4 hover:gap-4 transition-all opacity-60 hover:opacity-100">
                        Analyze Trace <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-20 space-y-6">
                <Database className="w-16 h-16" />
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-[0.3em]">Neural Ledger Empty</p>
                  <p className="text-[10px] uppercase font-bold tracking-[0.2em]">Waiting for signal ingestion protocol...</p>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}