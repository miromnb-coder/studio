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
  ShieldAlert,
  Terminal,
  Target
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
      title: "PROT_ACTIVE",
      description: `INITIATING_${name}_SEQUENCE...`,
    });
    await new Promise(r => setTimeout(r, 2000));
    setActiveProtocol(null);
  };

  const dashboardModules: SystemModule[] = [
    {
      id: 'action-hub',
      title: 'Action_Engine',
      description: 'Autonomous_Reasoning_Execution_Protocols.',
      status: activeProtocol ? 'syncing' : 'active',
      actions: [
        { label: 'Global_Audit', variant: 'primary', onClick: () => triggerProtocol('Global_Audit'), loading: activeProtocol === 'Global_Audit' },
        { label: 'Sync_Link', variant: 'secondary', onClick: () => triggerProtocol('Sync'), loading: activeProtocol === 'Sync' },
      ],
      details: (
        <div className="space-y-2">
          <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Operational_Status</p>
          <div className="p-3 bg-stealth-ebon border border-stealth-slate flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-success animate-pulse" />
              <span className="text-[9px] font-bold text-foreground uppercase">Protocols_Nominal.</span>
            </div>
            <Activity className="w-3 h-3 text-muted-foreground" />
          </div>
        </div>
      )
    },
    {
      id: 'system-status',
      title: 'Logic_Core',
      description: 'Hardware_Interface_Latency_Infrastructure.',
      status: 'active',
      metrics: [
        { label: 'Latency', value: '0.04ms', hint: 'Hardwired' },
        { label: 'Neural_Links', value: '4_Active', hint: 'Encrypted' },
      ],
      actions: [
        { label: 'Diagnostics', variant: 'secondary', onClick: () => triggerProtocol('Diagnostics') }
      ]
    },
    {
      id: 'optimization-brief',
      title: 'Extraction_Hub',
      description: 'Pattern_Recognition_Results_Cycle_Final.',
      status: 'active',
      value: `$${totalReclaimed.toFixed(0)}`,
      subvalue: 'Reclaimed_Mo',
      actions: [
        { label: 'Inspect_Ledger', href: '/money-saver', variant: 'primary' }
      ],
      emptyState: analyses?.length === 0 ? "No_Active_Anomalies." : undefined
    }
  ];

  const valueStrip: ValueStripItem[] = [
    { label: "Capital_Reclaimed", value: `$${totalReclaimed.toFixed(0)}`, tone: totalReclaimed > 0 ? "positive" : "neutral" },
    { label: "Efficiency_Shift", value: "14.2h", tone: "positive" },
    { label: "Agent_Directives", value: "84", tone: "neutral" }
  ];

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-stealth-ebon pt-24 pb-32">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-8 space-y-16">
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 border-b border-stealth-slate pb-12">
          <div className="space-y-6">
            <div className="flex items-center gap-2 px-3 py-1 border border-primary/30 bg-primary/5 w-fit">
              <span className="w-1.5 h-1.5 bg-primary animate-glow-pulse" />
              <span className="text-[9px] font-bold text-primary uppercase tracking-widest">Tactical_Link_Stable</span>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-7xl md:text-9xl font-bold tracking-tighter text-white leading-none uppercase glow-text">
                Console.
              </h1>
              <p className="text-sm text-muted-foreground font-bold uppercase tracking-[0.2em] max-w-lg leading-relaxed">
                Strategic_Operations_Environment // Crimson_Stealth_Protocol
              </p>
            </div>
          </div>

          <div className="bg-stealth-onyx border-l-4 border-primary p-8 min-w-[300px] shadow-[0_0_30px_rgba(225,29,72,0.1)]">
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground mb-2">Neural_Efficiency</p>
            <h2 className="text-7xl font-bold tracking-tighter text-primary glow-text leading-none">98%</h2>
            <div className="mt-4 inline-flex items-center gap-2 text-[8px] font-bold uppercase tracking-[0.2em] bg-primary/10 px-3 py-1 text-primary">
              <Activity className="w-2 h-2 animate-glow-pulse" />
              Real_Time_Compute
            </div>
          </div>
        </header>

        <SystemsPanel systems={dashboardModules} valueStrip={valueStrip} />

        <section className="bg-stealth-onyx border border-stealth-slate p-8 border-l-4 border-l-primary">
          <div className="flex items-center justify-between mb-12 border-b border-stealth-slate pb-6">
            <div className="flex items-center gap-4">
              <Terminal className="w-5 h-5 text-primary" />
              <div>
                <h3 className="text-xl font-bold text-white uppercase tracking-tighter glow-text">Neural_Audit_Log</h3>
                <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Extraction_Cycle_History</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            {isLoading ? (
              <Skeleton className="h-32 w-full bg-stealth-ebon" />
            ) : (analyses || []).length > 0 ? (
              (analyses || []).map((a, idx) => (
                <motion.div 
                  key={a.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex gap-6 group"
                >
                  <div className="flex flex-col items-center pt-1">
                    <div className="w-1.5 h-1.5 bg-primary/30 group-hover:bg-primary transition-colors" />
                    <div className="w-px flex-1 bg-stealth-slate mt-2" />
                  </div>
                  <div className="flex-1 pb-6 space-y-2 border-b border-stealth-slate/50">
                    <div className="flex items-center gap-4">
                      <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">{new Date(a.createdAt?.toDate?.() || Date.now()).toLocaleTimeString()} // SYNC_0{idx}</span>
                      <span className="h-px flex-1 bg-stealth-slate/30" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-white font-bold text-sm tracking-widest group-hover:text-primary transition-all uppercase">{a.title}</p>
                      <p className="text-muted-foreground leading-relaxed text-[10px] max-w-3xl font-bold uppercase tracking-wider">{a.summary.slice(0, 140)}...</p>
                      <Link href={`/results/${a.id}`} className="inline-flex items-center gap-2 text-primary text-[9px] font-bold uppercase tracking-widest mt-2 hover:gap-4 transition-all">
                        Telemetry_Trace <ChevronRight className="w-2.5 h-2.5" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="py-24 text-center opacity-20 space-y-4">
                <Database className="w-10 h-10 mx-auto text-primary" />
                <p className="text-[10px] font-bold uppercase tracking-[0.5em]">No_Protocol_Activity_Logged</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
