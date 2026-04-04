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
  ShieldCheck
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
      description: 'Autonomous reasoning loop for immediate execution.',
      status: activeProtocol ? 'syncing' : 'active',
      actions: [
        { label: 'Global Audit', variant: 'primary', onClick: () => triggerProtocol('Global Audit'), loading: activeProtocol === 'Global Audit' },
        { label: 'Neural Sync', variant: 'secondary', onClick: () => triggerProtocol('Sync'), loading: activeProtocol === 'Sync' },
      ],
      details: (
        <div className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Operational Log</p>
          <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs font-semibold text-slate-700">All modules synchronized.</span>
            </div>
            <Activity className="w-4 h-4 text-slate-300" />
          </div>
        </div>
      )
    },
    {
      id: 'system-status',
      title: 'Logic Core',
      description: 'Neural latency and infrastructure health tracking.',
      status: 'active',
      metrics: [
        { label: 'Neural Latency', value: '0.04ms', hint: 'Stable' },
        { label: 'Neural Links', value: '4 Active', hint: 'Encrypted' },
      ],
      actions: [
        { label: 'Diagnostics', variant: 'secondary', onClick: () => triggerProtocol('Diagnostics') }
      ]
    },
    {
      id: 'optimization-brief',
      title: 'Optimization Hub',
      description: 'Deep pattern recognition results and cost mitigation.',
      status: 'active',
      value: `$${totalReclaimed.toFixed(0)}`,
      subvalue: 'Reclaimed Monthly',
      actions: [
        { label: 'View Insights', href: '/money-saver', variant: 'primary' }
      ],
      emptyState: analyses?.length === 0 ? "No active anomalies detected." : undefined
    }
  ];

  const valueStrip: ValueStripItem[] = [
    { label: "Capital Reclaimed", value: `$${totalReclaimed.toFixed(0)}`, tone: totalReclaimed > 0 ? "positive" : "neutral" },
    { label: "Efficiency Gain", value: "14.2h", tone: "positive" },
    { label: "Directives Met", value: "84", tone: "neutral" }
  ];

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background pt-24 pb-32">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-8 space-y-16">
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 border-b border-slate-200/60 pb-12">
          <div className="space-y-6">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/10 rounded-full w-fit">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider">Tactical Integrity Stable</span>
            </div>
            
            <div className="space-y-3">
              <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-slate-900 leading-tight">
                Control.
              </h1>
              <p className="text-base text-slate-500 font-medium max-w-lg leading-relaxed">
                Strategic operations dashboard. Manage autonomous reasoning, neural memory, and optimization protocols from one central hub.
              </p>
            </div>
          </div>

          <div className="glass-card bg-white/80 p-10 min-w-[320px] rounded-3xl">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Neural Health</p>
            <h2 className="text-7xl font-bold tracking-tighter text-slate-900 leading-none">98%</h2>
            <div className="mt-6 inline-flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-wider bg-success/5 px-4 py-2 rounded-full text-success border border-success/10">
              <Activity className="w-3.5 h-3.5" />
              Real-Time Compute
            </div>
          </div>
        </header>

        <SystemsPanel systems={dashboardModules} valueStrip={valueStrip} />

        <section className="glass-card p-10 rounded-[2.5rem]">
          <div className="flex items-center justify-between mb-12 border-b border-slate-100 pb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <Terminal className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Activity Log</h3>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">Intelligence Cycle History</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-8">
            {isLoading ? (
              <Skeleton className="h-32 w-full rounded-2xl" />
            ) : (analyses || []).length > 0 ? (
              (analyses || []).map((a, idx) => (
                <motion.div 
                  key={a.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex gap-8 group"
                >
                  <div className="flex flex-col items-center pt-1.5">
                    <div className="w-2.5 h-2.5 rounded-full border-2 border-primary/20 group-hover:bg-primary transition-all duration-300" />
                    <div className="w-px flex-1 bg-slate-100 mt-3" />
                  </div>
                  <div className="flex-1 pb-8 space-y-3 border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {new Date(a.createdAt?.toDate?.() || Date.now()).toLocaleTimeString()} // ID_{a.id.slice(0, 6)}
                      </span>
                      <span className="h-px flex-1 bg-slate-50" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-slate-900 font-bold text-lg tracking-tight group-hover:text-primary transition-colors">{a.title}</p>
                      <p className="text-slate-500 leading-relaxed text-sm max-w-3xl font-medium">{a.summary.slice(0, 160)}...</p>
                      <Link href={`/results/${a.id}`} className="inline-flex items-center gap-2 text-primary text-[11px] font-bold uppercase tracking-widest mt-4 hover:gap-3 transition-all">
                        Inspect Telemetry <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="py-24 text-center opacity-40 space-y-4">
                <Database className="w-12 h-12 mx-auto text-slate-300" />
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">No telemetry logged in this cycle</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}