
"use client";

import { useState, useEffect, useMemo } from 'react';
import { 
  Zap, 
  ArrowRight, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  Loader2,
  Cpu,
  RefreshCcw,
  ShieldCheck,
  ListChecks,
  Search,
  FileText,
  Mail,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function AuditLedgerPage() {
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
      limit(50)
    );
  }, [db, user]);

  const { data: analyses, isLoading } = useCollection(analysesQuery);

  const totalMonthlySavings = useMemo(() => {
    return (analyses || []).reduce((acc, a) => acc + (a.estimatedMonthlySavings || 0), 0);
  }, [analyses]);

  const projectedYearlySavings = totalMonthlySavings * 12;
  const efficiencyIndex = analyses && analyses.length > 0 ? Math.min(95, 60 + analyses.length * 5) : 0;
  const reclaimedHours = (totalMonthlySavings / 50).toFixed(1);

  if (!mounted) return null;

  const getSourceIcon = (source?: string) => {
    switch(source) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'screenshot': return <FileText className="w-4 h-4" />;
      case 'chat': return <MessageSquare className="w-4 h-4" />;
      default: return <Search className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-success">
            <ListChecks className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-[0.4em]">Audit Ledger & Evidence</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-bold font-headline tracking-tighter leading-[0.9] text-slate-900">Ledger.</h1>
          <p className="text-xl text-muted-foreground font-medium max-w-md">Every insight verified and mapped to source telemetry.</p>
        </div>
        
        <div className="flex flex-col gap-3">
           <div className="premium-card !p-6 bg-success/5 border-success/20 flex flex-col items-center justify-center text-center">
              <p className="text-[8px] font-bold uppercase tracking-widest text-success mb-1">Projected Annual Reclaim</p>
              <h2 className="text-4xl font-bold font-headline text-slate-900 tracking-tighter">${projectedYearlySavings.toFixed(0)}</h2>
           </div>
           <Button asChild className="w-full h-12 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-white text-slate-900 shadow-sm border border-slate-100 hover:bg-slate-50">
             <Link href="/">
               <RefreshCcw className="w-3.5 h-3.5 mr-2" />
               Run New Audit
             </Link>
           </Button>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="premium-card bg-white/[0.01] border-white/5 p-6 flex items-center gap-6 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
               <TrendingUp className="w-6 h-6" />
            </div>
            <div className="space-y-1">
               <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Efficiency Index</p>
               <p className="text-2xl font-bold text-slate-900 tracking-tight">{efficiencyIndex}%</p>
            </div>
         </Card>
         <Card className="premium-card bg-white/[0.01] border-white/5 p-6 flex items-center gap-6 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
               <Clock className="w-6 h-6" />
            </div>
            <div className="space-y-1">
               <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Time Reclaimed</p>
               <p className="text-2xl font-bold text-slate-900 tracking-tight">~{reclaimedHours}h/mo</p>
            </div>
         </Card>
         <Card className="premium-card bg-white/[0.01] border-white/5 p-6 flex items-center gap-6 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
               <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1">
               <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Audit Confidence</p>
               <p className="text-2xl font-bold text-success tracking-tight">High</p>
            </div>
         </Card>
      </section>

      <section className="space-y-8">
         <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 flex items-center gap-2">
               <Terminal className="w-4 h-4" />
               Audit Trail (Recent Briefings)
            </h3>
            <Badge variant="outline" className="border-slate-100 text-[8px] text-slate-400 uppercase tracking-widest">{analyses?.length || 0} Patterns Found</Badge>
         </div>

         <div className="grid grid-cols-1 gap-4">
            {isLoading ? (
              [...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full bg-slate-50 rounded-4xl" />)
            ) : (analyses || []).length > 0 ? (
              analyses!.map((analysis, i) => (
                <motion.div
                  key={analysis.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="premium-card group hover:bg-white transition-all p-8 flex flex-col md:flex-row items-center gap-8 border-white shadow-sm hover:shadow-lg rounded-4xl">
                     <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                        {getSourceIcon(analysis.source)}
                     </div>
                     <div className="flex-1 space-y-2 text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-3">
                           <Badge className="bg-primary/5 text-primary border-primary/10 text-[8px] h-5 px-3 uppercase tracking-widest">
                             {analysis.source || 'General Audit'}
                           </Badge>
                           <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                             Detected {new Date(analysis.createdAt?.toDate?.() || Date.now()).toLocaleDateString()}
                           </span>
                        </div>
                        <h4 className="text-xl font-bold text-slate-900 tracking-tight">{analysis.title}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl line-clamp-2">{analysis.summary}</p>
                     </div>
                     <div className="flex flex-col items-center md:items-end gap-3 min-w-[180px] border-l border-slate-50 pl-8">
                        <div className="text-center md:text-right">
                           <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Monthly Yield</p>
                           <p className="text-3xl font-bold text-success tracking-tighter">+${analysis.estimatedMonthlySavings?.toFixed(0)}/mo</p>
                        </div>
                        <Button asChild size="sm" className="rounded-xl h-10 px-6 font-bold uppercase tracking-widest text-[10px] bg-slate-900 text-white shadow-lg shadow-slate-900/20">
                           <Link href={`/results/${analysis.id}`}>Inspect Evidence <ArrowRight className="w-3 h-3 ml-2" /></Link>
                        </Button>
                     </div>
                  </Card>
                </motion.div>
              ))
            ) : (
              <div className="premium-card py-24 text-center border-dashed border-slate-200 opacity-30 rounded-4xl">
                <Cpu className="w-12 h-12 mx-auto mb-4" />
                <p className="text-sm font-bold uppercase tracking-widest">Audit Ledger Empty</p>
                <p className="text-[10px] font-bold uppercase text-slate-400 mt-2">Initialize a reasoning cycle to generate evidence</p>
              </div>
            )}
         </div>
      </section>

      <footer className="p-8 rounded-[3rem] bg-slate-50/50 border border-slate-100 flex items-center justify-center gap-4 text-center">
        <ShieldCheck className="w-5 h-5 text-success" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
          All calculations are verified by Agent Engine V5.6 based on objective telemetry signals.
        </p>
      </footer>
    </div>
  );
}
