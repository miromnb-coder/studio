"use client";

import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  Copy, 
  Check, 
  Zap, 
  MessageSquare,
  TrendingUp,
  Mail,
  Send,
  ArrowRightLeft
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

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
        <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  if (!analysis) return null;

  const beforeAfter = analysis.beforeComparison ? JSON.parse(analysis.beforeComparison) : null;

  return (
    <div className="min-h-screen bg-background pb-40 md:pt-32">
      <Navbar />
      
      <main className="max-w-5xl mx-auto px-8 space-y-24">
        <header className="space-y-12">
          <Link href="/dashboard" className="inline-flex items-center text-[10px] font-bold text-muted-foreground hover:text-white transition-all uppercase tracking-[0.2em] group">
            <ChevronLeft className="w-3 h-3 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-12">
            <div className="space-y-6 max-w-2xl">
              <div className="flex items-center gap-4 mb-4">
                <Badge className="bg-primary/10 text-primary border-primary/10 rounded-full px-4 py-1 text-[10px] font-bold uppercase tracking-widest">
                  Agentic Optimization Verified
                </Badge>
                {analysis.source === 'email' && <Mail className="w-4 h-4 text-primary" />}
              </div>
              <h1 className="text-6xl md:text-8xl font-bold font-headline leading-[0.9]">{analysis.title}</h1>
              <p className="text-2xl text-muted-foreground leading-relaxed">{analysis.summary}</p>
            </div>
            
            <div className="premium-card bg-success !p-12 flex flex-col justify-center items-center text-background text-center min-w-[280px]">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-60 mb-2">Monthly Saving</p>
              <p className="text-7xl font-bold font-headline leading-none">€{analysis.estimatedMonthlySavings?.toFixed(0)}</p>
            </div>
          </div>
        </header>

        {/* Before After */}
        {beforeAfter && (
          <section className="premium-card !p-0 overflow-hidden grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/5">
            <div className="p-12 space-y-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Legacy Burn</p>
              <p className="text-3xl font-bold text-muted-foreground/30 line-through decoration-danger/30">{beforeAfter.currentSituation}</p>
            </div>
            <div className="p-12 space-y-6 bg-success/[0.02]">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-success">Optimized State</p>
              <p className="text-3xl font-bold">{beforeAfter.optimizedSituation}</p>
            </div>
          </section>
        )}

        {/* Findings List */}
        <section className="space-y-12">
          <h2 className="text-3xl font-bold font-headline">Targets Identified ({items?.length || 0})</h2>
          
          <div className="grid gap-8">
            {items?.map((item, i) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="premium-card space-y-12"
              >
                <div className="flex flex-col md:flex-row justify-between gap-12">
                  <div className="space-y-8 max-w-2xl">
                    <div className="flex items-center gap-4">
                      <Badge variant={item.urgencyLevel === 'urgent' ? 'destructive' : 'secondary'} className="rounded-full px-4 py-1 text-[8px] font-bold uppercase tracking-widest">
                        {item.urgencyLevel}
                      </Badge>
                      <span className="text-[8px] text-muted-foreground uppercase font-bold tracking-[0.2em]">{item.type.replace('_', ' ')}</span>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-4xl font-bold font-headline">{item.title}</h3>
                      <p className="text-xl text-muted-foreground leading-relaxed">{item.summary}</p>
                      
                      {item.alternativeSuggestion && (
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/10 w-fit">
                          <ArrowRightLeft className="w-4 h-4 text-primary" />
                          <p className="text-sm font-bold text-primary">CHEAPER ALTERNATIVE: {item.alternativeSuggestion}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Monthly Potential</p>
                    <p className="text-5xl font-bold text-success glow-success tracking-tight">€{item.estimatedSavings}</p>
                  </div>
                </div>

                {item.copyableMessage && (
                  <div className="pt-12 border-t border-white/5 space-y-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-4 h-4 text-primary" />
                        <p className="text-[10px] font-bold uppercase tracking-widest">Operator Action Script</p>
                      </div>
                      <div className="flex gap-4">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={cn(
                            "text-[10px] uppercase font-bold tracking-widest gap-2 rounded-full px-6 transition-all",
                            copiedId === item.id ? "bg-success/20 text-success" : "bg-white/5"
                          )} 
                          onClick={() => handleCopy(item.copyableMessage, item.id)}
                        >
                          {copiedId === item.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {copiedId === item.id ? 'Copied' : 'Copy'}
                        </Button>
                        <Button 
                          asChild
                          variant="default" 
                          size="sm" 
                          className="text-[10px] uppercase font-bold tracking-widest gap-2 rounded-full px-6 bg-primary text-background hover:bg-primary/90"
                        >
                          <a href={`mailto:support@${item.title.split(' ')[0].toLowerCase()}.com?subject=Inquiry Regarding ${item.title}&body=${encodeURIComponent(item.copyableMessage)}`}>
                            <Send className="w-3 h-3" />
                            Execute Change
                          </a>
                        </Button>
                      </div>
                    </div>
                    <div className="p-12 rounded-[32px] bg-white/[0.01] border border-white/5 text-xl font-medium italic text-muted-foreground/80 leading-relaxed">
                      "{item.copyableMessage}"
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </section>

        <footer className="pt-24 border-t border-white/5 flex flex-col items-center gap-12">
          <div className="text-center space-y-4">
            <h3 className="text-4xl font-bold font-headline">Reclaim confirmed.</h3>
            <p className="text-xl text-muted-foreground">Use the scripts above to execute negotiations.</p>
          </div>
          <Button asChild className="rounded-full px-16 h-20 text-xl font-bold shadow-2xl shadow-primary/20">
            <Link href="/dashboard">Done for now</Link>
          </Button>
        </footer>
      </main>
    </div>
  );
}
