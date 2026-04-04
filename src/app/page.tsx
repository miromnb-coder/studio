"use client";

import { useState, useRef, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { StatusDot } from '@/components/ui/StatusDot';
import { 
  Send, 
  ImageIcon, 
  Cpu,
  ArrowRight,
  Terminal,
  Loader2
} from 'lucide-react';
import { useFirestore, useUser, addDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { collection, serverTimestamp, doc, query, orderBy, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function ChatPage() {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationId = searchParams?.get('c');
  const { toast } = useToast();

  const messagesQuery = useMemoFirebase(() => {
    if (!db || !user || !conversationId) return null;
    return query(
      collection(db, 'users', user.uid, 'conversations', conversationId, 'messages'),
      orderBy('timestamp', 'asc')
    );
  }, [db, user, conversationId]);

  const { data: messages } = useCollection(messagesQuery);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isProcessing]);

  const sendMessage = async () => {
    if (!input.trim() || !user || !db) return;

    let activeId = conversationId;
    if (!activeId) {
      const newRef = doc(collection(db, 'users', user.uid, 'conversations'));
      activeId = newRef.id;
      await setDoc(newRef, { id: activeId, userId: user.uid, title: input.slice(0, 30), createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      router.push(`/?c=${activeId}`);
    }

    const userMsg = { role: 'user', content: input, timestamp: serverTimestamp() };
    addDocumentNonBlocking(collection(db, 'users', user.uid, 'conversations', activeId, 'messages'), userMsg);
    
    setInput('');
    setIsProcessing(true);

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, history: (messages || []).map(m => ({ role: m.role, content: m.content })), userId: user.uid }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        const chunk = decoder.decode(value);
        if (chunk.startsWith("__METADATA__:")) continue;
        fullContent += chunk;
      }

      addDocumentNonBlocking(collection(db, 'users', user.uid, 'conversations', activeId, 'messages'), {
        role: 'assistant',
        content: fullContent,
        timestamp: serverTimestamp()
      });
    } catch (err) {
      toast({ variant: 'destructive', title: "Sync Interrupted", description: "Re-establishing link with intelligence core." });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-12 pb-48 pt-10 stealth-scrollbar">
        <AnimatePresence initial={false}>
          {(messages || []).length > 0 ? (
            messages!.map((msg, idx) => (
              <motion.div 
                key={msg.id} 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                className={cn("flex w-full", msg.role === 'user' ? "justify-end" : "justify-start")}
              >
                <div className={cn("max-w-[85%] space-y-2", msg.role === 'user' ? "items-end text-right" : "items-start text-left")}>
                  {msg.role === 'assistant' && <StatusDot status="active" />}
                  <div className={cn(
                    "p-6 rounded-4xl text-sm font-medium leading-relaxed",
                    msg.role === 'user' 
                      ? "bg-primary text-white shadow-glow" 
                      : "glass-surface text-slate-700"
                  )}>
                    {msg.content}
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-8">
              <div className="w-20 h-20 rounded-[2.5rem] bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                <Terminal className="w-10 h-10 text-slate-200" />
              </div>
              <div className="space-y-2">
                <h2 className="text-4xl font-bold tracking-tighter text-slate-900">Intelligence Briefing</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.4em]">Autonomous Reasoning Active</p>
              </div>
            </div>
          )}
          {isProcessing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="p-6 rounded-4xl glass-surface flex items-center gap-3">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Processing...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Pill-shaped Floating Input */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6">
        <GlassCard className="!p-2 rounded-full flex items-center gap-2 shadow-xl border-white/60">
          <button className="w-12 h-12 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-all">
            <ImageIcon className="w-5 h-5" />
          </button>
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Initialize intent..."
            className="flex-1 bg-transparent border-0 focus:ring-0 text-sm font-medium text-slate-700 placeholder:text-slate-300"
          />
          <GlassButton 
            size="sm" 
            className="!rounded-full !w-12 !h-12 !p-0"
            onClick={sendMessage}
            loading={isProcessing}
          >
            <ArrowRight className="w-5 h-5" />
          </GlassButton>
        </GlassCard>
      </div>
    </div>
  );
}