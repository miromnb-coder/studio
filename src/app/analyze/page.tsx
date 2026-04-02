"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, FileText, Upload, AlertCircle, Loader2, CheckCircle2, Cpu } from 'lucide-react';
import { AnalysisService } from '@/services/analysis-service';
import { useFirestore, useUser, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 'ocr', label: 'Extracting text...', duration: 800 },
  { id: 'patterns', label: 'Identifying charges...', duration: 1200 },
  { id: 'operator', label: 'Optimizing burn rate...', duration: 1000 },
];

export default function AnalyzePage() {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [textInput, setTextInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async () => {
    if (!user || !db) return;
    setLoading(true);
    setCurrentStep(0);
    
    for (let i = 0; i < STEPS.length; i++) {
      await new Promise(r => setTimeout(r, STEPS[i].duration));
      setCurrentStep(i + 1);
    }

    try {
      const result = await AnalysisService.analyze({ 
        documentText: textInput, 
        imageDataUri: preview || undefined 
      });

      const analysesRef = collection(db, 'users', user.uid, 'analyses');
      const docRef = await addDocumentNonBlocking(analysesRef, {
        userId: user.uid,
        title: result.title,
        summary: result.summary,
        estimatedMonthlySavings: result.savingsEstimate,
        analysisDate: new Date().toISOString(),
        status: 'completed',
        inputMethod: textInput ? 'pasted_text' : 'screenshot',
        inputContent: textInput || '',
        beforeComparison: JSON.stringify(result.beforeAfterComparison),
        createdAt: serverTimestamp(),
        source: preview ? 'screenshot' : 'pasted_text'
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
    <div className="min-h-screen bg-background pb-32 md:pt-32">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-8 space-y-24">
        <header className="space-y-4">
          <h1 className="text-6xl md:text-8xl font-bold font-headline leading-[0.9]">Analyze</h1>
          <p className="text-muted-foreground text-xl max-w-md">Provide a source for optimization.</p>
        </header>

        {!loading ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12"
          >
            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-12 h-16 bg-white/5 border border-white/5 p-1 rounded-2xl">
                <TabsTrigger value="upload" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-background transition-all font-bold uppercase tracking-widest text-[10px]">
                  <Camera className="w-4 h-4 mr-2" />
                  Visual
                </TabsTrigger>
                <TabsTrigger value="text" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-background transition-all font-bold uppercase tracking-widest text-[10px]">
                  <FileText className="w-4 h-4 mr-2" />
                  Textual
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload">
                <div className="premium-card border-dashed border-2 min-h-[400px] flex flex-col items-center justify-center relative group overflow-hidden">
                  {preview ? (
                    <div className="w-full h-full flex flex-col items-center">
                      <img src={preview} alt="Preview" className="max-h-[300px] rounded-xl object-contain mb-8" />
                      <Button variant="ghost" size="sm" onClick={() => { setFile(null); setPreview(null); }} className="text-danger hover:text-danger hover:bg-danger/10 uppercase tracking-widest text-[10px] font-bold">
                        Discard
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
                      <div className="flex flex-col items-center text-center p-12 space-y-8">
                        <div className="w-24 h-24 rounded-[32px] bg-primary/5 flex items-center justify-center text-primary transition-transform duration-500 group-hover:scale-110">
                          <Upload className="w-10 h-10" />
                        </div>
                        <div className="space-y-2">
                          <p className="text-3xl font-bold font-headline">Drop or Click</p>
                          <p className="text-muted-foreground uppercase tracking-[0.2em] text-[10px] font-bold">Statement Screenshots</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="text">
                <Card className="premium-card !p-0 overflow-hidden">
                  <Textarea 
                    placeholder="Paste statement logs or notes..." 
                    className="min-h-[400px] border-0 focus-visible:ring-0 p-12 text-2xl leading-relaxed bg-transparent resize-none font-medium"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                  />
                </Card>
              </TabsContent>
            </Tabs>

            <Button 
              className="w-full h-20 rounded-[32px] text-xl font-bold shadow-2xl shadow-primary/20"
              disabled={!textInput && !file}
              onClick={handleSubmit}
            >
              Start Analysis
            </Button>
          </motion.div>
        ) : (
          <Card className="premium-card py-32 flex flex-col items-center justify-center space-y-16">
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="w-32 h-32 rounded-full border-2 border-primary/10 border-t-primary"
              />
              <Cpu className="w-10 h-10 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>

            <div className="w-full max-w-sm space-y-8">
              {STEPS.map((step, idx) => (
                <motion.div 
                  key={step.id}
                  initial={{ opacity: 0.2 }}
                  animate={{ 
                    opacity: currentStep >= idx ? 1 : 0.2,
                    x: currentStep === idx ? 8 : 0
                  }}
                  className="flex items-center gap-6"
                >
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-500",
                    currentStep > idx ? "bg-success text-background" : 
                    currentStep === idx ? "bg-primary text-background" : "border-2 border-white/10"
                  )}>
                    {currentStep > idx && <CheckCircle2 className="w-4 h-4" />}
                  </div>
                  <span className={cn(
                    "text-lg font-bold tracking-tight transition-colors",
                    currentStep === idx ? 'text-primary' : 'text-muted-foreground'
                  )}>
                    {step.label}
                  </span>
                </motion.div>
              ))}
            </div>
          </Card>
        )}

        <div className="p-8 rounded-[32px] bg-white/[0.02] border border-white/5 flex gap-6 text-sm text-muted-foreground leading-relaxed">
          <AlertCircle className="w-6 h-6 text-primary shrink-0" />
          <p>
            Your data is encrypted and used only for extraction. All processing happens within your secure sandbox.
          </p>
        </div>
      </main>
    </div>
  );
}
