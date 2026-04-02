
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, FileText, Upload, AlertCircle, Loader2, Cpu, CheckCircle2 } from 'lucide-react';
import { AnalysisService } from '@/services/analysis-service';
import { useFirestore, useUser, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 'ingest', label: 'Ingesting data protocol...', duration: 1000 },
  { id: 'scan', label: 'Scanning for predatory patterns...', duration: 1500 },
  { id: 'action', label: 'Compiling actionable ledger...', duration: 1200 },
];

export default function AnalyzePage() {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [textInput, setTextInput] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async () => {
    if (!user || !db) return;
    setLoading(true);
    setCurrentStep(0);
    
    // Simulate agent steps
    for (let i = 0; i < STEPS.length; i++) {
      await new Promise(r => setTimeout(r, STEPS[i].duration));
      setCurrentStep(i + 1);
    }

    try {
      const result = await AnalysisService.analyze({ 
        documentText: textInput, 
        imageDataUri: preview || undefined 
      });

      if (!result || !result.title) {
        throw new Error("Invalid analysis output");
      }

      const analysesRef = collection(db, 'users', user.uid, 'analyses');
      const docRef = await addDocumentNonBlocking(analysesRef, {
        userId: user.uid,
        title: result.title,
        summary: result.summary,
        estimatedMonthlySavings: result.savingsEstimate || 0,
        analysisDate: new Date().toISOString(),
        status: 'completed',
        inputMethod: textInput ? 'pasted_text' : 'screenshot',
        inputContent: textInput || '',
        beforeComparison: result.beforeAfterComparison ? JSON.stringify(result.beforeAfterComparison) : null,
        createdAt: serverTimestamp(),
        source: preview ? 'screenshot' : 'pasted_text'
      });

      if (docRef) {
        const itemsRef = collection(db, 'users', user.uid, 'analyses', docRef.id, 'detected_items');
        for (const item of (result.detectedItems || [])) {
          if (item && item.title) {
            addDocumentNonBlocking(itemsRef, {
              ...item,
              userId: user.uid,
              analysisId: docRef.id,
            });
          }
        }
        router.push(`/results/${docRef.id}`);
      }
    } catch (err) {
      console.error('Analysis failed:', err);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-32 pb-32">
      <Navbar />
      
      <main className="max-w-2xl mx-auto px-6 space-y-12">
        <header className="space-y-4 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold font-headline tracking-tighter"
          >
            Audit Intent
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground font-medium"
          >
            Provide a source for the operator to analyze.
          </motion.p>
        </header>

        {!loading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            <Tabs defaultValue="text" className="w-full">
              <TabsList className="grid w-full grid-cols-2 p-1 bg-white/5 rounded-2xl mb-8">
                <TabsTrigger value="text" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-background font-bold uppercase tracking-widest text-[10px]">
                  <FileText className="w-3 h-3 mr-2" />
                  Text Source
                </TabsTrigger>
                <TabsTrigger value="upload" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-background font-bold uppercase tracking-widest text-[10px]">
                  <Camera className="w-3 h-3 mr-2" />
                  Visual Source
                </TabsTrigger>
              </TabsList>

              <TabsContent value="text">
                <Card className="premium-card !p-0 overflow-hidden bg-white/[0.02]">
                  <Textarea 
                    placeholder="Paste bank logs, receipts, or notes..." 
                    className="min-h-[300px] border-0 focus-visible:ring-0 p-8 text-xl leading-relaxed bg-transparent resize-none font-medium placeholder:text-muted-foreground/20"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                  />
                </Card>
              </TabsContent>

              <TabsContent value="upload">
                <div className="premium-card border-dashed border-2 border-white/10 min-h-[300px] flex flex-col items-center justify-center relative group">
                  {preview ? (
                    <div className="w-full h-full p-4 flex flex-col items-center">
                      <img src={preview} alt="Preview" className="max-h-[200px] rounded-xl object-contain mb-4" />
                      <Button variant="ghost" size="sm" onClick={() => setPreview(null)} className="text-danger hover:text-danger hover:bg-danger/10 text-[10px] font-bold uppercase tracking-widest">
                        Discard Image
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Input
                        type="file"
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        onChange={handleFileChange}
                        accept="image/*"
                      />
                      <div className="flex flex-col items-center text-center p-8 space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                          <Upload className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-bold text-lg">Drop screenshot</p>
                          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Statement or Receipt</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <Button 
              className="w-full h-16 rounded-2xl text-lg font-bold shadow-2xl transition-all hover:scale-[1.01] active:scale-[0.99]"
              disabled={!textInput && !preview}
              onClick={handleSubmit}
            >
              Run AI Operator
            </Button>
          </motion.div>
        ) : (
          <Card className="premium-card py-20 flex flex-col items-center justify-center space-y-12">
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="w-24 h-24 rounded-full border-2 border-primary/10 border-t-primary"
              />
              <Cpu className="w-8 h-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>

            <div className="w-full max-w-xs space-y-6">
              {STEPS.map((step, idx) => (
                <motion.div 
                  key={step.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: currentStep >= idx ? 1 : 0.2 }}
                  className="flex items-center gap-4"
                >
                  <div className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center transition-colors",
                    currentStep > idx ? "bg-success text-background" : 
                    currentStep === idx ? "bg-primary text-background" : "border border-white/10"
                  )}>
                    {currentStep > idx && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                  <span className={cn(
                    "text-sm font-bold tracking-tight",
                    currentStep === idx ? 'text-primary' : 'text-muted-foreground'
                  )}>
                    {step.label}
                  </span>
                </motion.div>
              ))}
            </div>
          </Card>
        )}

        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex gap-4 text-xs text-muted-foreground leading-relaxed">
          <AlertCircle className="w-4 h-4 text-primary shrink-0" />
          <p>
            Operating within secure logic sandbox. Your data is encrypted and used only for extraction.
          </p>
        </div>
      </main>
    </div>
  );
}
