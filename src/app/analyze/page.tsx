
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, FileText, Upload, Plus, AlertCircle, Loader2, CheckCircle2, Search, Cpu } from 'lucide-react';
import { AnalysisService } from '@/services/analysis-service';
import { useFirestore, useUser, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

const STEPS = [
  { id: 'ocr', label: 'OCR Engine: Extracting text...', duration: 800 },
  { id: 'patterns', label: 'Pattern Matching: Identifying recurring charges...', duration: 1200 },
  { id: 'operator', label: 'Operator: Calculating monthly optimization...', duration: 1000 },
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
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async () => {
    if (!user || !db) return;
    setLoading(true);
    setCurrentStep(0);
    
    // Simulate the sequence
    for (let i = 0; i < STEPS.length; i++) {
      await new Promise(r => setTimeout(r, STEPS[i].duration));
      setCurrentStep(i + 1);
    }

    try {
      const analysisResult = await AnalysisService.analyze({ 
        documentText: textInput, 
        imageDataUri: preview || undefined 
      });

      const analysesRef = collection(db, 'users', user.uid, 'analyses');
      
      const analysisData = {
        userId: user.uid,
        title: analysisResult.title,
        summary: analysisResult.summary,
        estimatedMonthlySavings: analysisResult.savingsEstimate,
        analysisDate: new Date().toISOString(),
        status: 'completed',
        inputMethod: textInput ? 'pasted_text' : 'screenshot',
        inputContent: textInput || '',
        detectedItemIds: [],
        beforeComparison: JSON.stringify(analysisResult.beforeAfterComparison),
        afterComparison: JSON.stringify(analysisResult.beforeAfterComparison),
        createdAt: serverTimestamp(),
      };

      const docRefPromise = addDocumentNonBlocking(analysesRef, analysisData);
      const docRef = await docRefPromise;

      if (docRef) {
        const itemsRef = collection(db, 'users', user.uid, 'analyses', docRef.id, 'detected_items');
        for (const item of analysisResult.detectedItems) {
          addDocumentNonBlocking(itemsRef, {
            ...item,
            userId: user.uid,
            analysisId: docRef.id,
            status: 'active',
            recommendedActionIds: [],
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
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-3xl mx-auto px-4 py-12 md:py-24">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-12"
        >
          <div className="space-y-4 text-center">
            <h1 className="text-5xl font-bold font-headline">New Analysis</h1>
            <p className="text-muted-foreground text-xl">Upload documents to uncover hidden savings.</p>
          </div>

          {!loading ? (
            <div className="space-y-8">
              <Tabs defaultValue="upload" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8 h-14 bg-white/5 border border-white/5 p-1 rounded-2xl">
                  <TabsTrigger value="upload" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-background transition-all font-bold">
                    <Camera className="w-4 h-4 mr-2" />
                    Screenshot
                  </TabsTrigger>
                  <TabsTrigger value="text" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-background transition-all font-bold">
                    <FileText className="w-4 h-4 mr-2" />
                    Statement Text
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="space-y-6">
                  <div className="premium-card border-dashed border-2 min-h-[350px] flex flex-col items-center justify-center relative group">
                    {preview ? (
                      <div className="w-full h-full p-2 flex flex-col items-center">
                        <img src={preview} alt="Preview" className="max-h-[300px] rounded-xl object-contain mb-4" />
                        <Button variant="ghost" size="sm" onClick={() => { setFile(null); setPreview(null); }} className="rounded-full text-danger hover:text-danger hover:bg-danger/10">
                          Discard file
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
                        <div className="flex flex-col items-center text-center p-8 space-y-6">
                          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500">
                            <Upload className="w-10 h-10" />
                          </div>
                          <div className="space-y-2">
                            <p className="text-2xl font-bold font-headline">Drop screenshot or click</p>
                            <p className="text-muted-foreground">PNG or JPG up to 10MB</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="text" className="space-y-6">
                  <Card className="premium-card overflow-hidden !p-0">
                    <Textarea 
                      placeholder="Paste your statement text here... (e.g. Netflix $15.99, Spotify $11.99...)" 
                      className="min-h-[350px] border-0 focus-visible:ring-0 p-8 text-xl leading-relaxed bg-transparent resize-none"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                    />
                  </Card>
                </TabsContent>
              </Tabs>

              <div className="pt-4">
                <Button 
                  className="w-full h-16 rounded-3xl text-xl font-bold shadow-2xl shadow-primary/20"
                  disabled={!textInput && !file}
                  onClick={handleSubmit}
                >
                  Initiate Analysis
                </Button>
              </div>
            </div>
          ) : (
            <Card className="premium-card py-16 flex flex-col items-center justify-center space-y-12 bg-white/[0.02]">
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="w-24 h-24 rounded-full border-4 border-primary/20 border-t-primary"
                />
                <Cpu className="w-10 h-10 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>

              <div className="w-full max-w-md space-y-6">
                {STEPS.map((step, idx) => (
                  <motion.div 
                    key={step.id}
                    initial={{ opacity: 0.3 }}
                    animate={{ 
                      opacity: currentStep >= idx ? 1 : 0.3,
                      x: currentStep === idx ? 4 : 0
                    }}
                    className="flex items-center gap-4"
                  >
                    {currentStep > idx ? (
                      <CheckCircle2 className="w-6 h-6 text-success" />
                    ) : currentStep === idx ? (
                      <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-white/10" />
                    )}
                    <span className={`text-lg font-medium ${currentStep === idx ? 'text-primary' : 'text-muted-foreground'}`}>
                      {step.label}
                    </span>
                  </motion.div>
                ))}
              </div>
            </Card>
          )}

          <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 flex gap-4 text-sm text-muted-foreground">
            <AlertCircle className="w-6 h-6 text-primary shrink-0" />
            <p className="leading-relaxed">
              Our operator works best with digital receipts, bank screenshots, or manual logs. 
              All data is processed securely and encrypted at rest.
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
