
"use client";

import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  Copy, 
  Check, 
  Zap, 
  ShieldCheck,
  MessageSquare,
  Loader2,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ResultsPage() {
  const { id } = useParams();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const analysisRef = useMemoFirebase(() => {
    if (!db || !user || !id) return null;
    return doc(db, 'users', user.uid, 'analyses', id as string);
  }, [db, user, id]);

  const { data: analysis, isLoading: isAnalysisLoading } = useDoc(analysisRef);

  const itemsRef = useMemoFirebase(() => {
    if (!db || !user || !id) return null;
    return collection(db, 'users', user.uid, 'analyses', id as string, 'detected_items');
  }, [db, user, id]);

  const { data: items, isLoading: isItemsLoading } = useCollection(itemsRef);

  if (isUserLoading || isAnalysisLoading || isItemsLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="mt-6 text-muted-foreground font-medium tracking-wide">Finalizing report...</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-8">
        <h1 className="text-3xl font-bold font-headline mb-4">Analysis Not Found</h1>
        <p className="text-muted-foreground text-lg mb-12">The requested report could not be retrieved from the operator.</p>
        <Button asChild size="lg" className="rounded-full px-12">
          <Link href="/dashboard">Return to Dashboard</Link>
        </Button>
      </div>
    );
  }

  const beforeAfter = analysis.beforeComparison ? JSON.parse(analysis.beforeComparison) : null;

  return (
    <div className="min-h-screen bg-background pb-32">
      <Navbar />
      
      <main className="max-w-5xl mx-auto px-6 py-12 md:py-24 space-y-20">
        <motion.header 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-10"
        >
          <Link href="/dashboard" className="inline-flex items-center text-sm font-bold text-muted-foreground hover:text-foreground transition-colors group uppercase tracking-widest">
            <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Dashboard
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
            <div className="space-y-4 max-w-3xl">
              <Badge className="bg-primary/20 text-primary border-primary/20 rounded-full px-4 py-1 text-xs font-bold uppercase tracking-widest mb-4">
                Verified Analysis Report
              </Badge>
              <h1 className="text-6xl font-bold font-headline leading-tight tracking-tight">{analysis.title}</h1>
              <p className="text-2xl text-muted-foreground leading-relaxed">{analysis.summary}</p>
            </div>
            
            <div className="premium-card bg-primary !p-10 flex flex-col justify-center items-center text-background text-center min-w-[280px] shadow-primary/20">
              <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-80 mb-2">Monthly Saving</p>
              <p className="text-6xl font-bold font-headline">${analysis.estimatedMonthlySavings?.toFixed(2)}</p>
            </div>
          </div>
        </motion.header>

        {/* Before After Comparison */}
        {beforeAfter && (
          <motion.section 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="premium-card !p-0 overflow-hidden bg-gradient-to-r from-[#232327] to-[#1a1a1e] border-white/5"
          >
            <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-white/10">
              <div className="flex-1 p-10 space-y-4">
                <div className="flex items-center gap-3 text-muted-foreground/60">
                  <TrendingUp className="w-5 h-5 opacity-50" />
                  <p className="text-xs font-bold uppercase tracking-widest">Baseline Scenario</p>
                </div>
                <p className="text-3xl font-bold text-muted-foreground/40 line-through decoration-danger/40">{beforeAfter.currentSituation}</p>
              </div>
              <div className="flex-1 p-10 space-y-4 relative overflow-hidden bg-success/[0.02]">
                <div className="absolute top-0 right-0 p-8 opacity-[0.05] text-success">
                  <ShieldCheck className="w-32 h-32" />
                </div>
                <div className="flex items-center gap-3 text-success">
                  <ShieldCheck className="w-5 h-5" />
                  <p className="text-xs font-bold uppercase tracking-widest">Optimized Projection</p>
                </div>
                <p className="text-3xl font-bold text-foreground">{beforeAfter.optimizedSituation}</p>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success/10 text-success text-xs font-bold">
                  Reclaiming ${beforeAfter.estimatedMonthlySavingsDifference} monthly
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* Findings List */}
        <section className="space-y-10">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold font-headline flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <Zap className="w-6 h-6 fill-primary/20" />
              </div>
              Detected Targets ({items?.length || 0})
            </h2>
          </div>
          
          <div className="grid gap-10">
            {items && items.map((finding, i) => (
              <motion.div 
                key={finding.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="premium-card space-y-10"
              >
                <div className="flex flex-col md:flex-row justify-between gap-10">
                  <div className="space-y-6 max-w-2xl">
                    <div className="flex items-center gap-4">
                      <Badge variant={finding.urgencyLevel === 'urgent' || finding.urgencyLevel === 'high' ? 'destructive' : 'secondary'} className="rounded-full px-4 py-1 text-[10px] font-bold uppercase tracking-wider">
                        {finding.urgencyLevel} Urgency
                      </Badge>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.2em]">{finding.type.replace('_', ' ')}</span>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-4xl font-bold font-headline">{finding.title}</h3>
                      <p className="text-xl text-muted-foreground leading-relaxed">{finding.summary}</p>
                    </div>
                    
                    <div className="p-8 rounded-[24px] bg-white/[0.03] border border-white/5 space-y-4">
                      <div className="flex items-center gap-2 text-primary">
                        <ArrowRight className="w-4 h-4" />
                        <p className="text-xs font-bold uppercase tracking-widest">Operator Strategy</p>
                      </div>
                      <p className="text-lg font-medium leading-relaxed">{finding.recommendedAction}</p>
                    </div>
                  </div>

                  <div className="text-right space-y-2">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Monthly Impact</p>
                    <p className="text-5xl font-bold text-success glow-success tracking-tight">Save ${finding.estimatedSavings}</p>
                    <p className="text-sm text-muted-foreground font-medium">Reclaimed indefinitely</p>
                  </div>
                </div>

                {finding.copyableMessage && (
                  <div className="pt-10 border-t border-white/5 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-5 h-5 text-primary" />
                        <p className="text-sm font-bold uppercase tracking-widest">Action Engine Script</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={`text-xs gap-2 rounded-full px-6 h-10 transition-all ${copiedId === finding.id ? 'bg-success/20 text-success' : 'bg-white/5 hover:bg-white/10'}`} 
                        onClick={() => handleCopy(finding.copyableMessage, finding.id)}
                      >
                        {copiedId === finding.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copiedId === finding.id ? 'Copied to clipboard' : 'Copy Script'}
                      </Button>
                    </div>
                    <div className="p-10 rounded-[24px] bg-white/[0.02] border border-white/5 text-muted-foreground leading-relaxed text-lg font-medium italic">
                      "{finding.copyableMessage}"
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </section>

        <motion.section 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="pt-16 border-t border-white/5 text-center space-y-10"
        >
          <div className="max-w-2xl mx-auto space-y-4">
            <h3 className="text-3xl font-bold font-headline">Optimization Complete</h3>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Use the generated scripts above to contact providers and reclaim your monthly capital.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Button size="lg" className="h-16 px-12 rounded-full shadow-2xl shadow-primary/20 w-full sm:w-auto text-lg font-bold" asChild>
              <Link href="/dashboard">Return to Dashboard</Link>
            </Button>
            <Button variant="outline" size="lg" className="h-16 px-12 rounded-full border-white/10 w-full sm:w-auto text-lg font-bold hover:bg-white/5">
              Export Analysis PDF
            </Button>
          </div>
        </motion.section>
      </main>
    </div>
  );
}
