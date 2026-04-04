
"use client";

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { 
  Zap, 
  ArrowRight, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2,
  Cpu,
  RefreshCcw,
  ShieldCheck,
  ListChecks
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function EfficiencyAutopilotPage() {
  const [mounted, setMounted] = useState(false);
  const { user } = useUser();
  const db = useFirestore();

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

  const totalMonthlySavings = (analyses || []).reduce((acc, a) => acc + (a.estimatedMonthlySavings || 0), 0);
  const projectedYearlySavings = totalMonthlySavings * 12;

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background pt-24 pb-32">
      <Navbar />
      
      <main className="max-w-5xl mx-auto px-6 space-y-12">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-success">
              <Zap className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-[0.4em]">Efficiency Optimization Engine</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-bold font-headline tracking-tighter leading-[0.9] text-white">Autopilot.</h1>
            <p className="text-xl text-muted-foreground font-medium max-w-md">Autonomous pattern recognition and cost mitigation.</p>
          </div>
          
          <div className="flex flex-col gap-3">
             <div className="premium-card !p-6 bg-success/5 border-success/20 flex flex-col items-center justify-center text-center">
                <p className="text-[8px] font-bold uppercase tracking-widest text-success mb-1">Projected Annual Reclaim</p>
                <h2 className="text-4xl font-bold font-headline text-white tracking-tighter">${projectedYearlySavings.toFixed(0)}</h2>
             </div>
             <Button className="w-full h-12 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-white text-background hover:bg-white/90">
               <RefreshCcw className="w-3.5 h-3.5 mr-2" />
               Run Global Audit
             </Button>
          </div>
        </header>

        {/* ANALYTICS GRID */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <Card className="premium-card bg-white/[0.01] border-white/5 p-6 flex items-center gap-6">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground">
                 <TrendingUp className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                 <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Efficiency Index</p>
                 <p className="text-2xl font-bold text-white tracking-tight">84%</p>
              </div>
           </Card>
           <Card className="premium-card bg-white/[0.01] border-white/5 p-6 flex items-center gap-6">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground">
                 <Clock className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                 <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Time Reclaimed</p>
                 <p className="text-2xl font-bold text-white tracking-tight">~4.2h/mo</p>
              </div>
           </Card>
           <Card className="premium-card bg-white/[0.01] border-white/5 p-6 flex items-center gap-6">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground">
                 <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                 <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Audit Confidence</p>
                 <p className="text-2xl font-bold text-success tracking-tight">High</p>
              </div>
           </Card>
        </section>

        {/* ACTIVE RECOMMENDATIONS */}
        <section className="space-y-8">
           <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
                 <ListChecks className="w-4 h-4" />
                 Active AI Recommendations
              </h3>
              <Badge variant="outline" className="border-white/5 text-[8px]">{analyses?.length || 0} Patterns Found</Badge>
           </div>

           <div className="grid grid-cols-1 gap-4">
              {isLoading ? (
                [...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full bg-white/5 rounded-2xl" />)
              ) : (analyses || []).length > 0 ? (
                analyses.map((analysis, i) => (
                  <motion.div
                    key={analysis.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Card className="premium-card group hover:bg-white/[0.03] transition-all p-8 flex flex-col md:flex-row items-center gap-8 border-white/5">
                       <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                          <AlertTriangle className="w-7 h-7" />
                       </div>
                       <div className="flex-1 space-y-2 text-center md:text-left">
                          <div className="flex items-center justify-center md:justify-start gap-2">
                             <Badge className="bg-primary/20 text-primary border-0 text-[8px] h-4">Pattern: {analysis.source}</Badge>
                             <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Detected {new Date(analysis.createdAt?.toDate?.() || Date.now()).toLocaleDateString()}</span>
                          </div>
                          <h4 className="text-xl font-bold text-white tracking-tight">{analysis.title}</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">{analysis.summary}</p>
                       </div>
                       <div className="flex flex-col items-center md:items-end gap-3 min-w-[150px]">
                          <div className="text-center md:text-right">
                             <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Potential Save</p>
                             <p className="text-2xl font-bold text-success tracking-tighter">+${analysis.estimatedMonthlySavings.toFixed(0)}/mo</p>
                          </div>
                          <Button asChild size="sm" className="rounded-xl h-10 px-6 font-bold uppercase tracking-widest text-[10px] bg-primary text-background group-hover:glow-primary transition-all">
                             <Link href={`/results/${analysis.id}`}>Apply Fix <ArrowRight className="w-3 h-3 ml-2" /></Link>
                          </Button>
                       </div>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <div className="premium-card py-24 text-center border-dashed border-white/10 opacity-30">
                  <Cpu className="w-12 h-12 mx-auto mb-4" />
                  <p className="text-sm font-bold uppercase tracking-widest">No Inefficiencies Detected in Current Cycle</p>
                </div>
              )}
           </div>
        </section>

        {/* SYSTEM STATS */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-12">
          <div className="premium-card bg-white/[0.01] border-white/5 p-8 space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">Market Arbitrage</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Autopilot continuously scans global market rates for every detected subscription. If a identical service is found at a lower price point, a notification is generated for instant arbitrage.
            </p>
          </div>
          <div className="premium-card bg-white/[0.01] border-white/5 p-8 space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-success">Protocol Execution</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The system doesn't just notify; it prepares. Every recommendation includes a pre-drafted cancellation or negotiation protocol ready for immediate deployment via the command center.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
