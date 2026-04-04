"use client";

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { 
  TrendingUp, 
  Activity, 
  ArrowRight,
  Database,
  LayoutGrid,
  Cpu
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
      description: 'Autonomous reasoning and execution protocols.',
      status: activeProtocol ? 'active' : 'idle',
      actions: [
        { label: 'Global Audit', variant: 'primary', onClick: () => triggerProtocol('Global Audit'), loading: activeProtocol === 'Global Audit' },
        { label: 'Ingest Signals', onClick: () => triggerProtocol('Sync'), loading: activeProtocol === 'Sync' },
      ],
      details: (
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase text-primary">Pending Tasks</p>
          <div className="p-3 rounded-xl bg-black/20 border border-white/5 flex items-center justify-between">
            <span className="text-xs">No urgent actions in queue.</span>
            <Activity className="w-3 h-3 text-success opacity-50" />
          </div>
        </div>
      )
    },
    {
      id: 'system-status',
      title: 'Logic Core',
      description: 'Real-time health of neural infrastructure.',
      status: 'active',
      metrics: [
        { label: 'Latency', value: '14ms', hint: 'Ultra-fast sync' },
        { label: 'Integrations', value: '3 Active', hint: 'Gmail, DB, Search' },
      ],
      actions: [
        { label: 'Run Diagnostics', variant: 'secondary', onClick: () => triggerProtocol('Diagnostics') }
      ]
    },
    {
      id: 'optimization-brief',
      title: 'Optimization Hub',
      description: 'Pattern recognition results from last 24h.',
      status: 'active',
      value: `$${totalReclaimed.toFixed(0)}`,
      subvalue: '/mo reclaimed',
      actions: [
        { label: 'View Insights', href: '/money-saver', variant: 'primary' }
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
      
      <main className="max-w-7xl mx-auto px-8 space-y-20">
        {/* Hero Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Neural Link Active</span>
              </div>
            </div>
            <h1 className="text-7xl md:text-9xl font-bold font-headline tracking-tighter leading-[0.8] text-white">
              Control.
            </h1>
            <p className="text-xl text-muted-foreground font-medium max-w-lg leading-relaxed">
              Your autonomous operational environment. Monitor signals and trigger intelligence protocols.
            </p>
          </div>

          <div className="premium-card bg-primary text-background min-w-[320px] p-10 flex flex-col items-center justify-center text-center shadow-[0_32px_80px_-16px_rgba(148,148,247,0.4)]">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-2">Neural Efficiency</p>
            <h2 className="text-8xl font-bold font-headline tracking-tighter">94%</h2>
            <div className="mt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-60">
              <Activity className="w-4 h-4" />
              Real-time Analysis
            </div>
          </div>
        </header>

        {/* Systems Panel */}
        <SystemsPanel systems={dashboardModules} valueStrip={valueStrip} />

        {/* Operational Log */}
        <section className="premium-card min-h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <LayoutGrid className="w-4 h-4 text-primary" />
              <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Operational History</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              <span className="text-[8px] font-bold uppercase text-success tracking-widest">In Sync</span>
            </div>
          </div>
          
          <div className="flex-1 space-y-6 overflow-y-auto pr-4 scrollbar-hide">
            {isLoading ? (
              <Skeleton className="h-40 w-full bg-white/5 rounded-3xl" />
            ) : (analyses || []).length > 0 ? (
              (analyses || []).map((a) => (
                <div key={a.id} className="flex gap-6 border-l border-white/5 pl-6 py-2 group hover:border-primary transition-colors">
                  <span className="text-primary/40 shrink-0 font-mono text-[10px]">[{new Date(a.createdAt?.toDate?.() || Date.now()).toLocaleTimeString()}]</span>
                  <div className="space-y-1">
                    <p className="text-white font-bold text-sm">EVENT: {a.title}</p>
                    <p className="text-muted-foreground/60 leading-relaxed text-[11px] max-w-2xl">{a.summary.slice(0, 120)}...</p>
                    <Link href={`/results/${a.id}`} className="inline-flex items-center gap-1.5 text-primary text-[10px] font-bold uppercase tracking-widest mt-2 hover:gap-3 transition-all">
                      Inspect Record <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-20 space-y-4">
                <Database className="w-12 h-12" />
                <p className="text-[10px] uppercase font-bold tracking-widest">Waiting for signal ingestion...</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
