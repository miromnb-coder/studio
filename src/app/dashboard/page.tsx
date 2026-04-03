
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  ChevronRight,
  Zap,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Loader2,
  CalendarDays,
  Sparkles,
  Terminal,
  Activity
} from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { ProactiveAlerts } from '@/components/dashboard/ProactiveAlerts';
import { DigestService, DailyDigest } from '@/services/digest-service';

/**
 * Robust date formatting for log entries.
 */
const formatLogTime = (timestamp: any) => {
  if (!timestamp) return '--:--:--';
  if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toLocaleTimeString([], { hour12: false });
  }
  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return '--:--:--';
    return d.toLocaleTimeString([], { hour12: false });
  } catch (e) {
    return '--:--:--';
  }
};

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [latestDigest, setLatestDigest] = useState<DailyDigest | null>(null);
  const { user } = useUser();
  const db = useFirestore();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && user && db) {
      DigestService.getLatestDigest(db, user.uid).then(setLatestDigest);
    }
  }, [mounted, user, db]);

  const analysesQuery = useMemoFirebase(() => {
    try {
      if (!db || !user) return null;
      return query(
        collection(db, 'users', user.uid, 'analyses'),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
    } catch (e) {
      return null;
    }
  }, [db, user]);

  const { data: analyses, isLoading: isAnalysesLoading } = useCollection(analysesQuery);
  
  const totalSavings = (Array.isArray(analyses) ? analyses : []).reduce((acc, a) => acc + (a.estimatedMonthlySavings || 0), 0) || 0;
  const isLoading = isAnalysesLoading || !mounted;

  return (
    <div className="min-h-screen bg-background pt-24 pb-32">
      <Navbar />
      
      <main className="max-w-6xl mx-auto px-6 space-y-16">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-12 pt-8">
          <div className="space-y-6">
            <h1 className="text-6xl md:text-8xl font-bold font-headline tracking-tighter leading-[0.9] text-white">Command Center.</h1>
            <p className="text-xl text-muted-foreground font-medium max-w-md">Live operational oversight and passive system analysis.</p>
          </div>
          
          <div className="premium-card !p-10 text-center min-w-[280px] bg-white/[0.02] border-primary/20">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Efficiency Gain</p>
            {isLoading ? (
              <Skeleton className="h-12 w-24 mx-auto bg-white/5" />
            ) : (
              <h2 className="text-7xl font-bold font-headline text-success tracking-tighter">
                ${totalSavings.toFixed(0)}
              </h2>
            )}
          </div>
        </header>

        {/* System Logs & AI Status */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 premium-card bg-white/[0.01] border-white/5 overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
                <Terminal className="w-3 h-3 text-primary" />
                Live System Logs
              </h3>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                <span className="text-[8px] font-bold uppercase text-success tracking-widest">Processing</span>
              </div>
            </div>
            
            <div className="space-y-3 font-mono text-[11px] text-muted-foreground/60 max-h-[160px] overflow-y-auto pr-4 scrollbar-hide">
              {isLoading ? (
                <Skeleton className="h-20 w-full bg-white/5" />
              ) : Array.isArray(analyses) && analyses.length > 0 ? (
                analyses.map((a, i) => (
                  <div key={a.id} className="flex gap-4 border-l border-white/5 pl-4 py-1">
                    <span className="text-primary/40">[{formatLogTime(a.createdAt)}]</span>
                    <span>INGEST_SUCCESS: {a.title} processed via {a.source}</span>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center">Waiting for system ingestion...</div>
              )}
              <div className="flex gap-4 border-l border-white/5 pl-4 py-1 animate-pulse">
                <span className="text-primary/40">[{formatLogTime(new Date())}]</span>
                <span>IDLE: Monitoring neural pathways...</span>
              </div>
            </div>
          </div>

          <div className="premium-card bg-primary/5 border-primary/10 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-primary">
                <Activity className="w-4 h-4" />
                <h4 className="text-[10px] font-bold uppercase tracking-widest">AI Status</h4>
              </div>
              <p className="text-2xl font-bold text-white font-headline">Operational</p>
            </div>
            <div className="pt-4 space-y-2">
               <div className="flex justify-between text-[8px] font-bold uppercase tracking-widest text-muted-foreground">
                 <span>Logic Load</span>
                 <span>14%</span>
               </div>
               <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                 <motion.div initial={{width: 0}} animate={{width: '14%'}} className="h-full bg-primary" />
               </div>
            </div>
          </div>
        </section>

        {/* Daily Briefing Highlight */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-3">
            {latestDigest ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Link href={`/?c=digest-${latestDigest.id}`} className="premium-card bg-primary/5 border-primary/20 flex flex-col md:flex-row items-center gap-8 group">
                  <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shrink-0">
                    <CalendarDays className="w-8 h-8" />
                  </div>
                  <div className="flex-1 space-y-2 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Intelligence Briefing Active</p>
                    </div>
                    <h3 className="text-2xl font-bold text-white tracking-tight">{latestDigest.summary}</h3>
                    <p className="text-sm text-muted-foreground font-medium">Synthesized from your latest financial audits and email patterns.</p>
                  </div>
                  <Button variant="outline" className="rounded-xl border-primary/20 hover:bg-primary/10 text-primary font-bold uppercase tracking-widest text-[10px]">
                    Open Briefing
                  </Button>
                </Link>
              </motion.div>
            ) : (
              <div className="premium-card border-dashed border-white/5 flex items-center justify-center py-12 gap-4 text-muted-foreground/50">
                <CalendarDays className="w-6 h-6" />
                <p className="text-sm font-bold uppercase tracking-widest">No Active Daily Briefing</p>
              </div>
            )}
          </div>
          <div className="premium-card bg-white/[0.02] flex flex-col items-center justify-center text-center space-y-2">
             <div className="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center mb-2">
                <TrendingUp className="w-5 h-5" />
             </div>
             <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Monthly Momentum</p>
             <h4 className="text-3xl font-bold text-white">Stable</h4>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <section className="md:col-span-2 space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
                <Clock className="w-3 h-3" />
                Recent Neural Patterns
              </h3>
              <Link href="/history" className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">
                View Ledger
              </Link>
            </div>
            
            <div className="space-y-4">
              {isLoading ? (
                [...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full bg-white/5 rounded-2xl" />)
              ) : Array.isArray(analyses) && analyses.length > 0 ? (
                analyses.filter(a => a && a.id).slice(0, 5).map((analysis, i) => (
                  <motion.div key={analysis.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <Link href={`/results/${analysis.id}`} className="premium-card flex items-center justify-between group hover:bg-white/[0.04]">
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                          <Zap className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xl font-bold font-headline tracking-tight text-white">{analysis.title || 'Audit Report'}</p>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                            {analysis.analysisDate ? new Date(analysis.analysisDate).toLocaleDateString() : 'Recent'} • {analysis.source?.replace('_', ' ') || 'Manual'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-success tracking-tight">+${analysis.estimatedMonthlySavings?.toFixed(0) || 0}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-white transition-all" />
                      </div>
                    </Link>
                  </motion.div>
                ))
              ) : (
                <div className="premium-card py-16 text-center space-y-4 border-dashed border-white/10">
                  <ShieldCheck className="w-10 h-10 text-white/10 mx-auto" />
                  <p className="text-muted-foreground font-medium">No system patterns identified yet.</p>
                  <Button asChild variant="outline" className="h-10 rounded-xl font-bold uppercase tracking-widest text-[10px] border-white/10">
                    <Link href="/" className="text-white">Enter Chat</Link>
                  </Button>
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-8">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="w-3 h-3" />
              Proactive Alerts
            </h3>
            
            <ProactiveAlerts analyses={Array.isArray(analyses) ? analyses : []} isLoading={isLoading} />
          </aside>
        </div>
      </main>
    </div>
  );
}
