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
  Loader2,
  Zap,
  Activity,
  CheckCircle2,
  Sparkles
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
  const [agentMetadata, setAgentMetadata] = useState<any>(null);
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
    setAgentMetadata(null);

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
        if (chunk.startsWith("__METADATA__:")) {
          const meta = JSON.parse(chunk.replace("__METADATA__:", ""));
          setAgentMetadata(meta);
          continue;
        }
        fullContent += chunk;
      }

      addDocumentNonBlocking(collection(db, 'users', user.uid, 'conversations', activeId, 'messages'), {
        role: 'assistant',
        content: fullContent,
        timestamp: serverTimestamp(),
        metadata: agentMetadata
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
                key={msg.id || idx} 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                className={cn("flex w-full flex-col", msg.role === 'user' ? "items-end" : "items-start")}
              >
                <div className={cn("max-w-[85%] space-y-4", msg.role === 'user' ? "items-end text-right" : "items-start text-left")}>
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-3 mb-2 px-2">
                      <StatusDot status="active" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Operator Engine V5.2</span>
                    </div>
                  )}
                  
                  {/* Tool Activity Notification */}
                  {msg.metadata?.toolUsed && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="px-4 py-2 bg-primary/5 border border-primary/10 rounded-2xl flex items-center gap-3 text-[10px] font-bold text-primary uppercase tracking-widest"
                    >
                      <Activity className="w-3.5 h-3.5 animate-pulse" />
                      Executed Tool: {msg.metadata.toolUsed}
                      <span className="text-slate-300">•</span>
                      <Sparkles className="w-3 h-3" />
                      {msg.metadata.toolResultSummary || 'Optimized parameters.'}
                    </motion.div>
                  )}

                  <div className={cn(
                    "p-8 rounded-[2.5rem] text-sm font-medium leading-relaxed shadow-sm",
                    msg.role === 'user' 
                      ? "bg-slate-900 text-white" 
                      : "glass-surface text-slate-700 border-white/60"
                  )}>
                    {msg.content}
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-8">
              <div className="w-24 h-24 rounded-[3rem] bg-white border border-slate-100 flex items-center justify-center shadow-xl">
                <Terminal className="w-10 h-10 text-slate-200" />
              </div>
              <div className="space-y-2">
                <h2 className="text-5xl font-bold tracking-tighter text-slate-900 leading-none">Command Center</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.4em]">Autonomous Logic Loops Active</p>
              </div>
            </div>
          )}
          
          {isProcessing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-start gap-4">
              <div className="flex items-center gap-3 px-2">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reasoning...</span>
              </div>
              <div className="p-8 rounded-[2.5rem] glass-surface border-white/60 animate-shimmer min-w-[200px]">
                <div className="h-4 bg-slate-100 rounded-full w-24 mb-4" />
                <div className="h-4 bg-slate-100 rounded-full w-48" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6">
        <GlassCard className="!p-2 rounded-full flex items-center gap-2 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.12)] border-white/80">
          <button className="w-12 h-12 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-all active:scale-95">
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
            className="!rounded-full !w-12 !h-12 !p-0 shadow-lg shadow-primary/20"
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
