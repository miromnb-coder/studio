"use client";

import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  ChevronRight,
  Plus,
  Loader2,
  Wallet,
  Mail,
  ArrowUpRight
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
        <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32 md:pt-32">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-8 space-y-24">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-12">
          <div className="space-y-4">
            <h1 className="text-6xl md:text-8xl font-bold font-headline leading-[0.9]">Insights</h1>
            <p className="text-muted-foreground text-xl max-w-md">Your proactive financial optimization engine is active.</p>
          </div>
        </header>

        {/* Hero Savings Area */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 premium-card flex flex-col justify-between min-h-[400px]"
          >
            <div className="space-y-8">
              <Badge className="bg-success/10 text-success border-success/20 rounded-full px-4 py-1 text-[10px] font-bold uppercase tracking-widest">
                Optimization Targets
              </Badge>
              <div className="space-y-2">
                <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Monthly Reclaim Potential</p>
                <h2 className="text-[120px] font-bold font-headline leading-none text-success glow-success tracking-tighter">
                  ${totalSavings.toFixed(0)}
                </h2>
              </div>
            </div>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-xl">
              We identified recurring patterns in your spending. Act on these findings to reclaim your monthly burn rate.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="premium-card flex flex-col justify-between bg-primary/5 border-primary/10"
          >
            <div className="space-y-8">
              <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary">
                <Mail className="w-8 h-8" />
              </div>
              <div className="space-y-4">
                <h3 className="text-3xl font-bold font-headline">Magic Email</h3>
                <p className="text-muted-foreground leading-relaxed text-lg">
                  Forward receipts to your unique address for instant, hands-free analysis.
                </p>
              </div>
            </div>
            <Button variant="link" className="p-0 text-primary h-auto justify-start font-bold text-lg group" asChild>
              <Link href="/settings">
                Setup automation
                <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </motion.div>
        </section>

        {/* Recent Activity */}
        <section className="space-y-12">
          <div className="flex items-center justify-between">
            <h3 className="text-3xl font-bold font-headline">Recent Analyses</h3>
            <Link href="/history" className="text-muted-foreground hover:text-primary transition-colors font-bold uppercase tracking-widest text-xs">View History</Link>
          </div>
          
          <div className="grid gap-6">
            {analyses?.map((analysis, i) => (
              <motion.div
                key={analysis.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/results/${analysis.id}`} className="premium-card !p-6 flex items-center justify-between group hover:bg-white/[0.02]">
                  <div className="flex items-center gap-8">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 font-bold text-muted-foreground group-hover:text-primary transition-colors">
                      {analysis.source === 'email' ? <Mail className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <p className="text-xl font-bold">{analysis.title}</p>
                        {analysis.source === 'email' && (
                          <span className="text-[8px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full">Automated</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
                        {new Date(analysis.analysisDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-success tracking-tight">+${analysis.estimatedMonthlySavings.toFixed(2)}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              </motion.div>
            ))}
            {(!analyses || analyses.length === 0) && (
              <div className="premium-card py-24 text-center space-y-8 border-dashed opacity-50">
                <p className="text-xl text-muted-foreground">No analyses found yet.</p>
                <Button asChild className="rounded-full px-12 h-14 text-lg font-bold">
                  <Link href="/analyze">Run First Analysis</Link>
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}