
"use client";

import { useState, useRef, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { 
  Send, 
  Plus, 
  Image as ImageIcon, 
  FileText, 
  Zap, 
  CheckCircle2,
  ChevronRight,
  Loader2,
  AlertCircle,
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
  type?: 'text' | 'analysis_result' | 'error';
  data?: any;
  timestamp: Date;
}

const STEPS = [
  { id: 'ingest', label: 'Ingesting intent...', duration: 500 },
  { id: 'scan', label: 'Processing intelligence...', duration: 800 },
  { id: 'action', label: 'Finalizing protocol...', duration: 600 },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Operator active. I am monitoring for predatory patterns and assisting with your life optimization. How can I help you today?",
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

  const sendMessage = async (text?: string, fileData?: string) => {
    const content = text || input;
    if (!content && !fileData) return;

    if (!user || !db) {
      setMessages(prev => [...prev, {
        id: Math.random().toString(36).substr(2, 9),
        role: 'assistant',
        content: "Identity verification required. Please sign in to access the secure audit sandbox.",
        timestamp: new Date(),
      }]);
      return;
    }

    const userMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      role: 'user',
      content: content || 'Source uploaded for analysis.',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);
    setCurrentStep(0);

    try {
      // Simulation for "Agentic" feel
      for (let i = 0; i < STEPS.length; i++) {
        await new Promise(r => setTimeout(r, STEPS[i].duration));
        setCurrentStep(i + 1);
      }

      const result = await AnalysisService.analyze({ 
        documentText: content,
        imageDataUri: fileData 
      });

      let analysisId = null;

      // Only persist to Firestore if it's an actionable financial audit
      if (result.isActionable) {
        const analysesRef = collection(db, 'users', user.uid, 'analyses');
        const docRef = await addDocumentNonBlocking(analysesRef, {
          userId: user.uid,
          title: result.title,
          summary: result.summary,
          estimatedMonthlySavings: result.savingsEstimate || 0,
          analysisDate: new Date().toISOString(),
          status: 'completed',
          inputMethod: fileData ? 'screenshot' : 'chat',
          inputContent: content,
          createdAt: serverTimestamp(),
          source: fileData ? 'screenshot' : 'chat'
        });

        if (docRef) {
          analysisId = docRef.id;
          const itemsRef = collection(db, 'users', user.uid, 'analyses', docRef.id, 'detected_items');
          for (const item of (result.detectedItems || [])) {
            addDocumentNonBlocking(itemsRef, {
              ...item,
              userId: user.uid,
              analysisId: docRef.id,
              status: 'active',
              createdAt: serverTimestamp(),
            });
          }
        }
      }

      const assistantMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        role: 'assistant',
        content: result.summary,
        type: 'analysis_result',
        data: { ...result, analysisId },
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Operator logic failure:', err);
      setMessages(prev => [...prev, {
        id: 'err-' + Date.now(),
        role: 'assistant',
        type: 'error',
        content: "I encountered an interruption in my logic protocol. Please try again or rephrase your request.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        sendMessage(undefined, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <Navbar />
      
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto pt-24 pb-40 px-6 md:px-12 lg:px-24 xl:px-48 space-y-12"
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
                msg.role === 'user' ? "items-end text-right" : "items-start text-left"
              )}>
                <div className={cn(
                  "p-5 rounded-[24px] text-sm md:text-base leading-relaxed font-medium shadow-sm",
                  msg.role === 'user' 
                    ? "bg-primary text-background rounded-tr-none" 
                    : "bg-white/[0.03] border border-white/5 text-foreground rounded-tl-none",
                  msg.type === 'error' && "border-danger/20 bg-danger/5 text-danger"
                )}>
                  {msg.content}
                </div>

                {msg.type === 'analysis_result' && msg.data && msg.data.isActionable && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="grid gap-4 mt-6 w-full"
                  >
                    <div className="premium-card bg-primary/10 border-primary/20 flex justify-between items-center group">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Monthly Potential</p>
                        <p className="text-4xl font-bold font-headline text-primary">${msg.data.savingsEstimate}</p>
                      </div>
                      <Button asChild size="sm" variant="outline" className="rounded-xl border-primary/20 hover:bg-primary/20 text-primary transition-all">
                        <a href={`/results/${msg.data.analysisId}`}>
                          Open Detailed Ledger
                          <ChevronRight className="ml-2 w-3 h-3" />
                        </a>
                      </Button>
                    </div>

                    <div className="grid gap-3">
                      {msg.data.detectedItems?.slice(0, 3).map((item: any, idx: number) => (
                        <div key={idx} className="premium-card !p-4 bg-white/[0.02] flex items-center justify-between group hover:bg-white/[0.04]">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                              <Zap className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-sm font-bold tracking-tight">{item.title}</p>
                              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                Save ${item.estimatedSavings}/mo • {item.urgencyLevel}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0" />
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
              <span className="text-sm font-medium text-muted-foreground italic">Operator is ingesting intent...</span>
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
                    "w-4 h-4 rounded-full flex items-center justify-center transition-all",
                    currentStep > idx ? "bg-success scale-110" : currentStep === idx ? "bg-primary animate-pulse" : "bg-white/10"
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

      <div className="fixed bottom-0 right-0 left-0 lg:left-[var(--sidebar-width)] p-6 md:p-10 pointer-events-none">
        <div className="max-w-4xl mx-auto w-full pointer-events-auto">
          <Card className="glass !p-2 flex items-end gap-2 rounded-[32px] border-white/10 shadow-[0_24px_64px_-12px_rgba(0,0,0,0.5)]">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="w-12 h-12 rounded-full hover:bg-white/5 text-muted-foreground">
                  <Plus className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 bg-card border-white/10 rounded-2xl p-2 mb-4">
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="rounded-xl h-11 cursor-pointer gap-3">
                  <ImageIcon className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">Upload Visual Source</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setInput('Analyze my active subscriptions:')} className="rounded-xl h-11 cursor-pointer gap-3">
                  <FileText className="w-4 h-4 text-accent" />
                  <span className="font-medium text-sm">Paste Bank Log</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setInput('How can I save money this month?')} className="rounded-xl h-11 cursor-pointer gap-3">
                  <MessageSquare className="w-4 h-4 text-success" />
                  <span className="font-medium text-sm">Ask Savings Advice</span>
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

            <Textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Ask anything or request an audit..."
              className="flex-1 border-0 focus-visible:ring-0 bg-transparent min-h-[48px] py-3 text-base font-medium resize-none overflow-hidden"
              rows={1}
            />

            <Button 
              size="icon" 
              disabled={(!input.trim() && !isProcessing) || isProcessing}
              onClick={() => sendMessage()}
              className="w-12 h-12 rounded-full shadow-2xl transition-transform hover:scale-105 active:scale-95 shrink-0"
            >
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </Card>
          <div className="flex justify-center mt-4 gap-2 items-center">
            <div className="w-1 h-1 bg-success rounded-full animate-pulse" />
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground/30">
              Universal Assistant Active
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
