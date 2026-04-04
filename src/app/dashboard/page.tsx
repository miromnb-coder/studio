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
      description: 'Autonomous reasoning and execution protocols.',
      status: activeProtocol ? 'syncing' : 'active',
      actions: [
        { label: 'Global Audit', variant: 'primary', onClick: () => triggerProtocol('Global Audit'), loading: activeProtocol === 'Global Audit' },
        { label: 'Sync', variant: 'secondary', onClick: () => triggerProtocol('Sync'), loading: activeProtocol === 'Sync' },
      ],
      details: (
        <div className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</p>
          <div className="p-4 rounded-2xl bg-nordic-silk border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span className="text-[11px] font-semibold text-slate-600">All protocols nominal.</span>
            </div>
            <Activity className="w-3.5 h-3.5 text-slate-300" />
          </div>
        </div>
      )
    },
    {
      id: 'system-status',
      title: 'Logic Core',
      description: 'System health and latency infrastructure.',
      status: 'active',
      metrics: [
        { label: 'Latency', value: '14ms', hint: 'Optimized' },
        { label: 'Links', value: '3 Active', hint: 'Verified' },
      ],
      actions: [
        { label: 'Run Diagnostics', variant: 'secondary', onClick: () => triggerProtocol('Diagnostics') }
      ]
    },
    {
      id: 'optimization-brief',
      title: 'Optimization Hub',
      description: 'Pattern recognition results from last cycle.',
      status: 'active',
      value: `$${totalReclaimed.toFixed(0)}`,
      subvalue: '/mo reclaimed',
      actions: [
        { label: 'Inspect', href: '/money-saver', variant: 'primary' }
      ],
      emptyState: analyses?.length === 0 ? "No active findings." : undefined
    }
  ];

  const valueStrip: ValueStripItem[] = [
    { label: "Total Reclaimed", value: `$${totalReclaimed.toFixed(0)}`, tone: totalReclaimed > 0 ? "positive" : "neutral" },
    { label: "Time Reclaimed", value: "12.4h", tone: "positive" },
    { label: "Agent Actions", value: "42", tone: "neutral" }
  ];

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-nordic-silk pt-32 pb-40">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-8 space-y-20">
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
          <div className="space-y-8">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-nordic-moss/30 border border-nordic-moss/40 w-fit"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-nordic-sage animate-pulse" />
              <span className="text-[10px] font-bold text-nordic-sage uppercase tracking-widest">Nordic Link Stable</span>
            </motion.div>
            
            <div className="space-y-4">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-7xl md:text-9xl font-bold tracking-tight text-slate-900 leading-[0.8]"
              >
                Console.
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl text-slate-500 font-medium max-w-lg leading-relaxed"
              >
                High-performance environment for wellness-first financial and time optimization.
              </motion.p>
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-nordic-sage text-white rounded-[2.5rem] p-10 min-w-[320px] shadow-2xl shadow-nordic-sage/20 text-center"
          >
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-2">Efficiency</p>
            <h2 className="text-8xl font-bold tracking-tighter">94%</h2>
            <div className="mt-6 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest bg-white/10 px-4 py-2 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Real-time
            </div>
          </motion.div>
        </header>

        <SystemsPanel systems={dashboardModules} valueStrip={valueStrip} />

        <section className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-sm min-h-[500px]">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-nordic-moss/20 flex items-center justify-center text-nordic-sage">
                <LayoutGrid className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Intelligence Log</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Neural activity ledger</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-8">
            {isLoading ? (
              <Skeleton className="h-40 w-full bg-slate-50 rounded-3xl" />
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
                    <div className="w-2 h-2 rounded-full bg-nordic-sage/20 group-hover:bg-nordic-sage transition-colors" />
                    <div className="w-px flex-1 bg-slate-100 mt-2" />
                  </div>
                  <div className="flex-1 pb-8 space-y-2">
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{new Date(a.createdAt?.toDate?.() || Date.now()).toLocaleTimeString()}</span>
                      <span className="h-px flex-1 bg-slate-50" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-slate-900 font-bold text-lg tracking-tight group-hover:text-nordic-sage transition-colors uppercase">{a.title}</p>
                      <p className="text-slate-500 leading-relaxed text-sm max-w-3xl font-medium">{a.summary.slice(0, 140)}...</p>
                      <Link href={`/results/${a.id}`} className="inline-flex items-center gap-2 text-nordic-sage text-[10px] font-bold uppercase tracking-widest mt-3 hover:gap-4 transition-all">
                        Analysis Trace <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="py-24 text-center opacity-20 space-y-4">
                <Database className="w-12 h-12 mx-auto" />
                <p className="text-xs font-bold uppercase tracking-widest">No protocol activity yet</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}