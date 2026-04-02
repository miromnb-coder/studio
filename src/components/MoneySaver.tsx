"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { AnalysisService } from '@/services/analysis-service';
import { useFirestore, useUser, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { Loader2, Zap, Sparkles } from 'lucide-react';

export function MoneySaver() {
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();

  const handleSaveMoney = async () => {
    if (!user || !db || !text) return;
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
        inputMethod: 'money_saver_tool',
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
      <div className="space-y-2">
        <h2 className="text-3xl font-bold font-headline flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-primary" />
          Money Saver
        </h2>
        <p className="text-muted-foreground font-medium">Paste your bank statement or subscription list below.</p>
      </div>

      <Card className="premium-card !p-0 overflow-hidden border-primary/10 shadow-2xl shadow-primary/5">
        <Textarea 
          placeholder="e.g., Netflix €19.99, Spotify Premium €10.99, Amazon Prime..." 
          className="min-h-[300px] border-0 focus-visible:ring-0 p-8 text-xl leading-relaxed bg-transparent resize-none font-medium placeholder:text-muted-foreground/20"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="p-6 bg-white/[0.02] border-t border-white/5 flex justify-end">
          <Button 
            disabled={!text || loading}
            onClick={handleSaveMoney}
            className="h-14 px-10 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 group"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <Zap className="w-5 h-5 mr-2 text-background fill-background group-hover:scale-110 transition-transform" />
            )}
            {loading ? 'Analyzing...' : 'Save Me Money'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
