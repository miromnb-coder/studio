"use client";

import { useState, useRef, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { 
  Send, 
  Plus, 
  Paperclip, 
  Image as ImageIcon, 
  FileText, 
  Zap, 
  Sparkles,
  ArrowRight,
  Cpu,
  Loader2,
  CheckCircle2,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import { AnalysisService } from '@/services/analysis-service';
import { useFirestore, useUser, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'analysis_result';
  data?: any;
  timestamp: Date;
}

const STEPS = [
  { id: 'ingest', label: 'Ingesting data protocol...', duration: 1000 },
  { id: 'scan', label: 'Scanning for predatory patterns...', duration: 1500 },
  { id: 'action', label: 'Compiling actionable ledger...', duration: 1200 },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Operator active. How can I assist your liquidity today? Type 'save me money' or upload a statement to begin audit.",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isProcessing]);

  const handleSend = async (text?: string, fileData?: string) => {
    const content = text || input;
    if (!content && !fileData) return;
    if (!user || !db) return;

    const userMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      role: 'user',
      content: content || 'Analyzing file...',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    
    // Check if intent is "save money" or audit
    const isAuditIntent = content.toLowerCase().includes('save') || content.toLowerCase().includes('money') || content.toLowerCase().includes('audit') || fileData;

    if (isAuditIntent) {
      setIsProcessing(true);
      setCurrentStep(0);

      // Simulate steps
      for (let i = 0; i < STEPS.length; i++) {
        await new Promise(r => setTimeout(r, STEPS[i].duration));
        setCurrentStep(i + 1);
      }

      try {
        const result = await AnalysisService.analyze({ 
          documentText: content,
          imageDataUri: fileData 
        });

        // Save to Firestore
        const analysesRef = collection(db, 'users', user.uid, 'analyses');
        const docRef = await addDocumentNonBlocking(analysesRef, {
          userId: user.uid,
          title: result.title,
          summary: result.summary,
          estimatedMonthlySavings: result.savingsEstimate,
          analysisDate: new Date().toISOString(),
          status: 'completed',
          inputMethod: fileData ? 'screenshot' : 'chat',
          inputContent: content,
          createdAt: serverTimestamp(),
          source: fileData ? 'screenshot' : 'chat'
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
        }

        const assistantMessage: Message = {
          id: Math.random().toString(36).substr(2, 9),
          role: 'assistant',
          content: `Audit complete. Identified $${result.savingsEstimate}/mo in potential reclaimed liquidity.`,
          type: 'analysis_result',
          data: { ...result, analysisId: docRef?.id },
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      } catch (err) {
        console.error(err);
        setMessages(prev => [...prev, {
          id: 'err',
          role: 'assistant',
          content: "Audit protocol failed. Please re-provide data source.",
          timestamp: new Date(),
        }]);
      } finally {
        setIsProcessing(false);
      }
    } else {
      // Normal conversational response
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: Math.random().toString(36).substr(2, 9),
          role: 'assistant',
          content: "Understood. I'm monitoring your financial flow. You can use 'audit ledger' to see past records or 'console' for the dashboard.",
          timestamp: new Date(),
        }]);
      }, 1000);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleSend(undefined, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <Navbar />
      
      {/* Chat Thread */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto pt-24 pb-32 px-6 md:px-12 lg:px-24 xl:px-48 space-y-12"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex w-full",
                msg.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              <div className={cn(
                "max-w-[85%] md:max-w-[70%] space-y-4",
                msg.role === 'user' ? "items-end" : "items-start"
              )}>
                <div className={cn(
                  "p-5 rounded-[24px] text-sm md:text-base leading-relaxed font-medium",
                  msg.role === 'user' 
                    ? "bg-primary text-background rounded-tr-none shadow-xl shadow-primary/10" 
                    : "bg-white/[0.03] border border-white/5 text-foreground rounded-tl-none"
                )}>
                  {msg.content}
                </div>

                {msg.type === 'analysis_result' && msg.data && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="grid gap-4 mt-6"
                  >
                    <div className="premium-card bg-primary/10 border-primary/20 flex justify-between items-center">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Monthly Reclaimed</p>
                        <p className="text-4xl font-bold font-headline text-primary">${msg.data.savingsEstimate}</p>
                      </div>
                      <Button asChild size="sm" variant="outline" className="rounded-xl border-primary/20 hover:bg-primary/10 text-primary">
                        <a href={`/results/${msg.data.analysisId}`}>View Full Ledger</a>
                      </Button>
                    </div>

                    <div className="grid gap-3">
                      {msg.data.detectedItems.slice(0, 2).map((item: any, idx: number) => (
                        <div key={idx} className="premium-card !p-4 bg-white/[0.02] flex items-center justify-between group hover:bg-white/[0.04]">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground group-hover:text-primary">
                              <Zap className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-sm font-bold">{item.title}</p>
                              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">-${item.estimatedSavings}/mo</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all" />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isProcessing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-start space-y-6"
          >
            <div className="flex items-center gap-3 p-5 rounded-[24px] bg-white/[0.03] border border-white/5 rounded-tl-none">
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
              <span className="text-sm font-medium text-muted-foreground italic">Operator is auditing source...</span>
            </div>
            
            <div className="w-full max-w-xs space-y-4 pl-4 border-l-2 border-white/5">
              {STEPS.map((step, idx) => (
                <div 
                  key={step.id}
                  className={cn(
                    "flex items-center gap-3 transition-all duration-500",
                    currentStep >= idx ? "opacity-100" : "opacity-20"
                  )}
                >
                  <div className={cn(
                    "w-4 h-4 rounded-full flex items-center justify-center",
                    currentStep > idx ? "bg-success" : currentStep === idx ? "bg-primary animate-pulse" : "bg-white/10"
                  )}>
                    {currentStep > idx && <CheckCircle2 className="w-3 h-3 text-background" />}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{step.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Bar */}
      <div className="fixed bottom-0 right-0 left-0 lg:left-[var(--sidebar-width)] p-6 md:p-10 pointer-events-none">
        <div className="max-w-4xl mx-auto w-full pointer-events-auto">
          <Card className="glass !p-2 flex items-end gap-2 rounded-[32px] border-white/10 shadow-[0_24px_64px_-12px_rgba(0,0,0,0.5)]">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="w-12 h-12 rounded-full hover:bg-white/5 text-muted-foreground">
                  <Plus className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 bg-surface border-white/10 rounded-2xl p-2 mb-4">
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="rounded-xl h-11 cursor-pointer gap-3">
                  <ImageIcon className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">Upload Screenshot</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setInput('Audit my subscriptions from this text:')} className="rounded-xl h-11 cursor-pointer gap-3">
                  <FileText className="w-4 h-4 text-accent" />
                  <span className="font-medium text-sm">Paste Bank Log</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/dashboard')} className="rounded-xl h-11 cursor-pointer gap-3">
                  <Zap className="w-4 h-4 text-success" />
                  <span className="font-medium text-sm">Open Console</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              accept="image/*"
              onChange={onFileChange}
            />

            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Command your operator..."
              className="flex-1 border-0 focus-visible:ring-0 bg-transparent h-12 text-base font-medium"
            />

            <Button 
              size="icon" 
              disabled={!input || isProcessing}
              onClick={() => handleSend()}
              className="w-12 h-12 rounded-full shadow-2xl transition-transform hover:scale-105 active:scale-95 shrink-0"
            >
              <Send className="w-5 h-5" />
            </Button>
          </Card>
          <div className="flex justify-center mt-4">
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground/30">
              Encrypted Audit Sandbox Active
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
