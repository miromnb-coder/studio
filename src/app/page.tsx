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
  LayoutDashboard,
  Terminal
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
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'auto' });
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
      toast({ variant: 'destructive', title: "Signal_Lost", description: "Re-establishing_Link." });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!mounted || isUserLoading) return <div className="min-h-screen bg-stealth-ebon flex items-center justify-center"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>;

  return (
    <div className="flex h-screen bg-stealth-ebon overflow-hidden">
      <Navbar />
      
      <main className="flex-1 flex flex-col relative">
        <div ref={scrollRef} className="flex-1 overflow-y-auto pt-24 pb-48 px-6 md:px-12 lg:px-24 space-y-12 stealth-scrollbar">
          <AnimatePresence initial={false}>
            {localMessages.length > 0 ? (
              localMessages.map((msg) => (
                <motion.div 
                  key={msg.id} 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, ease: "linear" }}
                  className={cn("flex w-full", msg.role === 'user' ? "justify-end" : "justify-start")}
                >
                  <div className={cn("max-w-[90%] md:max-w-[85%] space-y-2", msg.role === 'user' ? "items-end text-right" : "items-start text-left")}>
                    
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-1 px-4">
                        <Terminal className="w-3 h-3 text-primary animate-glow-pulse" />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-primary glow-text">
                          SYS_EXEC::{msg.intent || 'OPERATOR'}
                        </span>
                      </div>
                    )}

                    <div className={cn(
                      "p-6 text-sm font-medium transition-all leading-relaxed border-l-4",
                      msg.role === 'user' 
                        ? "bg-stealth-onyx border-muted-foreground text-white" 
                        : "bg-stealth-onyx/50 border-primary text-foreground",
                      msg.isStreaming ? "animate-pulse" : ""
                    )}>
                      {msg.content}
                    </div>

                    {msg.data?.toolResults && !msg.isStreaming && (
                      <div className="mt-4"><RichAnalysisCard data={{ ...msg.data, summary: msg.content }} /></div>
                    )}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-10 opacity-40 pt-24">
                <div className="w-16 h-16 border-2 border-primary/20 flex items-center justify-center animate-pulse">
                  <Terminal className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-[0.2em] text-primary glow-text uppercase">Initial_Protocol</h2>
                  <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-muted-foreground">Tactical_Intelligence_Input_Required</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Input Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 pointer-events-none">
          <div className="max-w-5xl mx-auto w-full pointer-events-auto">
            <Card className="bg-stealth-onyx/90 backdrop-blur-xl border border-stealth-slate p-1 flex items-end gap-2 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
              <Button size="icon" variant="ghost" onClick={() => fileInputRef.current?.click()} className="w-12 h-12 hover:bg-primary/10 text-muted-foreground hover:text-primary">
                <ImageIcon className="w-4 h-4" />
              </Button>
              <input type="file" className="hidden" ref={fileInputRef} accept="image/*" />
              <div className="flex-1 flex items-center gap-2 px-4 py-3 bg-stealth-ebon border border-stealth-slate focus-within:border-primary transition-all">
                <span className="text-primary font-bold">{'>'}</span>
                <Textarea 
                  ref={textareaRef}
                  value={input} 
                  onChange={(e) => setInput(e.target.value)} 
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} 
                  placeholder="EXECUTE_COMMAND..." 
                  className="flex-1 border-0 focus-visible:ring-0 bg-transparent min-h-[24px] p-0 text-[11px] font-bold uppercase tracking-widest resize-none text-foreground placeholder:text-muted-foreground/30" 
                  rows={1} 
                />
              </div>
              <Button 
                size="icon" 
                disabled={!input.trim() || isProcessing} 
                onClick={() => sendMessage()} 
                className="w-12 h-12 bg-primary text-white hover:bg-primary/80 transition-all border border-transparent hover:border-primary shadow-[0_0_10px_rgba(225,29,72,0.3)]"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
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
    <Suspense fallback={<div className="min-h-screen bg-stealth-ebon flex items-center justify-center"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>}>
      <ChatContent />
    </Suspense>
  );
}
