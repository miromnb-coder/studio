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
      toast({ variant: 'destructive', title: "Sync Interrupted", description: "The neural link was severed. Reconnecting." });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!mounted || isUserLoading) return <div className="min-h-screen bg-nordic-silk flex items-center justify-center"><Loader2 className="w-10 h-10 text-nordic-sage animate-spin" /></div>;

  return (
    <div className="flex h-screen bg-nordic-silk overflow-hidden">
      <Navbar />
      
      <main className="flex-1 flex flex-col relative">
        <div ref={scrollRef} className="flex-1 overflow-y-auto pt-32 pb-60 px-6 md:px-24 lg:px-48 space-y-12 scrollbar-hide">
          <AnimatePresence initial={false}>
            {localMessages.length > 0 ? (
              localMessages.map((msg) => (
                <motion.div 
                  key={msg.id} 
                  initial={{ opacity: 0, y: 20, scale: 0.95 }} 
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className={cn("flex w-full", msg.role === 'user' ? "justify-end" : "justify-start")}
                >
                  <div className={cn("max-w-[90%] md:max-w-[80%] space-y-3", msg.role === 'user' ? "items-end text-right" : "items-start text-left")}>
                    
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-1 px-2">
                        <div className="w-5 h-5 rounded-lg bg-nordic-moss/40 flex items-center justify-center">
                          <Cpu className="w-3 h-3 text-nordic-sage" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          {msg.intent || 'Operator'}
                        </span>
                      </div>
                    )}

                    <div className={cn(
                      "p-6 rounded-3xl text-sm md:text-base font-medium shadow-sm transition-all leading-relaxed",
                      msg.role === 'user' 
                        ? "bg-gradient-to-br from-slate-500 to-slate-700 text-white rounded-tr-none" 
                        : "bg-white border border-slate-100 text-slate-800 rounded-tl-none",
                      msg.isStreaming ? "animate-pulse border-nordic-sage/20" : ""
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
              <div className="flex flex-col items-center justify-center h-full text-center space-y-10 opacity-40 pt-32">
                <div className="w-20 h-20 rounded-[2.5rem] bg-nordic-moss/30 flex items-center justify-center">
                  <Cpu className="w-10 h-10 text-nordic-sage" />
                </div>
                <div className="space-y-3">
                  <h2 className="text-4xl font-bold tracking-tight text-slate-900">Initialize</h2>
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-nordic-sage">Neural Wellness Protocol</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Input Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 pointer-events-none">
          <div className="max-w-4xl mx-auto w-full pointer-events-auto">
            <Card className="bg-white/80 backdrop-blur-md border border-white shadow-xl shadow-slate-200/40 p-2 rounded-[2.5rem] flex items-end gap-3">
              <Button size="icon" variant="ghost" onClick={() => fileInputRef.current?.click()} className="w-14 h-14 rounded-full hover:bg-nordic-silk text-slate-400">
                <ImageIcon className="w-5 h-5" />
              </Button>
              <input type="file" className="hidden" ref={fileInputRef} accept="image/*" />
              <Textarea 
                ref={textareaRef}
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} 
                placeholder="Message the operator..." 
                className="flex-1 border-0 focus-visible:ring-0 bg-transparent min-h-[56px] py-4 text-base font-medium resize-none text-slate-900 placeholder:text-slate-300" 
                rows={1} 
              />
              <Button 
                size="icon" 
                disabled={!input.trim() || isProcessing} 
                onClick={() => sendMessage()} 
                className="w-14 h-14 rounded-full bg-nordic-sage text-white shadow-lg shadow-nordic-sage/20 hover:scale-105 transition-transform"
              >
                {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
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
    <Suspense fallback={<div className="min-h-screen bg-nordic-silk flex items-center justify-center"><Loader2 className="w-10 h-10 text-nordic-sage animate-spin" /></div>}>
      <ChatContent />
    </Suspense>
  );
}