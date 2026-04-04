"use client";

import { useState, useRef, useEffect, Suspense } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { 
  Send, 
  ImageIcon, 
  Zap, 
  Loader2,
  Cpu,
  BrainCircuit,
  Coins,
  Clock,
  ArrowDown,
  Activity,
  ChevronRight,
  ShieldCheck,
  LayoutDashboard
} from 'lucide-react';
import { useFirestore, useUser, addDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { collection, serverTimestamp, doc, query, orderBy, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import { RichAnalysisCard } from '@/components/chat/RichAnalysisCard';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: string;
  intent?: string;
  data?: any;
  timestamp: any;
  isStreaming?: boolean;
}

function ChatContent() {
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationId = searchParams?.get('c');
  const { toast } = useToast();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mounted && !isUserLoading && !user) router.push('/login');
  }, [mounted, isUserLoading, user, router]);

  const messagesQuery = useMemoFirebase(() => {
    if (!db || !user || !conversationId) return null;
    return query(
      collection(db, 'users', user.uid, 'conversations', conversationId, 'messages'),
      orderBy('timestamp', 'asc')
    );
  }, [db, user, conversationId]);

  const { data: storedMessages, isLoading: isMessagesLoading } = useCollection(messagesQuery);

  useEffect(() => {
    if (storedMessages) setLocalMessages(storedMessages as Message[]);
  }, [storedMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [localMessages, isProcessing]);

  const sendMessage = async (text?: string, fileData?: string) => {
    const content = text || input;
    if (!content || !user || !db) return;

    let activeId = conversationId;
    if (!activeId) {
      const newRef = doc(collection(db, 'users', user.uid, 'conversations'));
      activeId = newRef.id;
      await setDoc(newRef, { id: activeId, userId: user.uid, title: content.slice(0, 30), createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      router.push(`/?c=${activeId}`);
    }

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content, timestamp: new Date() };
    setLocalMessages(prev => [...prev, userMsg]);
    addDocumentNonBlocking(collection(db, 'users', user.uid, 'conversations', activeId, 'messages'), { ...userMsg, timestamp: serverTimestamp() });

    setInput('');
    setIsProcessing(true);

    const assistantMsgId = (Date.now() + 1).toString();
    setLocalMessages(prev => [...prev, { id: assistantMsgId, role: 'assistant', content: '', timestamp: new Date(), isStreaming: true }]);

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: content, history: localMessages.slice(-10).map(m => ({ role: m.role, content: m.content })), userId: user.uid }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let metadata: any = null;

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        const chunk = decoder.decode(value);
        if (chunk.startsWith("__METADATA__:")) {
          metadata = JSON.parse(chunk.split('\n')[0].replace("__METADATA__:", ""));
          continue;
        }
        fullContent += chunk;
        setLocalMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, content: fullContent } : m));
      }

      const finalMsg = { role: 'assistant', content: fullContent, intent: metadata?.intent, data: metadata, timestamp: serverTimestamp() };
      addDocumentNonBlocking(collection(db, 'users', user.uid, 'conversations', activeId, 'messages'), finalMsg);
      setLocalMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, ...finalMsg, isStreaming: false, timestamp: new Date() } : m));
    } catch (err) {
      toast({ variant: 'destructive', title: "Sync Lost", description: "The neural link was severed. Reconnecting." });
    } finally {
      setIsProcessing(false);
    }
  };

  const getModeIcon = (intent?: string) => {
    switch (intent) {
      case 'finance': return <Coins className="w-4 h-4 text-primary" />;
      case 'time_optimizer': return <Clock className="w-4 h-4 text-accent" />;
      default: return <BrainCircuit className="w-4 h-4 text-primary" />;
    }
  };

  if (!mounted || isUserLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Navbar />
      
      <main className="flex-1 flex flex-col relative">
        <div ref={scrollRef} className="flex-1 overflow-y-auto pt-32 pb-60 px-6 md:px-24 lg:px-48 space-y-12">
          <AnimatePresence initial={false}>
            {localMessages.length > 0 ? (
              localMessages.map((msg) => (
                <motion.div 
                  key={msg.id} 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  className={cn("flex w-full group", msg.role === 'user' ? "justify-end" : "justify-start")}
                >
                  <div className={cn("max-w-[90%] md:max-w-[80%] space-y-4", msg.role === 'user' ? "items-end text-right" : "items-start text-left")}>
                    
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-3 mb-2 px-1">
                        <div className="p-1.5 rounded-lg bg-white/5 border border-white/5">{getModeIcon(msg.intent)}</div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/40">
                          {msg.intent || 'Operator'} • Intelligence Feed
                        </span>
                      </div>
                    )}

                    <div className={cn(
                      "p-8 rounded-[2.5rem] text-base md:text-lg leading-relaxed font-medium transition-all duration-300",
                      msg.role === 'user' 
                        ? "bg-primary text-background rounded-tr-none shadow-2xl shadow-primary/20" 
                        : "bg-white/[0.03] border border-white/[0.05] text-foreground rounded-tl-none",
                      msg.isStreaming ? "animate-pulse border-primary/20" : ""
                    )}>
                      {msg.content}
                    </div>

                    {msg.data?.toolResults && !msg.isStreaming && (
                      <RichAnalysisCard data={{ ...msg.data, summary: msg.content }} />
                    )}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-8 opacity-20 pt-32">
                <div className="w-24 h-24 rounded-[2rem] bg-primary/10 flex items-center justify-center">
                  <Cpu className="w-12 h-12 text-primary" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-4xl font-bold font-headline tracking-tighter">Operator v4.2</h2>
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em]">Multi-Agent Workspace</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Input Control Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 pointer-events-none">
          <div className="max-w-4xl mx-auto w-full pointer-events-auto">
            <Card className="glass !p-3 flex items-end gap-4 rounded-[3rem] border-white/10 shadow-[0_48px_128px_-32px_rgba(0,0,0,0.8)]">
              <Button size="icon" variant="ghost" onClick={() => fileInputRef.current?.click()} className="w-16 h-16 rounded-full hover:bg-white/5 text-muted-foreground transition-colors">
                <ImageIcon className="w-6 h-6" />
              </Button>
              <input type="file" className="hidden" ref={fileInputRef} accept="image/*" />
              <Textarea 
                ref={textareaRef}
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} 
                placeholder="Initialize protocol or ask a question..." 
                className="flex-1 border-0 focus-visible:ring-0 bg-transparent min-h-[64px] py-5 text-xl font-medium resize-none overflow-hidden text-white placeholder:text-muted-foreground/20" 
                rows={1} 
              />
              <Button 
                size="icon" 
                disabled={!input.trim() || isProcessing} 
                onClick={() => sendMessage()} 
                className="w-16 h-16 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95"
              >
                {isProcessing ? <Loader2 className="w-7 h-7 animate-spin" /> : <Send className="w-7 h-7" />}
              </Button>
            </Card>
          </div>
        </div>
      </main>
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