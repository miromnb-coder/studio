
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
  ChevronRight,
  Loader2,
  AlertCircle,
  MailCheck,
  CalendarDays,
  Cpu,
  BrainCircuit,
  ShieldCheck,
  ListChecks,
  Copy,
  Check,
  RefreshCcw,
  MoreVertical,
  Trash2,
  Archive,
  Edit2,
  ArrowDown
} from 'lucide-react';
import { AnalysisService } from '@/services/analysis-service';
import { MemoryService } from '@/services/memory-service';
import { GmailService } from '@/services/gmail-service';
import { DigestService } from '@/services/digest-service';
import { useFirestore, useUser, addDocumentNonBlocking, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, serverTimestamp, doc, updateDoc, query, orderBy, setDoc, deleteDoc } from 'firebase/firestore';
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
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'analysis_result' | 'daily_digest' | 'error' | 'system' | 'strategy_alert';
  strategy?: string;
  mode?: string;
  data?: any;
  timestamp: any;
}

function ChatContent() {
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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

  const { data: storedMessages, isLoading: isMessagesLoading } = useCollection(messagesQuery);

  const memoryRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid, 'memory', 'main');
  }, [db, user]);
  
  const { data: userMemory } = useDoc(memoryRef);

  useEffect(() => {
    if (!mounted) return;

    if (Array.isArray(storedMessages) && storedMessages.length > 0) {
      const validMessages = storedMessages.filter(m => m && m.id && (m.content || m.data));
      setLocalMessages(validMessages as Message[]);
    } else {
      setLocalMessages([]);
    }
  }, [storedMessages, conversationId, mounted]);

  // Focus textarea on mount and when conversation changes
  useEffect(() => {
    if (mounted && !isProcessing) {
      textareaRef.current?.focus();
    }
  }, [mounted, conversationId, isProcessing]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [localMessages, isProcessing]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 200;
      setShowScrollButton(!isNearBottom);
    }
  };

  if (mounted && !isUserLoading && !user) {
    router.push('/login');
    return null;
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const createNewConversation = async (title = 'New Protocol') => {
    if (!user || !db) return '';
    const newConvRef = doc(collection(db, 'users', user.uid, 'conversations'));
    await setDoc(newConvRef, {
      id: newConvRef.id,
      userId: user.uid,
      title,
      isArchived: false,
      isPinned: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    router.push(`/?c=${newConvRef.id}`);
    return newConvRef.id;
  };

  const sendMessage = async (text?: string, fileData?: string, rawContext?: string) => {
    const content = text || input;
    if (!content && !fileData && !rawContext) return;
    if (!user || !db) return;

    let activeConvId = conversationId;
    if (!activeConvId) {
      activeConvId = await createNewConversation(content.slice(0, 30));
    }

    const userMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      role: 'user',
      content: content.startsWith('[SYSTEM]') ? 'System Request' : (content || 'Visual source uploaded'),
      timestamp: new Date(),
    };

    setLocalMessages(prev => [...prev, userMessage]);

    addDocumentNonBlocking(collection(db, 'users', user.uid, 'conversations', activeConvId!, 'messages'), {
      ...userMessage,
      timestamp: serverTimestamp(),
    });

    setInput('');
    setIsProcessing(true);

    try {
      const history = (Array.isArray(localMessages) ? localMessages : [])
        .filter(m => m && m.content)
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content }));

      const result = await AnalysisService.analyze({ 
        documentText: rawContext || content,
        imageDataUri: fileData,
        history,
        userMemory: userMemory || null
      });

      // Update conversation title if this is the first real message
      if (localMessages.length <= 1 && result?.title) {
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
        content: result?.summary || "Protocol analysis complete. Recommendations compiled.",
        type: result?.isActionable ? 'analysis_result' : 'text',
        strategy: result?.strategy,
        mode: result?.mode,
        data: result || null,
        timestamp: new Date(),
      };

      setLocalMessages(prev => [...prev, assistantMessage]);
      addDocumentNonBlocking(collection(db, 'users', user.uid, 'conversations', activeConvId!, 'messages'), {
        ...assistantMessage,
        timestamp: serverTimestamp(),
      });

    } catch (err) {
      console.error('Processing error:', err);
      
      const errorMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        role: 'assistant',
        content: "I've encountered a protocol stability issue. My core auditing functions remain active, but this specific analysis was interrupted. Please try re-sending the data.",
        type: 'error',
        timestamp: new Date(),
      };

      setLocalMessages(prev => [...prev, errorMessage]);
      addDocumentNonBlocking(collection(db, 'users', user.uid, 'conversations', activeConvId!, 'messages'), {
        ...errorMessage,
        timestamp: serverTimestamp(),
      });

      toast({ variant: 'destructive', title: "Protocol Interrupt", description: "Failed to process intelligence. Fallback active." });
    } finally {
      setIsProcessing(false);
    }
  };

  const getModeIcon = (mode?: string) => {
    switch (mode) {
      case 'alert': return <Zap className="w-3.5 h-3.5 text-danger" />;
      case 'analyst': return <BrainCircuit className="w-3.5 h-3.5 text-primary" />;
      case 'planner': return <ListChecks className="w-3.5 h-3.5 text-accent" />;
      case 'executor': return <ShieldCheck className="w-3.5 h-3.5 text-success" />;
      default: return <Cpu className="w-3.5 h-3.5 text-muted-foreground" />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background relative overflow-hidden">
      <Navbar />
      
      <div 
        ref={scrollRef} 
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto pt-24 pb-48 px-6 md:px-24 lg:px-48 space-y-12 scroll-smooth"
      >
        <AnimatePresence initial={false}>
          {isMessagesLoading ? (
            <div className="space-y-12">
              <Skeleton className="h-24 w-3/4 rounded-3xl bg-white/[0.03]" />
              <Skeleton className="h-24 w-1/2 ml-auto rounded-3xl bg-primary/10" />
            </div>
          ) : localMessages.length > 0 ? (
            (Array.isArray(localMessages) ? localMessages : []).map((msg) => (
              <motion.div 
                key={msg.id} 
                initial={{ opacity: 0, y: 15 }} 
                animate={{ opacity: 1, y: 0 }} 
                className={cn("flex w-full group", msg.role === 'user' ? "justify-end" : "justify-start")}
              >
                <div className={cn("max-w-[95%] md:max-w-[85%] space-y-4", msg.role === 'user' ? "items-end text-right" : "items-start text-left")}>
                  
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-3 mb-2 ml-1">
                      <div className="p-1.5 rounded-lg bg-white/5 border border-white/5">{getModeIcon(msg.mode)}</div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">
                        {msg.mode || 'Operator'} • {msg.strategy?.replace('_', ' ') || 'Protocol'}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-5">
                    {msg.role === 'assistant' && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleCopy(msg.content, msg.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity w-9 h-9 rounded-xl hover:bg-white/5"
                      >
                        {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground/50" />}
                      </Button>
                    )}
                    <div className={cn(
                      "p-6 rounded-[28px] text-sm md:text-lg leading-relaxed font-medium shadow-2xl relative",
                      msg.role === 'user' 
                        ? "bg-primary text-background rounded-tr-none shadow-primary/10" 
                        : "bg-white/[0.03] border border-white/5 text-foreground rounded-tl-none shadow-black/40",
                      msg.type === 'error' ? "border-danger/30 bg-danger/5" : ""
                    )}>
                      {msg.content}
                      {msg.timestamp && (
                        <span className="absolute -bottom-6 right-1 text-[8px] font-bold text-muted-foreground/20 uppercase tracking-[0.2em]">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>

                  {msg.type === 'analysis_result' && msg.data && <RichAnalysisCard data={msg.data} />}
                  {msg.type === 'daily_digest' && msg.data && <DailyDigestCard digest={msg.data} />}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-20 pt-32">
              <Cpu className="w-16 h-16 text-primary" />
              <div className="space-y-2">
                <p className="text-2xl font-bold font-headline tracking-tighter">Protocol Awaiting Intent</p>
                <p className="text-sm font-medium uppercase tracking-[0.3em]">Operator Active • Logic Standby</p>
              </div>
            </div>
          )}
        </AnimatePresence>

        {isProcessing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-start">
            <div className="flex items-center gap-4 p-6 rounded-[28px] bg-white/[0.03] border border-white/5 rounded-tl-none">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-primary tracking-tight italic">Analyzing Context...</span>
                <div className="flex gap-1.5">
                  {[0, 1, 2].map(i => (
                    <motion.div 
                      key={i}
                      animate={{ opacity: [0.2, 1, 0.2] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                      className="w-1.5 h-1.5 bg-primary/40 rounded-full"
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showScrollButton && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-32 right-12 z-50"
          >
            <Button 
              size="icon" 
              onClick={scrollToBottom}
              className="w-12 h-12 rounded-full shadow-2xl bg-primary text-background hover:scale-110 transition-transform"
            >
              <ArrowDown className="w-5 h-5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-0 right-0 left-0 lg:left-[var(--sidebar-width)] p-6 md:p-12 pointer-events-none">
        <div className="max-w-4xl mx-auto w-full pointer-events-auto">
          <Card className="glass !p-2.5 flex items-end gap-3 rounded-[36px] border-white/10 shadow-[0_32px_80px_-12px_rgba(0,0,0,0.6)]">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="w-14 h-14 rounded-full hover:bg-white/5 text-muted-foreground transition-colors">
                  <Plus className="w-6 h-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72 bg-card border-white/10 rounded-2xl p-2 mb-6 shadow-2xl">
                <DropdownMenuItem onClick={() => DigestService.generateDigest(db!, user!.uid).then(d => d && sendMessage("[SYSTEM] Generate Intelligence Briefing", undefined, "Synthesize latest records into a digest.")) } className="rounded-xl h-12 cursor-pointer gap-4"><CalendarDays className="w-4 h-4 text-primary" /><span className="font-bold text-sm text-white">Daily Briefing</span></DropdownMenuItem>
                <DropdownMenuItem onClick={() => GmailService.connect().then(t => t && GmailService.fetchFinancialEmails(t).then(e => e.length > 0 && sendMessage(`[SYSTEM] Inbox Analysis Sync`, undefined, e.map(i => i.snippet).join('\n')))) } className="rounded-xl h-12 cursor-pointer gap-4"><MailCheck className="w-4 h-4 text-accent" /><span className="font-bold text-sm text-white">Gmail Audit</span></DropdownMenuItem>
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="rounded-xl h-12 cursor-pointer gap-4"><ImageIcon className="w-4 h-4 text-success" /><span className="font-bold text-sm text-white">Upload visual source</span></DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <input type="file" className="hidden" ref={fileInputRef} accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => sendMessage(undefined, r.result as string); r.readAsDataURL(f); } }} />
            <Textarea 
              ref={textareaRef}
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} 
              placeholder="Command operator..." 
              className="flex-1 border-0 focus-visible:ring-0 bg-transparent min-h-[56px] py-4 text-lg font-medium resize-none overflow-hidden text-white placeholder:text-muted-foreground/20" 
              rows={1} 
            />
            <Button 
              size="icon" 
              disabled={!input.trim() || isProcessing} 
              onClick={() => sendMessage()} 
              className="w-14 h-14 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95 shrink-0"
            >
              {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>}>
      <ChatContent />
    </Suspense>
  );
}
