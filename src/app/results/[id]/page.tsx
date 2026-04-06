"use client";

import { useState, useEffect } from 'react';
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
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function ResultsPage() {
  const [mounted, setMounted] = useState(false);
  const { id } = useParams();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCopy = (text: string, id: string) => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const analysisRef = useMemoFirebase(() => {
    try {
      if (!db || !user || !id || isUserLoading) return null;
      return doc(db, 'users', user.uid, 'analyses', id as string);
    } catch (e) {
      console.error('Analysis Ref Error:', e);
      return null;
    }
  }, [db, user, id, isUserLoading]);

  const { data: analysis, isLoading: isAnalysisLoading } = useDoc(analysisRef);

  const itemsRef = useMemoFirebase(() => {
    try {
      if (!db || !user || !id || isUserLoading) return null;
      return collection(db, 'users', user.uid, 'analyses', id as string, 'detected_items');
    } catch (e) {
      console.error('Items Ref Error:', e);
      return null;
    }
  }, [db, user, id, isUserLoading]);

  const { data: items, isLoading: isItemsLoading } = useCollection(itemsRef);

  if (!mounted || isUserLoading || isAnalysisLoading || isItemsLoading) {
    return (
      <div className="min-h-screen bg-[#FBFBFE] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-[#FBFBFE] pt-32 text-center">
        <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">Analysis not found.</p>
        <Button asChild variant="link" className="mt-4">
          <Link href="/dashboard">Return to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-16">
      <header className="space-y-8">
        <Link href="/dashboard" className="inline-flex items-center text-[10px] font-bold text-muted-foreground hover:text-slate-900 uppercase tracking-widest group">
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
                {analysis.analysisDate ? new Date(analysis.analysisDate).toLocaleDateString() : 'Recent'}
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold font-headline tracking-tighter leading-[0.9] text-slate-900">{analysis.title || 'Audit Report'}</h1>
            <p className="text-xl text-muted-foreground font-medium leading-relaxed">{analysis.summary}</p>
          </div>
          
          <div className="premium-card bg-primary text-white p-10 min-w-[280px] flex flex-col items-center justify-center text-center shadow-[0_20px_80px_-15px_rgba(59,130,246,0.4)]">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Monthly Saved</p>
            <p className="text-7xl font-bold font-headline leading-none">${analysis.estimatedMonthlySavings?.toFixed(0) || 0}</p>
          </div>
        </div>
      </header>

      <section className="space-y-8">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <Zap className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold font-headline uppercase tracking-widest text-[12px] text-slate-900">Operator Intelligence ({(items ?? []).length})</h2>
        </div>
        
        <div className="grid gap-8">
          {(items ?? []).map((item, i) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="premium-card !p-0 overflow-hidden border-white shadow-sm"
            >
              <div className="p-8 md:p-10 flex flex-col md:flex-row justify-between gap-8">
                <div className="space-y-6 max-w-xl">
                  <div className="flex items-center gap-3">
                    <Badge variant={item.urgencyLevel === 'urgent' ? 'destructive' : 'secondary'} className="rounded-full px-3 py-0.5 text-[8px] font-bold uppercase tracking-widest shadow-none">
                      {item.urgencyLevel || 'low'}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{item.type?.replace('_', ' ') || 'finding'}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-3xl font-bold font-headline tracking-tight text-slate-900">{item.title}</h3>
                    <p className="text-lg text-muted-foreground font-medium leading-relaxed italic">"{item.summary}"</p>
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
                          className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-slate-900 flex items-center gap-1.5 transition-colors"
                        >
                          Explore Alternative <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}
                </div>

                <div className="md:text-right space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Estimated Impact</p>
                  <p className="text-5xl font-bold text-success font-headline tracking-tight">${item.estimatedSavings || 0}</p>
                </div>
              </div>

              <div className="bg-slate-50 border-t border-slate-100 p-8 md:p-10 space-y-6">
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
                        "flex-1 sm:flex-none rounded-xl text-[10px] font-bold uppercase tracking-widest gap-2 bg-white border-slate-100 shadow-sm",
                        copiedId === item.id ? "bg-success text-white" : ""
                      )} 
                      onClick={() => handleCopy(item.copyableMessage || '', item.id)}
                    >
                      {copiedId === item.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedId === item.id ? 'Stored' : 'Copy Protocol'}
                    </Button>
                    <Button 
                      asChild
                      size="sm"
                      className="flex-1 sm:flex-none rounded-xl text-[10px] font-bold uppercase tracking-widest gap-2 bg-slate-900 text-white shadow-lg shadow-slate-900/20"
                    >
                      <a href={`mailto:support@${item.title?.split(' ')[0].toLowerCase()}.com?subject=Account Optimization: ${item.title}&body=${encodeURIComponent(item.copyableMessage || '')}`}>
                        Execute Protocol
                      </a>
                    </Button>
                  </div>
                </div>
                <div className="p-6 rounded-2xl bg-white border border-slate-100 text-sm md:text-base font-medium italic text-muted-foreground leading-relaxed">
                  "{item.copyableMessage || 'Protocol not generated.'}"
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="pt-24 border-t border-slate-100 flex flex-col items-center text-center gap-8">
        <div className="space-y-2">
          <h3 className="text-3xl font-bold font-headline text-slate-900">Audit complete.</h3>
          <p className="text-muted-foreground font-medium max-w-sm">Ledger updated with detected optimizations.</p>
        </div>
        <Button asChild variant="outline" className="h-14 px-8 rounded-2xl font-bold uppercase tracking-widest text-[10px] border-slate-200 hover:bg-slate-50">
          <Link href="/dashboard" className="text-slate-900">Return to Operator</Link>
        </Button>
      </footer>
    </div>
  );
}
