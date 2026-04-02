
"use client";

import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  AlertTriangle, 
  ChevronRight,
  Zap,
  Plus,
  ArrowUpRight,
  Loader2,
  Wallet,
  Activity
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { motion } from 'framer-motion';

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

  if (isUserLoading || isAnalysesLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="mt-6 text-muted-foreground font-medium">Loading your secure dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-6 py-12 md:py-20 space-y-12">
        <motion.header 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-8"
        >
          <div className="space-y-2">
            <h1 className="text-5xl font-bold font-headline">Dashboard</h1>
            <p className="text-muted-foreground text-xl">Your proactive financial optimization overview.</p>
          </div>
          <Button asChild size="lg" className="h-14 px-8 rounded-full shadow-2xl shadow-primary/20">
            <Link href="/analyze">
              <Plus className="w-5 h-5 mr-2" />
              New Analysis
            </Link>
          </Button>
        </motion.header>

        {/* Hero Savings Area */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="md:col-span-2 premium-card relative overflow-hidden bg-gradient-to-br from-[#232327] to-[#1a1a1e]"
          >
            <div className="absolute top-0 right-0 p-12 opacity-[0.03]">
              <TrendingUp className="w-64 h-64" />
            </div>
            <div className="relative space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center text-success">
                  <Wallet className="w-5 h-5" />
                </div>
                <p className="text-sm font-bold uppercase tracking-widest text-success">Monthly Potential Savings</p>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-8xl font-bold font-headline glow-success text-success tracking-tighter">
                  ${totalSavings.toFixed(2)}
                </span>
              </div>
              <p className="text-muted-foreground text-lg max-w-xl leading-relaxed">
                We've identified optimization targets across your recent analyses. Address these findings to reclaim your monthly burn rate.
              </p>
              <div className="pt-4 flex gap-4">
                <Button asChild className="rounded-full h-12 px-8 bg-white/5 border border-white/5 hover:bg-white/10 text-white">
                  <Link href="/history">View all findings</Link>
                </Button>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="premium-card flex flex-col justify-between"
          >
            <div className="space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <Activity className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold font-headline">Intelligence Status</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {analyses && analyses.length > 0 
                    ? `Monitoring active across ${analyses.length} recent statements.` 
                    : "No data streams detected. Initiate an analysis to begin monitoring."}
                </p>
              </div>
            </div>
            <Button variant="link" className="p-0 text-primary h-auto justify-start font-bold text-lg group" asChild>
              <Link href="/history">
                View History
                <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-4">
          {/* Recent Analyses */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-2xl font-bold font-headline">Recent Analyses</h3>
              <Link href="/history" className="text-muted-foreground hover:text-primary transition-colors font-medium">View all</Link>
            </div>
            <div className="premium-card !p-0 overflow-hidden border-white/5">
              <div className="divide-y divide-white/5">
                {analyses && analyses.map((analysis, i) => (
                  <Link key={analysis.id} href={`/results/${analysis.id}`} className="p-8 flex items-center justify-between hover:bg-white/[0.02] transition-colors group block">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 font-bold text-xl text-primary">
                        {analysis.title.charAt(0)}
                      </div>
                      <div className="space-y-1">
                        <p className="text-xl font-bold">{analysis.title}</p>
                        <p className="text-sm text-muted-foreground">{new Date(analysis.analysisDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right hidden sm:block">
                        <p className="text-2xl font-bold text-success tracking-tight">+${analysis.estimatedMonthlySavings.toFixed(2)}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Optimization</p>
                      </div>
                      <Badge className="rounded-full px-4 py-1.5 text-[10px] font-bold uppercase bg-white/5 text-muted-foreground border-white/10">
                        {analysis.status}
                      </Badge>
                      <ChevronRight className="w-6 h-6 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                ))}
                {(!analyses || analyses.length === 0) && (
                  <div className="p-20 text-center space-y-6">
                    <p className="text-xl text-muted-foreground">No analyses found yet.</p>
                    <Button asChild size="lg" className="rounded-full px-8">
                      <Link href="/analyze">Run First Analysis</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Insights */}
          <div className="space-y-8">
            <h3 className="text-2xl font-bold font-headline">Smart Insights</h3>
            <div className="space-y-6">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="premium-card !p-8 bg-primary/5 border-primary/20 space-y-6"
              >
                <div className="flex items-center gap-3 text-primary">
                  <Zap className="w-6 h-6 fill-primary/20" />
                  <span className="text-sm font-bold uppercase tracking-widest">Active Suggestion</span>
                </div>
                <p className="text-lg leading-relaxed font-medium">
                  We recommend a weekly audit of your digital receipts to prevent trial leakages.
                </p>
              </motion.div>

              <div className="premium-card !p-8 border-white/10 space-y-4 opacity-80">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="text-sm font-bold uppercase tracking-widest">Proactive Alert</span>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Your operator engine is currently scanning for common duplicates. No major anomalies detected in your history.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
