
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  ChevronRight,
  Zap,
  Clock,
  AlertTriangle,
  Loader2,
  Terminal,
  Activity,
  Play,
  Search,
  Cpu,
  ShieldCheck,
  RefreshCcw
} from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { addDocumentNonBlocking } from '@/firebase';

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [isRunningGlobal, setIsRunningGlobal] = useState(false);
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
      limit(5)
    );
  }, [db, user]);

  const { data: analyses, isLoading } = useCollection(analysesQuery);
  
  const totalSavings = (analyses || []).reduce((acc, a) => acc + (a.estimatedMonthlySavings || 0), 0);

  const runProtocol = async (protocol: string) => {
    if (!user) return;
    setIsRunningGlobal(true);
    toast({
      title: "Protocol Initialized",
      description: `Agent v4.2 executing ${protocol} sequence...`,
    });
    
    // Simulate internal agent loop for UI feedback
    setTimeout(() => {
      setIsRunningGlobal(false);
      toast({
        title: "Sequence Complete",
        description: "Metadata ingested and synchronized.",
      });
    }, 2500);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background pt-24 pb-32">
      <Navbar />
      
      <main className="max-w-6xl mx-auto px-6 space-y-12">
        {/* ACTION ENGINE HEADER */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Cpu className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-[0.4em]">Action Engine v4.2</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-bold font-headline tracking-tighter leading-[0.9] text-white">Command.</h1>
            <p className="text-xl text-muted-foreground font-medium max-w-md">Real-time operational control and execution hub.</p>
          </div>
          
          <div className="premium-card !p-8 min-w-[320px] bg-primary/5 border-primary/20 flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
               <TrendingUp className="w-24 h-24" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Total Reclaimed Liquidity</p>
            <h2 className="text-7xl font-bold font-headline text-white tracking-tighter">
              ${totalSavings.toFixed(0)}
            </h2>
            <div className="mt-4 flex items-center gap-2 text-[8px] font-bold uppercase text-success tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              Live Optimization Active
            </div>
          </div>
        </header>

        {/* PRIMARY CONTROL GRID */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 premium-card bg-white/[0.01] border-white/5 space-y-8">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Play className="w-4 h-4 text-primary" />
                  Quick Protocols
                </h3>
                <p className="text-xs text-muted-foreground">Direct neural triggers for specific analysis loops.</p>
              </div>
              <Badge variant="outline" className="border-white/10 text-[8px] uppercase">Ready</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Button 
                onClick={() => runProtocol('Audit')} 
                disabled={isRunningGlobal}
                className="h-24 rounded-2xl bg-white/5 border border-white/5 hover:bg-primary hover:text-background transition-all flex flex-col items-center justify-center gap-2 group"
              >
                <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Run Audit</span>
              </Button>
              <Button 
                onClick={() => runProtocol('Strategize')} 
                disabled={isRunningGlobal}
                className="h-24 rounded-2xl bg-white/5 border border-white/5 hover:bg-accent hover:text-background transition-all flex flex-col items-center justify-center gap-2 group"
              >
                <TrendingUp className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Strategize</span>
              </Button>
              <Button 
                onClick={() => runProtocol('Refactor')} 
                disabled={isRunningGlobal}
                className="h-24 rounded-2xl bg-white/5 border border-white/5 hover:bg-success hover:text-background transition-all flex flex-col items-center justify-center gap-2 group"
              >
                <RefreshCcw className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Refactor</span>
              </Button>
            </div>
          </div>

          <div className="premium-card bg-white/[0.01] border-white/5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <Activity className="w-4 h-4" />
                <h4 className="text-[10px] font-bold uppercase tracking-widest">System Health</h4>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-xs text-muted-foreground">Neural Load</span>
                  <span className="text-xs font-bold text-white">12%</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-xs text-muted-foreground">Inbound Signals</span>
                  <span className="text-xs font-bold text-success">Nominal</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Latency</span>
                  <span className="text-xs font-bold text-white">42ms</span>
                </div>
              </div>
            </div>
            <Button variant="outline" className="w-full mt-6 rounded-xl border-white/10 text-[9px] font-bold uppercase tracking-widest h-10">
              Run Diagnostic
            </Button>
          </div>
        </section>

        {/* LOGS & PATTERNS */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 premium-card bg-[#1a1a1e] border-white/5 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
                <Terminal className="w-3 h-3 text-primary" />
                Operational Log
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-bold uppercase text-muted-foreground/40 tracking-widest">Live Stream</span>
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              </div>
            </div>
            
            <div className="flex-1 font-mono text-[11px] text-muted-foreground/60 space-y-2 max-h-[250px] overflow-y-auto scrollbar-hide pr-4">
              {isLoading ? (
                <Skeleton className="h-20 w-full bg-white/5" />
              ) : (analyses || []).map((a, i) => (
                <div key={a.id} className="flex gap-4 border-l border-white/5 pl-4 py-1 group hover:border-primary transition-colors">
                  <span className="text-primary/40 shrink-0">[{new Date(a.createdAt?.toDate?.() || Date.now()).toLocaleTimeString()}]</span>
                  <span className="truncate">SUCCESS: {a.title} processed via {a.source} (saved ${a.estimatedMonthlySavings})</span>
                </div>
              ))}
              <div className="flex gap-4 border-l border-white/5 pl-4 py-1 animate-pulse">
                <span className="text-primary/40">[{new Date().toLocaleTimeString()}]</span>
                <span>IDLE: Waiting for signal ingestion...</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="premium-card bg-white/[0.01] border-white/5 p-6 flex flex-col justify-center text-center gap-2">
               <AlertTriangle className="w-5 h-5 text-warning mx-auto mb-2" />
               <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Action Required</p>
               <h4 className="text-xl font-bold text-white">2 Pending Patterns</h4>
               <Button asChild variant="link" className="text-primary text-[10px] uppercase font-bold p-0 h-auto mt-2">
                 <Link href="/money-saver">View Optimization Engine</Link>
               </Button>
            </div>
            <div className="premium-card bg-white/[0.01] border-white/5 p-6 flex flex-col justify-center text-center gap-2">
               <ShieldCheck className="w-5 h-5 text-success mx-auto mb-2" />
               <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Memory Status</p>
               <h4 className="text-xl font-bold text-white">Synced</h4>
               <Button asChild variant="link" className="text-muted-foreground text-[10px] uppercase font-bold p-0 h-auto mt-2">
                 <Link href="/history">Manage Context</Link>
               </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
