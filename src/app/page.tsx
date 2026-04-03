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
  ArrowDown,
  Clock,
  Coins,
  Map
} from 'lucide-react';
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
  type?: 'text' | 'analysis_result' | 'daily_digest' | 'error' | 'system';
  intent?: string;
  mode?: string;
  data?: any;
  timestamp: any;
  isStreaming?: boolean;
}

const formatSafeTime = (timestamp: any) => {
  if (!timestamp) return '...';
  if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return '...';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return '...';
  }
};

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

  useEffect(() => {
    if (mounted && !isUserLoading && !user) {
      router.push('/login');
    }
  }, [mounted, isUserLoading, user, router]);

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

  useEffect(() => {
    if (!mounted) return;
    if (Array.isArray(storedMessages) && storedMessages.length > 0) {
      setLocalMessages(storedMessages as Message[]);
    } else if (!isMessagesLoading) {
      setLocalMessages([]);
    }
  }, [storedMessages, conversationId, mounted, isMessagesLoading]);

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

  const sendMessage = async (text?: string, fileData?: string) => {
    const content = text || input;
    if (!content && !fileData) return;
    if (!user || !db) return;

    let activeConvId = conversationId;
    if (!activeConvId) {
      activeConvId = await createNewConversation(content.slice(0, 30));
    }

    const userMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setLocalMessages(prev => [...prev, userMessage]);
    addDocumentNonBlocking(collection(db, 'users', user.uid, 'conversations', activeConvId!, 'messages'), {
      ...userMessage,
      timestamp: serverTimestamp(),
    });

    setInput('');
    setIsProcessing(true);

    const assistantMsgId = Math.random().toString(36).substr(2, 9);
    const assistantMessage: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    };
    setLocalMessages(prev => [...prev, assistantMessage]);

    try {
      const history = localMessages.slice(-10).map(m => ({ role: m.role, content: m.content }));
      
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: content,
          history,
          imageUri: fileData,
          userId: user.uid
        }),
      });

      if (!response.ok) throw new Error("Stream connection failed");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let metadata: any = null;
      let pendingBuffer = "";

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        pendingBuffer += chunk;

        const lines = pendingBuffer.split('\n');
        pendingBuffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;

          // Backward compatibility for the previous metadata format
          if (line.startsWith("__METADATA__:")) {
            metadata = JSON.parse(line.replace("__METADATA__:", ""));
            continue;
          }

          try {
            const event = JSON.parse(line);
            if (event?.type === 'metadata') {
              metadata = event.data;
              continue;
            }
            if (event?.type === 'chunk') {
              fullContent += event.data || "";
              setLocalMessages(prev => prev.map(m => 
                m.id === assistantMsgId ? { ...m, content: fullContent } : m
              ));
              continue;
            }
            if (event?.type === 'error') {
              throw new Error(event.error || 'Agent stream error');
            }
            if (event?.type === 'done') {
              continue;
            }
          } catch {
            // Non-JSON chunk fallback (legacy plain text stream)
            fullContent += line;
            setLocalMessages(prev => prev.map(m => 
              m.id === assistantMsgId ? { ...m, content: fullContent } : m
            ));
          }
        }
      }

      if (pendingBuffer.trim()) {
        try {
          const event = JSON.parse(pendingBuffer);
          if (event?.type === 'metadata') metadata = event.data;
          if (event?.type === 'chunk') fullContent += event.data || "";
        } catch {
          fullContent += pendingBuffer;
        }
      }

      // Finalize the message in Firestore
      const finalAssistantMessage = {
        role: 'assistant' as const,
        content: fullContent,
        intent: metadata?.intent || 'general',
        data: metadata || null,
        timestamp: serverTimestamp(),
      };

      setLocalMessages(prev => prev.map(m => 
        m.id === assistantMsgId ? { ...m, ...finalAssistantMessage, isStreaming: false, timestamp: new Date() } : m
      ));

      addDocumentNonBlocking(collection(db, 'users', user.uid, 'conversations', activeConvId!, 'messages'), finalAssistantMessage);

    } catch (err: any) {
      console.error('Streaming Error:', err);
      toast({ variant: 'destructive', title: "Neural Link Severed", description: "I've lost the stream. Recalibrating." });
    } finally {
      setIsProcessing(false);
    }
  };

  const getModeIcon = (mode?: string) => {
    switch (mode) {
      case 'finance': return <Coins className="w-3.5 h-3.5 text-primary" />;
      case 'time_optimizer': return <Clock className="w-3.5 h-3.5 text-accent" />;
      case 'monetization': return <Zap className="w-3.5 h-3.5 text-warning" />;
      case 'technical': return <Cpu className="w-3.5 h-3.5 text-muted-foreground" />;
      default: return <BrainCircuit className="w-3.5 h-3.5 text-primary" />;
    }
  };

  if (!mounted || isUserLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background relative overflow-hidden">
      <Navbar />
      
      <div 
        ref={scrollRef} 
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto pt-24 pb-48 px-6 md:px-24 lg:px-48 space-y-12 scroll-smooth"
      >
        <AnimatePresence initial={false}>
          {localMessages.length > 0 ? (
            localMessages.map((msg) => (
              <motion.div 
                key={msg.id} 
                initial={{ opacity: 0, y: 15 }} 
                animate={{ opacity: 1, y: 0 }} 
                className={cn("flex w-full group", msg.role === 'user' ? "justify-end" : "justify-start")}
              >
                <div className={cn("max-w-[95%] md:max-w-[85%] space-y-4", msg.role === 'user' ? "items-end text-right" : "items-start text-left")}>
                  
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-3 mb-2 ml-1">
                      <div className="p-1.5 rounded-lg bg-white/5 border border-white/5">{getModeIcon(msg.intent)}</div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">
                        {msg.intent?.replace('_', ' ') || 'Operator'} • Neural Stream Active
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-5">
                    <div className={cn(
                      "p-6 rounded-[28px] text-sm md:text-lg leading-relaxed font-medium shadow-2xl relative",
                      msg.role === 'user' 
                        ? "bg-primary text-background rounded-tr-none" 
                        : "bg-white/[0.03] border border-white/5 text-foreground rounded-tl-none shadow-black/40",
                      msg.isStreaming ? "animate-pulse" : ""
                    )}>
                      {msg.content}
                      {!msg.isStreaming && (
                        <span className="absolute -bottom-6 right-1 text-[8px] font-bold text-muted-foreground/20 uppercase tracking-[0.2em]">
                          {formatSafeTime(msg.timestamp)}
                        </span>
                      )}
                    </div>
                  </div>

                  {msg.data?.toolResults && msg.data.toolResults.length > 0 && !msg.isStreaming && (
                    <RichAnalysisCard data={{ ...msg.data, summary: msg.content }} />
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-20 pt-32">
              <Cpu className="w-16 h-16 text-primary" />
              <div className="space-y-2">
                <p className="text-2xl font-bold font-headline tracking-tighter">Operator v4.2</p>
                <p className="text-sm font-medium uppercase tracking-[0.3em]">Multi-Agent Streaming Core Online</p>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      <div className="fixed bottom-0 right-0 left-0 lg:left-[var(--sidebar-width)] p-6 md:p-12 pointer-events-none">
        <div className="max-w-4xl mx-auto w-full pointer-events-auto">
          <Card className="glass !p-2.5 flex items-end gap-3 rounded-[36px] border-white/10 shadow-[0_32px_80px_-12px_rgba(0,0,0,0.6)]">
            <Button size="icon" variant="ghost" onClick={() => fileInputRef.current?.click()} className="w-14 h-14 rounded-full hover:bg-white/5 text-muted-foreground">
              <ImageIcon className="w-6 h-6" />
            </Button>
            <input type="file" className="hidden" ref={fileInputRef} accept="image/*" />
            <Textarea 
              ref={textareaRef}
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} 
              placeholder="How can I optimize your finances today?" 
              className="flex-1 border-0 focus-visible:ring-0 bg-transparent min-h-[56px] py-4 text-lg font-medium resize-none overflow-hidden text-white placeholder:text-muted-foreground/20" 
              rows={1} 
            />
            <Button 
              size="icon" 
              disabled={!input.trim() || isProcessing} 
              onClick={() => sendMessage()} 
              className="w-14 h-14 rounded-full shadow-2xl transition-all"
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
