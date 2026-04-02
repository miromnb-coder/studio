"use client";

import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  ChevronRight,
  Mail,
  Zap,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  Search
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

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

  const emailScans = analyses?.filter(a => a.source === 'email').length || 0;

  return (
    <div className="min-h-screen bg-background pb-32 md:pt-32">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-8 space-y-24">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-12">
          <div className="space-y-4">
            <h1 className="text-6xl md:text-8xl font-bold font-headline leading-[0.9] tracking-tight">Operator</h1>
            <p className="text-muted-foreground text-xl max-w-md font-medium">Hunting for savings in your digital trail.</p>
          </div>
          <div className="flex gap-4">
             <div className="premium-card !p-6 flex items-center gap-4 bg-white/[0.02]">
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Scanned this week</p>
                  <p className="text-2xl font-bold font-headline">{isLoading ? '...' : emailScans * 8 + 12}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Search className="w-5 h-5" />
                </div>
             </div>
          </div>
        </header>

        {/* Magic Email Hero */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 premium-card flex flex-col justify-between min-h-[480px] bg-primary/5 border-primary/10 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:opacity-20 transition-opacity">
              <Zap className="w-64 h-64 text-primary" />
            </div>
            
            <div className="space-y-8 relative z-10">
              <Badge className="bg-primary/20 text-primary border-primary/20 rounded-full px-4 py-1 text-[10px] font-bold uppercase tracking-widest">
                Core Engine Active
              </Badge>
              <div className="space-y-4">
                <h2 className="text-5xl md:text-7xl font-bold font-headline leading-tight tracking-tight">Magic Forwarding</h2>
                <p className="text-muted-foreground text-xl max-w-xl font-medium leading-relaxed">
                  The Operator works best when you forward receipts. Sync your inbox to identify trials, price hikes, and forgotten fees instantly.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
              <Button asChild size="lg" className="rounded-full h-16 px-12 text-lg font-bold shadow-2xl shadow-primary/20">
                <Link href="/settings">
                  Get My Address
                  <ArrowUpRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Scanned 12 receipts identified €{totalSavings.toFixed(0)} saved.
              </p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="premium-card flex flex-col justify-between bg-success/[0.02] border-success/10"
          >
            <div className="space-y-8">
              <div className="w-16 h-16 rounded-[24px] bg-success/10 flex items-center justify-center text-success glow-success">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Current Optimization</p>
                {isLoading ? (
                  <Skeleton className="h-16 w-32 bg-white/5" />
                ) : (
                  <h2 className="text-7xl font-bold font-headline text-success glow-success tracking-tighter">
                    ${totalSavings.toFixed(0)}
                  </h2>
                )}
                <p className="text-muted-foreground font-medium pt-4">Total monthly burn reduced.</p>
              </div>
            </div>
            <Button variant="link" className="p-0 text-success h-auto justify-start font-bold text-lg group" asChild>
              <Link href="/history">
                View Timeline
                <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </motion.div>
        </section>

        {/* Smart Inbox Feed */}
        <section className="space-y-12">
          <div className="flex items-center justify-between">
            <h3 className="text-3xl font-bold font-headline tracking-tight">Recent Scans</h3>
            <Link href="/analyze" className="text-muted-foreground hover:text-primary transition-colors font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Manual Upload
            </Link>
          </div>
          
          <div className="grid gap-6">
            {isLoading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="premium-card !p-6 flex items-center justify-between opacity-50">
                  <div className="flex items-center gap-8">
                    <Skeleton className="w-14 h-14 rounded-2xl bg-white/5" />
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-48 bg-white/5" />
                      <Skeleton className="h-3 w-24 bg-white/5" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-24 bg-white/5" />
                </div>
              ))
            ) : analyses && analyses.length > 0 ? (
              analyses.map((analysis, i) => (
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
                          <p className="text-xl font-bold font-headline tracking-tight">{analysis.title}</p>
                          {analysis.source === 'email' && (
                            <Badge className="bg-primary/10 text-primary border-primary/20 rounded-full px-2 py-0 text-[8px] font-bold uppercase tracking-widest">
                              Inbox Detected
                            </Badge>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                          {new Date(analysis.analysisDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-success tracking-tight">+${analysis.estimatedMonthlySavings.toFixed(0)}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                </motion.div>
              ))
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="premium-card py-32 text-center space-y-12 border-dashed border-white/5"
              >
                <div className="space-y-4">
                  <p className="text-3xl font-bold font-headline tracking-tight">Inbox is empty.</p>
                  <p className="text-muted-foreground text-lg font-medium">Forward your first receipt to begin automated optimization.</p>
                </div>
                <Button asChild size="lg" className="rounded-full px-12 h-16 text-lg font-bold shadow-2xl shadow-primary/20">
                  <Link href="/settings">
                    Setup Inbox Sync
                  </Link>
                </Button>
              </motion.div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
