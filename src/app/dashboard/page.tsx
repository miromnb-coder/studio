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
  Search,
  Clock,
  Send,
  Loader2,
  Calendar
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
    <div className="min-h-screen bg-background pb-32 md:pt-32">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-8 space-y-24">
        {/* Command Center Hero */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-12">
          <div className="space-y-6">
            <h1 className="text-6xl md:text-8xl font-bold font-headline leading-[0.9] tracking-tighter">Operator.</h1>
            <p className="text-muted-foreground text-2xl max-w-md font-medium">Monitoring your bleed 24/7.</p>
            <Button asChild className="h-16 px-10 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 group">
              <Link href="/">
                New Audit
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
          
          <div className="premium-card !p-12 bg-success/[0.02] border-success/10 text-center min-w-[320px]">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/60 mb-2">Monthly Reclaimed</p>
            {isLoading ? (
              <Skeleton className="h-16 w-32 mx-auto bg-white/5" />
            ) : (
              <h2 className="text-8xl font-bold font-headline text-success glow-success tracking-tighter">
                €{totalSavings.toFixed(0)}
              </h2>
            )}
          </div>
        </header>

        {/* Intelligence Timeline */}
        <section className="space-y-12">
          <div className="flex items-center justify-between border-b border-white/5 pb-8">
            <h3 className="text-3xl font-bold font-headline tracking-tight">Timeline</h3>
            <Link href="/history" className="text-muted-foreground hover:text-primary transition-colors font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
              Full Record
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid gap-6">
            {isLoading ? (
              [...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full bg-white/5 rounded-[32px]" />)
            ) : analyses && analyses.length > 0 ? (
              analyses.map((analysis, i) => (
                <Link key={analysis.id} href={`/results/${analysis.id}`} className="premium-card !p-10 flex items-center justify-between group hover:bg-white/[0.02]">
                  <div className="flex items-center gap-8">
                    <div className="w-16 h-16 rounded-[24px] bg-white/5 flex items-center justify-center border border-white/5 text-muted-foreground group-hover:text-primary transition-colors">
                      <Zap className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl font-bold font-headline tracking-tight">{analysis.title}</p>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                        {new Date(analysis.analysisDate).toLocaleDateString()} • {analysis.source.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-12">
                    <div className="text-right">
                      <p className="text-3xl font-bold text-success tracking-tight">+€{analysis.estimatedMonthlySavings.toFixed(0)}</p>
                    </div>
                    <ChevronRight className="w-6 h-6 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              ))
            ) : (
              <div className="premium-card py-24 text-center space-y-6 border-dashed border-white/10">
                <ShieldCheck className="w-12 h-12 text-primary/20 mx-auto" />
                <div className="space-y-2">
                  <p className="text-2xl font-bold font-headline">Engine Idle.</p>
                  <p className="text-muted-foreground font-medium">Paste your first statement to begin the audit.</p>
                </div>
                <Button asChild variant="outline" className="rounded-full px-10 h-14 font-bold border-white/10">
                  <Link href="/">Get Started</Link>
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
