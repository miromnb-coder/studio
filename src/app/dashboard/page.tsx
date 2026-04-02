"use client";

import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  AlertTriangle, 
  Calendar, 
  CheckCircle2, 
  Plus, 
  ChevronRight,
  Zap,
  DollarSign,
  ArrowUpRight,
  Loader2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';

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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12 space-y-8 animate-in fade-in duration-700">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold font-headline">Dashboard</h1>
            <p className="text-muted-foreground">Your proactive financial overview.</p>
          </div>
          <Button asChild size="lg" className="rounded-full shadow-lg shadow-primary/10">
            <Link href="/analyze">
              <Plus className="w-4 h-4 mr-2" />
              New Analysis
            </Link>
          </Button>
        </header>

        {/* Hero Savings Area */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 premium-card p-8 relative overflow-hidden bg-gradient-to-br from-card to-secondary/50">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <TrendingUp className="w-48 h-48" />
            </div>
            <div className="relative space-y-4">
              <p className="text-sm font-medium uppercase tracking-widest text-primary">Monthly Potential Savings</p>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-bold font-headline">${totalSavings.toFixed(2)}</span>
                <span className="text-success flex items-center text-sm font-bold">
                  <ArrowUpRight className="w-4 h-4" />
                  Live results
                </span>
              </div>
              <p className="text-muted-foreground max-w-md">We've identified several items across your recent analyses that could be optimized to lower your monthly burn rate.</p>
              <Button asChild variant="secondary" className="rounded-full bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
                <Link href="/history">View all findings</Link>
              </Button>
            </div>
          </div>

          <div className="premium-card p-8 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-headline">Recent Activity</h3>
              <p className="text-sm text-muted-foreground">
                {analyses && analyses.length > 0 
                  ? `You have ${analyses.length} recent financial analyses.` 
                  : "Start your first analysis to see savings opportunities."}
              </p>
            </div>
            <Button variant="link" className="p-0 text-accent h-auto justify-start font-bold group" asChild>
              <Link href="/history">
                View history
                <ChevronRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Analyses */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xl font-bold font-headline">Recent Analyses</h3>
              <Link href="/history" className="text-sm text-muted-foreground hover:text-primary transition-colors">View all</Link>
            </div>
            <div className="premium-card overflow-hidden">
              <div className="divide-y divide-white/5">
                {analyses && analyses.map((analysis, i) => (
                  <Link key={analysis.id} href={`/results/${analysis.id}`} className="p-4 md:p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors group block">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/5 font-bold text-xs">
                        {analysis.title.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold">{analysis.title}</p>
                        <p className="text-xs text-muted-foreground">{new Date(analysis.analysisDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right hidden sm:block">
                        <p className="font-bold text-success">+${analysis.estimatedMonthlySavings.toFixed(2)}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">Savings</p>
                      </div>
                      <Badge variant="secondary" className="rounded-full px-3 py-1 text-[10px] font-bold uppercase">
                        {analysis.status}
                      </Badge>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
                    </div>
                  </Link>
                ))}
                {(!analyses || analyses.length === 0) && (
                  <div className="p-12 text-center space-y-4">
                    <p className="text-muted-foreground">No analyses found yet.</p>
                    <Button asChild variant="outline" className="rounded-full">
                      <Link href="/analyze">Run First Analysis</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Insights */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold font-headline">Smart Insights</h3>
            <div className="space-y-4">
              <div className="premium-card p-6 bg-primary/5 border-primary/20 space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <Zap className="w-5 h-5 fill-primary/20" />
                  <span className="text-sm font-bold uppercase tracking-wider">Quick Win</span>
                </div>
                <p className="text-sm leading-relaxed">
                  Your rule-based engine is scanning for patterns. Upload a new statement to see immediate results.
                </p>
              </div>

              <div className="premium-card p-6 border-white/10 space-y-4">
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm font-bold uppercase tracking-wider">Status</span>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Proactive monitoring is enabled. Your financial data is stored securely in Firestore.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
