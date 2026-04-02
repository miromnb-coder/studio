"use client";

import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  Copy, 
  Check, 
  AlertTriangle, 
  TrendingDown, 
  Zap, 
  ArrowRight,
  ShieldCheck,
  MessageSquare,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection } from 'firebase/firestore';

export default function ResultsPage() {
  const { id } = useParams();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Fetching your results...</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-4">
        <h1 className="text-2xl font-bold mb-4">Analysis Not Found</h1>
        <p className="text-muted-foreground mb-8">We couldn't find the requested analysis report.</p>
        <Button asChild className="rounded-full">
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  const beforeAfter = analysis.beforeComparison ? JSON.parse(analysis.beforeComparison) : null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-5xl mx-auto px-4 py-8 md:py-16 space-y-12 animate-in fade-in duration-700">
        <header className="space-y-6">
          <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors group">
            <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
            Back to dashboard
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <Badge className="bg-danger/20 text-danger rounded-full px-3 py-1 text-xs font-bold uppercase mb-2">
                Analysis Report
              </Badge>
              <h1 className="text-4xl font-bold font-headline">{analysis.title}</h1>
              <p className="text-xl text-muted-foreground max-w-2xl">{analysis.summary}</p>
            </div>
            
            <div className="premium-card bg-primary p-6 md:p-8 flex flex-col justify-center items-center text-background text-center min-w-[200px]">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Monthly Savings</p>
              <p className="text-4xl font-bold font-headline">${analysis.estimatedMonthlySavings?.toFixed(2)}</p>
            </div>
          </div>
        </header>

        {/* Before After Comparison */}
        {beforeAfter && (
          <section className="premium-card overflow-hidden bg-gradient-to-r from-secondary to-card border-white/10">
            <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-white/10">
              <div className="flex-1 p-8 space-y-2">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Current Situation</p>
                <p className="text-2xl font-bold text-muted-foreground line-through opacity-50">{beforeAfter.currentSituation}</p>
              </div>
              <div className="flex-1 p-8 space-y-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <ShieldCheck className="w-16 h-16 text-success" />
                </div>
                <p className="text-sm font-medium text-success uppercase tracking-widest">Optimized Situation</p>
                <p className="text-2xl font-bold text-foreground">{beforeAfter.optimizedSituation}</p>
                <p className="text-xs text-success font-bold">You keep ${beforeAfter.estimatedMonthlySavingsDifference} more every month</p>
              </div>
            </div>
          </section>
        )}

        {/* Findings List */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold font-headline flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary fill-primary/20" />
            Detected Findings ({items?.length || 0})
          </h2>
          
          <div className="grid gap-6">
            {items && items.map((finding, i) => (
              <div key={i} className="premium-card p-6 md:p-8 space-y-8">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="space-y-4 max-w-2xl">
                    <div className="flex items-center gap-3">
                      <Badge variant={finding.urgencyLevel === 'urgent' || finding.urgencyLevel === 'high' ? 'destructive' : 'secondary'} className="rounded-full px-3 py-1 text-[10px] font-bold uppercase">
                        {finding.urgencyLevel}
                      </Badge>
                      <span className="text-xs text-muted-foreground uppercase font-bold tracking-widest">{finding.type}</span>
                    </div>
                    <h3 className="text-2xl font-bold font-headline">{finding.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{finding.summary}</p>
                    
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                      <p className="text-xs font-bold uppercase tracking-widest text-primary">Recommended Action</p>
                      <p className="font-medium">{finding.recommendedAction}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Impact</p>
                    <p className="text-3xl font-bold text-success">Save ${finding.estimatedSavings}</p>
                    <p className="text-xs text-muted-foreground">Every month</p>
                  </div>
                </div>

                {finding.copyableMessage && (
                  <div className="pt-6 border-t border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-primary" />
                        Cancellation / Negotiation Script
                      </p>
                      <Button variant="ghost" size="sm" className="text-xs gap-2 hover:bg-white/5 rounded-full" onClick={() => navigator.clipboard.writeText(finding.copyableMessage)}>
                        <Copy className="w-3.5 h-3.5" />
                        Copy Script
                      </Button>
                    </div>
                    <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 text-muted-foreground leading-relaxed italic text-sm">
                      "{finding.copyableMessage}"
                    </div>
                  </div>
                )}
              </div>
            ))}
            {(!items || items.length === 0) && (
              <div className="p-12 text-center border rounded-xl border-dashed">
                <p className="text-muted-foreground">No specific findings detected in this analysis.</p>
              </div>
            )}
          </div>
        </section>

        <section className="pt-8 border-t border-white/5 text-center space-y-6">
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-xl font-bold font-headline">Ready to take action?</h3>
            <p className="text-muted-foreground">Use the copyable messages above to resolve these findings immediately.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="h-14 px-8 rounded-full shadow-xl shadow-primary/20 w-full sm:w-auto" asChild>
              <Link href="/dashboard">Return to Dashboard</Link>
            </Button>
            <Button variant="outline" size="lg" className="h-14 px-8 rounded-full border-white/10 w-full sm:w-auto">
              Export Analysis PDF
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
