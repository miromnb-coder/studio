"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  ChevronRight,
  Zap,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Clock,
  Send,
  Loader2,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  const analysesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'users', user.uid, 'analyses'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
  }, [db, user]);

  const { data: analyses, isLoading: isAnalysesLoading } = useCollection(analysesQuery);
  const totalSavings = analyses?.reduce((acc, a) => acc + (a.estimatedMonthlySavings || 0), 0) || 0;
  const isLoading = isUserLoading || isAnalysesLoading;

  return (
    <div className="min-h-screen bg-background pt-32 pb-32">
      <Navbar />
      
      <main className="max-w-6xl mx-auto px-6 space-y-16">
        {/* Command Center Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-12">
          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary"
            >
              <Cpu className="w-3 h-3" />
              Operator Console v1.0
            </motion.div>
            <h1 className="text-6xl md:text-8xl font-bold font-headline tracking-tighter leading-[0.9]">Console.</h1>
            <p className="text-xl text-muted-foreground font-medium max-w-md">Monitoring protocol for financial waste.</p>
            <Button asChild className="h-14 px-8 rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-2xl group">
              <Link href="/analyze">
                Initiate New Audit
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
          
          <div className="premium-card !p-10 text-center min-w-[280px] bg-white/[0.02]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Total Reclaimed</p>
            {isLoading ? (
              <Skeleton className="h-12 w-24 mx-auto bg-white/5" />
            ) : (
              <h2 className="text-7xl font-bold font-headline text-success tracking-tighter">
                ${totalSavings.toFixed(0)}
              </h2>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Intelligence Timeline */}
          <section className="md:col-span-2 space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
                <Clock className="w-3 h-3" />
                Audit Ledger
              </h3>
              <Link href="/history" className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">
                View Full Records
              </Link>
            </div>
            
            <div className="space-y-4">
              {isLoading ? (
                [...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full bg-white/5 rounded-2xl" />)
              ) : analyses && analyses.length > 0 ? (
                analyses.map((analysis, i) => (
                  <motion.div
                    key={analysis.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link href={`/results/${analysis.id}`} className="premium-card flex items-center justify-between group hover:bg-white/[0.04]">
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                          <Zap className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xl font-bold font-headline tracking-tight">{analysis.title}</p>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                            {new Date(analysis.analysisDate).toLocaleDateString()} • {analysis.source?.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-success tracking-tight">+${analysis.estimatedMonthlySavings?.toFixed(0)}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-white transition-all" />
                      </div>
                    </Link>
                  </motion.div>
                ))
              ) : (
                <div className="premium-card py-16 text-center space-y-4 border-dashed border-white/10">
                  <ShieldCheck className="w-10 h-10 text-white/10 mx-auto" />
                  <p className="text-muted-foreground font-medium">No audit data identified yet.</p>
                  <Button asChild variant="outline" className="h-10 rounded-xl font-bold uppercase tracking-widest text-[10px] border-white/10">
                    <Link href="/analyze">Start First Scan</Link>
                  </Button>
                </div>
              )}
            </div>
          </section>

          {/* Sidebar Insights */}
          <aside className="space-y-8">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-3 h-3" />
              Proactive Insights
            </h3>
            
            <div className="space-y-4">
              <div className="premium-card bg-danger/5 border-danger/10 space-y-4">
                <div className="flex items-center gap-2 text-danger">
                  <AlertTriangle className="w-4 h-4" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">High Impact</p>
                </div>
                <p className="text-sm font-medium leading-relaxed">
                  Detected $120/mo in trial expirations due within 72 hours. Protocol ready.
                </p>
                <Button variant="link" className="p-0 h-auto text-[10px] font-bold uppercase tracking-widest text-danger hover:no-underline hover:text-danger/80">
                  Execute Mitigation
                </Button>
              </div>

              <div className="premium-card bg-accent/5 border-accent/10 space-y-4">
                <div className="flex items-center gap-2 text-accent">
                  <Zap className="w-4 h-4" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">Optimization</p>
                </div>
                <p className="text-sm font-medium leading-relaxed">
                  Market rates for Mobile Plans dropped by 15%. I can re-negotiate your current tier.
                </p>
                <Button variant="link" className="p-0 h-auto text-[10px] font-bold uppercase tracking-widest text-accent hover:no-underline hover:text-accent/80">
                  Generate Script
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
