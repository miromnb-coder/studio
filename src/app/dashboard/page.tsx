"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Zap, 
  Clock, 
  Terminal, 
  Activity, 
  Play, 
  Search, 
  Cpu, 
  ShieldCheck, 
  RefreshCcw,
  AlertCircle,
  ArrowRight,
  Database
} from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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
    setTimeout(() => setActiveProtocol(null), 2000);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background pt-32 pb-40">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-8 space-y-16">
        {/* Hero Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Badge className="bg-primary/20 text-primary border-0 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest">
                Action Engine v4.2
              </Badge>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Nominal</span>
              </div>
            </div>
            <h1 className="text-7xl md:text-9xl font-bold font-headline tracking-tighter leading-[0.8] text-white">
              Command.
            </h1>
            <p className="text-xl text-muted-foreground font-medium max-w-lg leading-relaxed">
              Autonomous operational control center for your financial and personal infrastructure.
            </p>
          </div>

          <div className="premium-card bg-primary text-background min-w-[320px] p-10 flex flex-col items-center justify-center text-center shadow-[0_32px_80px_-16px_rgba(148,148,247,0.4)]">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-2">Total Monthly Reclaim</p>
            <h2 className="text-8xl font-bold font-headline tracking-tighter">${totalReclaimed.toFixed(0)}</h2>
            <div className="mt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-60">
              <Activity className="w-4 h-4" />
              Live Optimization
            </div>
          </div>
        </header>

        {/* Modules Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Action Hub */}
          <div className="lg:col-span-2 premium-card space-y-10">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Play className="w-4 h-4 text-primary" />
                  Execution Hub
                </h3>
                <p className="text-xs text-muted-foreground">Manual triggers for autonomous protocols.</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                <span className="w-1.5 h-1.5 rounded-full bg-success" />
                <span className="text-[8px] font-bold uppercase text-success tracking-widest">Ready</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <Button 
                onClick={() => triggerProtocol('Full Audit')} 
                disabled={!!activeProtocol}
                className="h-32 rounded-[2rem] bg-white/[0.03] border border-white/[0.05] hover:bg-primary hover:text-background transition-all flex flex-col items-center justify-center gap-4 group"
              >
                <Search className="w-8 h-8 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Run Global Audit</span>
              </Button>
              <Button 
                onClick={() => triggerProtocol('Strategize')} 
                disabled={!!activeProtocol}
                className="h-32 rounded-[2rem] bg-white/[0.03] border border-white/[0.05] hover:bg-accent hover:text-background transition-all flex flex-col items-center justify-center gap-4 group"
              >
                <TrendingUp className="w-8 h-8 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Strategize</span>
              </Button>
              <Button 
                onClick={() => triggerProtocol('Sync')} 
                disabled={!!activeProtocol}
                className="h-32 rounded-[2rem] bg-white/[0.03] border border-white/[0.05] hover:bg-success hover:text-background transition-all flex flex-col items-center justify-center gap-4 group"
              >
                <RefreshCcw className="w-8 h-8 group-hover:rotate-180 transition-transform duration-700" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Ingest Signals</span>
              </Button>
            </div>
          </div>

          {/* System Status */}
          <div className="premium-card flex flex-col justify-between">
            <div className="space-y-8">
              <div className="flex items-center gap-3 text-primary">
                <Cpu className="w-5 h-5" />
                <h4 className="text-[10px] font-bold uppercase tracking-widest">Engine Status</h4>
              </div>
              <div className="space-y-5">
                {[
                  { label: 'Neural Memory', status: 'In Sync', color: 'text-success' },
                  { label: 'Pattern Detection', status: 'Active', color: 'text-success' },
                  { label: 'Arbitrage Engine', status: 'Idle', color: 'text-muted-foreground' },
                  { label: 'Safety Sandbox', status: 'Locked', color: 'text-primary' },
                ].map((s) => (
                  <div key={s.label} className="flex justify-between items-center border-b border-white/5 pb-3">
                    <span className="text-xs text-muted-foreground">{s.label}</span>
                    <span className={cn("text-[10px] font-bold uppercase tracking-widest", s.color)}>{s.status}</span>
                  </div>
                ))}
              </div>
            </div>
            <Button variant="outline" className="w-full mt-10 rounded-2xl border-white/5 text-[10px] font-bold uppercase tracking-widest h-14 hover:bg-white/5">
              Run Diagnostics
            </Button>
          </div>
        </section>

        {/* Intelligence Log */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 premium-card min-h-[400px] flex flex-col">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <Terminal className="w-4 h-4 text-primary" />
                <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Operational Log</h3>
              </div>
              <Badge variant="outline" className="border-white/10 text-[8px] opacity-40">Live Feed</Badge>
            </div>
            
            <div className="flex-1 space-y-6 overflow-y-auto pr-4 scrollbar-hide font-mono text-xs">
              {isLoading ? (
                <Skeleton className="h-40 w-full bg-white/5 rounded-2xl" />
              ) : (analyses || []).length > 0 ? (
                (analyses || []).map((a) => (
                  <div key={a.id} className="flex gap-6 border-l border-white/5 pl-6 py-2 group hover:border-primary transition-colors">
                    <span className="text-primary/40 shrink-0">[{new Date(a.createdAt?.toDate?.() || Date.now()).toLocaleTimeString()}]</span>
                    <div className="space-y-1">
                      <p className="text-white font-bold">DETECTION: {a.title}</p>
                      <p className="text-muted-foreground/60 leading-relaxed text-[11px]">{a.summary.slice(0, 100)}...</p>
                      <Link href={`/results/${a.id}`} className="inline-flex items-center gap-1.5 text-primary text-[10px] font-bold uppercase tracking-widest mt-2 hover:gap-3 transition-all">
                        Inspect <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-20 space-y-4">
                  <Database className="w-12 h-12" />
                  <p className="text-[10px] uppercase font-bold tracking-widest">Waiting for signal ingestion</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-8">
            <div className="premium-card bg-success/5 border-success/10 p-10 flex flex-col items-center justify-center text-center gap-6">
               <ShieldCheck className="w-10 h-10 text-success" />
               <div>
                 <h4 className="text-2xl font-bold text-white mb-2">Safe Core</h4>
                 <p className="text-xs text-muted-foreground leading-relaxed">Intelligence operating within localized neural sandbox.</p>
               </div>
               <Button variant="link" asChild className="text-success text-[10px] uppercase font-bold tracking-widest">
                 <Link href="/settings">Security Protocols</Link>
               </Button>
            </div>
            <div className="premium-card bg-white/[0.01] border-white/5 p-10 flex flex-col items-center justify-center text-center gap-6 group cursor-pointer hover:bg-primary/5 transition-all">
               <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                 <Activity className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
               </div>
               <div>
                 <h4 className="text-lg font-bold text-white mb-1">Audit Stream</h4>
                 <p className="text-xs text-muted-foreground">Inspect all autonomous decisions and reasoning steps.</p>
               </div>
               <Link href="/history" className="text-primary text-[10px] uppercase font-bold tracking-widest">View History</Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}