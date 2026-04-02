"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { AnalysisService } from '@/services/analysis-service';
import { useFirestore, useUser, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Loader2, Zap, Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export function MoneySaver() {
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();

  const handleSaveMoney = async () => {
    if (!user || !db || !text) {
      if (!user) router.push('/login');
      return;
    }
    setLoading(true);

    try {
      const result = await AnalysisService.analyze({ 
        documentText: text,
        source: 'pasted_text'
      });

      const analysesRef = collection(db, 'users', user.uid, 'analyses');
      const docRef = await addDocumentNonBlocking(analysesRef, {
        userId: user.uid,
        title: result.title,
        summary: result.summary,
        estimatedMonthlySavings: result.savingsEstimate,
        analysisDate: new Date().toISOString(),
        status: 'completed',
        inputMethod: 'savings_dashboard',
        inputContent: text,
        beforeComparison: JSON.stringify(result.beforeAfterComparison),
        createdAt: serverTimestamp(),
        source: 'pasted_text'
      });

      if (docRef) {
        const itemsRef = collection(db, 'users', user.uid, 'analyses', docRef.id, 'detected_items');
        for (const item of result.detectedItems) {
          addDocumentNonBlocking(itemsRef, {
            ...item,
            userId: user.uid,
            analysisId: docRef.id,
          });
        }
        router.push(`/results/${docRef.id}`);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card className="premium-card !p-0 overflow-hidden border-primary/20 shadow-[0_64px_128px_-12px_rgba(148,148,247,0.15)] bg-card/50 backdrop-blur-xl">
        <Textarea 
          placeholder="Paste bank statement logs, renewal receipts, or just list your subscriptions here (e.g., Netflix $19.99)..." 
          className="min-h-[400px] border-0 focus-visible:ring-0 p-12 text-2xl leading-relaxed bg-transparent resize-none font-medium placeholder:text-muted-foreground/20"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="p-8 bg-white/[0.02] border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
            <Sparkles className="w-4 h-4 text-primary" />
            Llama 3 Auditing Active
          </div>
          <Button 
            disabled={!text || loading}
            onClick={handleSaveMoney}
            className="w-full md:w-auto h-20 px-16 rounded-[24px] text-xl font-bold shadow-2xl shadow-primary/20 group transition-all hover:scale-[1.02]"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin mr-3" />
            ) : (
              <Zap className="w-6 h-6 mr-3 text-background fill-background group-hover:scale-110 transition-transform" />
            )}
            {loading ? 'Auditing...' : 'Analyze & Save Money'}
            {!loading && <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />}
          </Button>
        </div>
      </Card>
    </div>
  );
}