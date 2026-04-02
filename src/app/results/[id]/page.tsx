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
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Cpu
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
        <Cpu className="w-12 h-12 text-primary animate-pulse" />
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="min-h-screen bg-background pt-32 pb-40">
      <Navbar />
      
      <main className="max-w-5xl mx-auto px-6 space-y-16">
        <header className="space-y-8">
          <Link href="/dashboard" className="inline-flex items-center text-[10px] font-bold text-muted-foreground hover:text-white uppercase tracking-widest group">
            <ChevronLeft className="w-3 h-3 mr-1 group-hover:-translate-x-1 transition-transform" />
            Back to Console
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4 max-w-2xl">
              <div className="flex items-center gap-3">
                <Badge className="bg-success/10 text-success border-success/20 rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest">
                  Hunt Finalized
                </Badge>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {new Date(analysis.analysisDate).toLocaleDateString()}
                </span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold font-headline tracking-tighter leading-[0.9]">{analysis.title}</h1>
              <p className="text-xl text-muted-foreground font-medium leading-relaxed">{analysis.summary}</p>
            </div>
            
            <div className="premium-card bg-primary text-background p-10 min-w-[280px] flex flex-col items-center justify-center text-center shadow-[0_20px_80px_-15px_rgba(148,148,247,0.4)]">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Monthly Saved</p>
              <p className="text-7xl font-bold font-headline leading-none">${analysis.estimatedMonthlySavings?.toFixed(0)}</p>
            </div>
          </div>
        </header>

        <section className="space-y-8">
          <div className="flex items-center gap-3 pb-4 border-b border-white/5">
            <Zap className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold font-headline uppercase tracking-widest text-[12px]">Operator Intelligence ({items?.length || 0})</h2>
          </div>
          
          <div className="grid gap-8">
            {items?.map((item, i) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="premium-card !p-0 overflow-hidden"
              >
                <div className="p-8 md:p-10 flex flex-col md:flex-row justify-between gap-8">
                  <div className="space-y-6 max-w-xl">
                    <div className="flex items-center gap-3">
                      <Badge variant={item.urgencyLevel === 'urgent' ? 'destructive' : 'secondary'} className="rounded-full px-3 py-0.5 text-[8px] font-bold uppercase tracking-widest">
                        {item.urgencyLevel}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{item.type?.replace('_', ' ')}</span>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-3xl font-bold font-headline tracking-tight">{item.title}</h3>
                      <p className="text-lg text-muted-foreground font-medium leading-relaxed">"{item.summary}"</p>
                    </div>

                    {item.alternativeSuggestion && (
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-xs font-bold text-primary flex items-center gap-2">
                          <TrendingUp className="w-3.5 h-3.5" />
                          UPGRADE: {item.alternativeSuggestion}
                        </div>
                        {item.alternativeLink && (
                          <a 
                            href={item.alternativeLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-white flex items-center gap-1.5 transition-colors"
                          >
                            Explore Alternative <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="md:text-right space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Estimated Impact</p>
                    <p className="text-5xl font-bold text-success font-headline tracking-tight">${item.estimatedSavings}</p>
                  </div>
                </div>

                <div className="bg-white/[0.02] border-t border-white/5 p-8 md:p-10 space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-primary" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Generated Protocol Script</p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className={cn(
                          "flex-1 sm:flex-none rounded-xl text-[10px] font-bold uppercase tracking-widest gap-2",
                          copiedId === item.id ? "bg-success text-background" : ""
                        )} 
                        onClick={() => handleCopy(item.copyableMessage, item.id)}
                      >
                        {copiedId === item.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copiedId === item.id ? 'Stored' : 'Copy Protocol'}
                      </Button>
                      <Button 
                        asChild
                        size="sm"
                        className="flex-1 sm:flex-none rounded-xl text-[10px] font-bold uppercase tracking-widest gap-2"
                      >
                        <a href={`mailto:support@${item.title?.split(' ')[0].toLowerCase()}.com?subject=Account Optimization: ${item.title}&body=${encodeURIComponent(item.copyableMessage)}`}>
                          Execute Protocol
                        </a>
                      </Button>
                    </div>
                  </div>
                  <div className="p-6 rounded-2xl bg-black/20 border border-white/5 text-sm md:text-base font-medium italic text-muted-foreground leading-relaxed">
                    "{item.copyableMessage}"
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <footer className="pt-24 border-t border-white/5 flex flex-col items-center text-center gap-8">
          <div className="space-y-2">
            <h3 className="text-3xl font-bold font-headline">Audit complete.</h3>
            <p className="text-muted-foreground font-medium max-w-sm">Ledger updated with detected optimizations.</p>
          </div>
          <Button asChild variant="outline" className="h-14 px-8 rounded-2xl font-bold uppercase tracking-widest text-[10px] border-white/10 hover:bg-white/5">
            <Link href="/dashboard">Return to Operator</Link>
          </Button>
        </footer>
      </main>
    </div>
  );
}
