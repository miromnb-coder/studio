
"use client";

import { useState, useRef, useEffect, Suspense } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { 
  Send, 
  Plus, 
  ImageIcon, 
  Zap, 
  CheckCircle2,
  ChevronRight,
  Loader2,
  AlertCircle,
  MailCheck,
  RefreshCw,
  CalendarDays
} from 'lucide-react';
import { AnalysisService } from '@/services/analysis-service';
import { MemoryService } from '@/services/memory-service';
import { GmailService } from '@/services/gmail-service';
import { DigestService } from '@/services/digest-service';
import { useFirestore, useUser, addDocumentNonBlocking, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, serverTimestamp, doc, updateDoc, query, orderBy, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RichAnalysisCard } from '@/components/chat/RichAnalysisCard';
import { DailyDigestCard } from '@/components/chat/DailyDigestCard';
import { OnboardingOverlay } from '@/components/onboarding/OnboardingOverlay';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'analysis_result' | 'daily_digest' | 'error' | 'system';
  data?: any;
  timestamp: any;
}

const STEPS = [
  { id: 'ingest', label: 'Processing intent...', duration: 400 },
  { id: 'scan', label: 'Analyzing with intelligence...', duration: 600 },
  { id: 'action', label: 'Consulting memory ledger...', duration: 500 },
];

function ChatContent() {
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isSyncingEmail, setIsSyncingEmail] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationId = searchParams?.get('c');
  const { toast } = useToast();

  const [localMessages, setLocalMessages] = useState<Message[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const messagesQuery = useMemoFirebase(() => {
    try {
      if (!db || !user || !conversationId) return null;
      return query(
        collection(db, 'users', user.uid, 'conversations', conversationId, 'messages'),
        orderBy('timestamp', 'asc')
      );
    } catch (e) {
      return null;
    }
  }, [db, user, conversationId]);

  const { data: storedMessages } = useCollection(messagesQuery);

  const memoryRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid, 'memory', 'main');
  }, [db, user]);
  
  const { data: userMemory } = useDoc(memoryRef);

  useEffect(() => {
    if (!mounted) return;

    if (Array.isArray(storedMessages) && storedMessages.length > 0) {
      const validMessages = storedMessages.filter(m => m && m.id && (m.content || m.data));
      setLocalMessages(validMessages);
      setShowOnboarding(false);
    } else if (!conversationId) {
      setLocalMessages([{
        id: 'welcome',
        role: 'assistant',
        content: "Operator active. How can I assist you today?",
        timestamp: null,
      }]);
      setShowOnboarding(true);
    }
  }, [storedMessages, conversationId, mounted]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [localMessages, isProcessing, isSyncingEmail]);

  if (mounted && !isUserLoading && !user) {
    router.push('/login');
    return null;
  }

  const generateDailyBriefing = async () => {
    if (!user || !db) return;
    setIsProcessing(true);
    
    try {
      const digest = await DigestService.generateDigest(db, user.uid);
      
      if (!digest) {
        toast({ title: "No New Data", description: "I haven't identified enough new patterns today for a full briefing." });
        setIsProcessing(false);
        return;
      }

      // Add digest to chat
      const activeConvId = conversationId || await createNewConversation();
      
      const assistantMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        role: 'assistant',
        content: "I have synthesized your Daily Intelligence Briefing. Here are today's most actionable optimizations.",
        type: 'daily_digest',
        data: digest,
        timestamp: new Date(),
      };

      addDocumentNonBlocking(collection(db, 'users', user.uid, 'conversations', activeConvId, 'messages'), {
        ...assistantMessage,
        timestamp: serverTimestamp(),
      });

    } catch (err) {
      console.error('Digest Generation Error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const createNewConversation = async () => {
    if (!user || !db) return '';
    const newConvRef = doc(collection(db, 'users', user.uid, 'conversations'));
    await setDoc(newConvRef, {
      userId: user.uid,
      title: 'Audit Session',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    router.push(`/?c=${newConvRef.id}`);
    return newConvRef.id;
  };

  const syncGmailIntelligence = async () => {
    if (!user || !db) return;
    
    setIsSyncingEmail(true);
    const token = await GmailService.connect();
    
    if (!token) {
      setIsSyncingEmail(false);
      toast({ variant: "destructive", title: "Sync Failed", description: "Could not connect to Gmail protocol." });
      return;
    }

    try {
      const emails = await GmailService.fetchFinancialEmails(token);
      
      if (emails.length === 0) {
        setIsSyncingEmail(false);
        toast({ title: "Scan Complete", description: "No new financial patterns detected in your inbox." });
        return;
      }

      const emailContext = `GMAIL INTELLIGENCE FEED:\n` + emails.map(e => `[FROM: ${e.from} | SUBJ: ${e.subject}] Snippet: ${e.snippet}`).join('\n---\n');
      await sendMessage(`[SYSTEM] Synchronizing intelligence from ${emails.length} financial markers in Gmail.`, undefined, emailContext);

    } catch (err) {
      console.error('Gmail Sync Error:', err);
    } finally {
      setIsSyncingEmail(false);
    }
  };

  const handleOnboardingGoal = (goal: string) => {
    setShowOnboarding(false);
    if (goal === 'save_money') setInput("I want to save money on my recurring expenses.");
    if (goal === 'save_time') setInput("Help me optimize my daily administrative tasks.");
    if (goal === 'analyze_visual') setInput("I have a screenshot of a receipt or statement to analyze.");
  };

  const sendMessage = async (text?: string, fileData?: string, rawContext?: string) => {
    const content = text || input;
    if (!content && !fileData && !rawContext) return;
    if (!user || !db) return;

    let activeConvId = conversationId;
    
    if (!activeConvId) {
      activeConvId = await createNewConversation();
    }

    const userMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      role: 'user',
      content: content.startsWith('[SYSTEM]') ? 'Gmail Intelligence Sync' : (content || 'Source uploaded'),
      timestamp: new Date(),
    };

    addDocumentNonBlocking(collection(db, 'users', user.uid, 'conversations', activeConvId!, 'messages'), {
      ...userMessage,
      timestamp: serverTimestamp(),
    });

    setInput('');
    setIsProcessing(true);
    setCurrentStep(0);

    try {
      const history = (Array.isArray(localMessages) ? localMessages : [])
        .filter(m => m && m.content)
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content }));

      for (let i = 0; i < STEPS.length; i++) {
        await new Promise(r => setTimeout(r, STEPS[i].duration));
        setCurrentStep(i + 1);
      }

      const result = await AnalysisService.analyze({ 
        documentText: rawContext || content,
        imageDataUri: fileData,
        history,
        userMemory: userMemory || null
      });

      if (localMessages.length <= 2 && result?.title) {
        updateDoc(doc(db, 'users', user.uid, 'conversations', activeConvId!), {
          title: result.title,
          updatedAt: serverTimestamp(),
        });
      }

      if (result?.memoryUpdates) {
        MemoryService.updateMemory(db, user.uid, result.memoryUpdates);
      }

      const assistantMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        role: 'assistant',
        content: result?.summary || "Analysis complete.",
        type: result?.isActionable ? 'analysis_result' : 'text',
        data: result || null,
        timestamp: new Date(),
      };

      addDocumentNonBlocking(collection(db, 'users', user.uid, 'conversations', activeConvId!, 'messages'), {
        ...assistantMessage,
        timestamp: serverTimestamp(),
      });

      if (result?.isActionable) {
        const docRef = await addDocumentNonBlocking(collection(db, 'users', user.uid, 'analyses'), {
          userId: user.uid,
          title: result.title || "Audit Report",
          summary: result.summary || "",
          estimatedMonthlySavings: result.savingsEstimate || 0,
          analysisDate: new Date().toISOString(),
          status: 'completed',
          inputMethod: 'chat',
          inputContent: rawContext || content,
          createdAt: serverTimestamp(),
          source: 'chat'
        });

        if (docRef && Array.isArray(result.detectedItems)) {
          const itemsRef = collection(db, 'users', user.uid, 'analyses', docRef.id, 'detected_items');
          for (const item of result.detectedItems) {
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
    } catch (err) {
      console.error('Processing error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => sendMessage(undefined, reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background relative overflow-hidden">
      <Navbar />

      <AnimatePresence>
        {showOnboarding && <OnboardingOverlay onSelectGoal={handleOnboardingGoal} />}
      </AnimatePresence>
      
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto pt-24 pb-40 px-6 md:px-12 lg:px-24 xl:px-48 space-y-12"
      >
        <AnimatePresence initial={false}>
          {mounted && (Array.isArray(localMessages) ? localMessages : [])
            .filter(msg => msg && msg.id)
            .map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("flex w-full", msg.role === 'user' ? "justify-end" : "justify-start")}
            >
              <div className={cn("max-w-[90%] md:max-w-[80%] space-y-4", msg.role === 'user' ? "items-end text-right" : "items-start text-left")}>
                <div className={cn(
                  "p-5 rounded-[24px] text-sm md:text-base leading-relaxed font-medium shadow-sm",
                  msg.role === 'user' ? "bg-primary text-background rounded-tr-none" : "bg-white/[0.03] border border-white/5 text-foreground rounded-tl-none"
                )}>
                  {msg.content}
                </div>

                {msg.type === 'analysis_result' && msg.data && (
                  <RichAnalysisCard data={msg.data} />
                )}

                {msg.type === 'daily_digest' && msg.data && (
                  <DailyDigestCard digest={msg.data} />
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {(isProcessing || isSyncingEmail) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-start space-y-6">
            <div className="flex items-center gap-3 p-5 rounded-[24px] bg-white/[0.03] border border-white/5 rounded-tl-none">
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
              <span className="text-sm font-medium text-muted-foreground italic">
                {isSyncingEmail ? "Synchronizing Gmail Intelligence..." : "Processing intelligence..."}
              </span>
            </div>
            {!isSyncingEmail && (
              <div className="w-full max-w-xs space-y-4 pl-4 border-l-2 border-white/5">
                {STEPS.map((step, idx) => (
                  <div key={step.id} className={cn("flex items-center gap-3 transition-all duration-500", currentStep >= idx ? "opacity-100" : "opacity-20")}>
                    <div className={cn("w-4 h-4 rounded-full flex items-center justify-center transition-all", currentStep > idx ? "bg-success scale-110" : currentStep === idx ? "bg-primary animate-pulse" : "bg-white/10")}>
                      {currentStep > idx && <CheckCircle2 className="w-3 h-3 text-background" />}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{step.label}</span>
                  </div>
                ))}
              </div>
            )}
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
              <DropdownMenuContent align="start" className="w-64 bg-card border-white/10 rounded-2xl p-2 mb-4">
                <DropdownMenuItem onClick={generateDailyBriefing} className="rounded-xl h-11 cursor-pointer gap-3">
                  <CalendarDays className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm text-white">Generate Daily Briefing</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={syncGmailIntelligence} className="rounded-xl h-11 cursor-pointer gap-3">
                  <MailCheck className="w-4 h-4 text-accent" />
                  <span className="font-medium text-sm text-white">Sync Gmail Intelligence</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="rounded-xl h-11 cursor-pointer gap-3">
                  <ImageIcon className="w-4 h-4 text-success" />
                  <span className="font-medium text-sm text-white">Upload visual source</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/')} className="rounded-xl h-11 cursor-pointer gap-3">
                  <RefreshCw className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-sm text-white">New session</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <input type="file" className="hidden" ref={fileInputRef} accept="image/*" onChange={onFileChange} />

            <Textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Message operator..."
              className="flex-1 border-0 focus-visible:ring-0 bg-transparent min-h-[48px] py-3 text-base font-medium resize-none overflow-hidden text-white"
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
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>}>
      <ChatContent />
    </Suspense>
  );
}
