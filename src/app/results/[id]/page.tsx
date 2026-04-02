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
  ExternalLink,
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
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }} 
          transition={{ duration: 2, repeat: Infinity }}
          className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center"
        >
          <Zap className="w-8 h-8 text-primary animate-pulse" />
        </motion.div>
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
          <Link href="/" className="inline-flex items-center text-[10px] font-bold text-muted-foreground hover:text-white transition-all uppercase tracking-[0.2em] group">
            <ChevronLeft className="w-3 h-3 mr-2 group-hover:-translate-x-1 transition-transform" />
            New Audit
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-12">
            <div className="space-y-6 max-w-2xl">
              <div className="flex items-center gap-4">
                <Badge className="bg-success/10 text-success border-success/10 rounded-full px-4 py-1 text-[10px] font-bold uppercase tracking-widest">
                  Hunt Complete
                </Badge>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  {new Date(analysis.analysisDate).toLocaleDateString()}
                </span>
              </div>
              <h1 className="text-6xl md:text-8xl font-bold font-headline leading-[0.9]">{analysis.title}</h1>
              <p className="text-2xl text-muted-foreground leading-relaxed font-medium">{analysis.summary}</p>
            </div>
            
            <div className="premium-card bg-success !p-12 flex flex-col justify-center items-center text-background text-center min-w-[320px] shadow-[0_32px_64px_-12px_rgba(57,217,138,0.3)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-60 mb-2">Monthly reclaimed</p>
              <p className="text-8xl font-bold font-headline leading-none">${analysis.estimatedMonthlySavings?.toFixed(0)}</p>
            </div>
          </div>
        </header>

        {/* Action Engine Grid */}
        <section className="space-y-12">
          <h2 className="text-3xl font-bold font-headline flex items-center gap-4">
            <Zap className="w-8 h-8 text-primary" />
            Actionable Intelligence ({items?.length || 0})
          </h2>
          
          <div className="grid gap-12">
            {items?.map((item, i) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="premium-card !p-0 overflow-hidden"
              >
                <div className="p-12 flex flex-col md:flex-row justify-between gap-12">
                  <div className="space-y-8 max-w-2xl">
                    <div className="flex items-center gap-4">
                      <Badge variant={item.urgencyLevel === 'urgent' ? 'destructive' : 'secondary'} className="rounded-full px-4 py-1 text-[8px] font-bold uppercase tracking-widest">
                        {item.urgencyLevel}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.2em]">{item.type.replace('_', ' ')}</span>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-5xl font-bold font-headline">{item.title}</h3>
                      <p className="text-2xl text-muted-foreground font-medium leading-relaxed">"{item.summary}"</p>
                    </div>

                    {item.alternativeSuggestion && (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/10 w-fit">
                          <ArrowRightLeft className="w-4 h-4 text-primary" />
                          <p className="text-sm font-bold text-primary">ALTERNATIVE: {item.alternativeSuggestion}</p>
                        </div>
                        {item.alternativeLink && (
                          <Button variant="link" asChild className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground hover:text-white p-0 h-auto">
                            <a href={item.alternativeLink} target="_blank" rel="noopener noreferrer">
                              Visit Alternative <ExternalLink className="w-3 h-3 ml-2" />
                            </a>
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="text-right space-y-2 shrink-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Estimated Savings</p>
                    <p className="text-6xl font-bold text-success glow-success tracking-tight">${item.estimatedSavings}</p>
                  </div>
                </div>

                {/* Magic Action Area */}
                <div className="bg-white/[0.02] border-t border-white/5 p-12 space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-5 h-5 text-primary" />
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Operator Protocol Draft</p>
                    </div>
                    <div className="flex gap-4">
                      <Button 
                        variant="ghost" 
                        size="lg" 
                        className={cn(
                          "h-14 px-8 text-[10px] uppercase font-bold tracking-widest gap-2 rounded-2xl transition-all",
                          copiedId === item.id ? "bg-success/20 text-success" : "bg-white/5"
                        )} 
                        onClick={() => handleCopy(item.copyableMessage, item.id)}
                      >
                        {copiedId === item.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copiedId === item.id ? 'Copied' : 'Copy Protocol'}
                      </Button>
                      <Button 
                        asChild
                        size="lg"
                        className="h-14 px-10 rounded-2xl text-[10px] uppercase font-bold tracking-widest gap-2 bg-primary text-background hover:bg-primary/90 shadow-xl shadow-primary/20"
                      >
                        <a href={`mailto:support@${item.title.split(' ')[0].toLowerCase()}.com?subject=Important: Inquiry Regarding ${item.title}&body=${encodeURIComponent(item.copyableMessage)}`}>
                          <Send className="w-4 h-4" />
                          {item.actionLabel || 'Execute Change'}
                        </a>
                      </Button>
                    </div>
                  </div>
                  <div className="p-12 rounded-[32px] bg-black/20 border border-white/5 text-xl font-medium italic text-muted-foreground/80 leading-relaxed shadow-inner">
                    "{item.copyableMessage}"
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Final Footer Call to Action */}
        <footer className="pt-32 border-t border-white/5 flex flex-col items-center gap-12 text-center">
          <div className="space-y-4">
            <h3 className="text-5xl font-bold font-headline">Audit finalized.</h3>
            <p className="text-2xl text-muted-foreground max-w-xl mx-auto">Your total monthly liquidity has been increased by ${analysis.estimatedMonthlySavings?.toFixed(0)}.</p>
          </div>
          <Button asChild className="h-20 px-16 rounded-full text-xl font-bold shadow-2xl shadow-primary/20">
            <Link href="/dashboard">Return to Operator</Link>
          </Button>
        </footer>
      </main>
    </div>
  );
}