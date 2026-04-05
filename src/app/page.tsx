
"use client";

import { useState, useRef, useEffect, Suspense } from 'react';
import { 
  Cpu,
  ArrowRight,
  Terminal,
  Loader2,
  Zap,
  Activity,
  X,
  ImageIcon,
  MessageSquare,
  Search,
  Clock
} from 'lucide-react';
import { useFirestore, useUser, addDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { collection, serverTimestamp, doc, query, orderBy, setDoc, limit } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { RichAnalysisCard } from '@/components/chat/RichAnalysisCard';
import { PaywallOverlay } from '@/components/monetization/PaywallOverlay';
import { OnboardingOverlay } from '@/components/onboarding/OnboardingOverlay';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';

function ChatContent() {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedImage, setSelectedToolImage] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallReason, setPaywallReason] = useState<'limit_reached' | 'premium_tool'>('limit_reached');
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationId = searchParams?.get('c');
  const { toast } = useToast();

  // Onboarding detection
  const convsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'conversations'), limit(1));
  }, [db, user]);
  const { data: convs, isLoading: isConvsLoading } = useCollection(convsQuery);

  useEffect(() => {
    if (!isConvsLoading && !isUserLoading && user && convs && convs.length === 0 && !conversationId) {
      setShowOnboarding(true);
    } else {
      setShowOnboarding(false);
    }
  }, [convs, isConvsLoading, isUserLoading, user, conversationId]);

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

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedToolImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSelectGoal = async (goalId: string) => {
    if (!user || !db) {
      router.push('/login');
      return;
    }
    setIsProcessing(true);
    setShowOnboarding(false);
    setIsProcessing(false);
  };

  const sendMessage = async () => {
    if (!user || (!input.trim() && !selectedImage) || !db || isProcessing) return;
    setIsProcessing(true);
    setInput('');
    setSelectedToolImage(null);
    setIsProcessing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const hasMessages = (messages || []).length > 0;

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full">
      <AnimatePresence>
        {showOnboarding && <OnboardingOverlay onSelectGoal={handleSelectGoal} />}
      </AnimatePresence>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-12 pb-48 pt-10 px-4 md:px-0 stealth-scrollbar">
        <AnimatePresence initial={false}>
          {hasMessages ? (
            messages!.map((msg, idx) => (
              <motion.div 
                key={msg.id || idx} 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                className={cn("flex w-full flex-col", msg.role === 'user' ? "items-end" : "items-start")}
              >
                <div className={cn("max-w-[95%] md:max-w-[90%] space-y-4", msg.role === 'user' ? "items-end text-right" : "items-start text-left")}>
                  <div className={cn(
                    "p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] text-sm font-medium leading-relaxed shadow-sm overflow-hidden",
                    msg.role === 'user' ? "bg-slate-900 text-white" : "glass-surface text-slate-700 border-white/60"
                  )}>
                    {msg.imageUri && <img src={msg.imageUri} alt="Source" className="max-w-full rounded-2xl mb-4" />}
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : !showOnboarding && (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-8 px-4">
              {/* Central Terminal Icon */}
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-32 h-32 rounded-full bg-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 flex items-center justify-center text-slate-300"
              >
                <div className="flex items-center gap-1">
                  <span className="text-3xl font-light tracking-tighter">&gt;_</span>
                </div>
              </motion.div>
              
              {/* Header Text */}
              <div className="space-y-6">
                <h2 className="text-5xl md:text-8xl font-black tracking-tighter text-slate-900 leading-[0.9] text-center">
                  Intelligence<br/>Hub
                </h2>
                <p className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.6em] text-slate-400">
                  AUTONOMOUS FORGE ACTIVE
                </p>
              </div>
            </div>
          )}
          
          {isProcessing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4">
              <Loader2 className="w-6 h-6 text-slate-200 animate-spin" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Section */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 z-50">
        <div className="relative">
          <div className="flex items-center gap-4 bg-white/80 backdrop-blur-3xl border border-white/80 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] rounded-[2.5rem] px-6 py-4">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              className="hidden" 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="text-slate-300 hover:text-slate-500 transition-colors"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            
            <textarea 
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe intent or ask for analysis..."
              className="flex-1 bg-transparent border-0 focus:ring-0 text-sm font-medium text-slate-700 placeholder:text-slate-300 resize-none py-1 max-h-[200px] stealth-scrollbar"
            />

            {(input.trim() || selectedImage) && (
              <button 
                onClick={sendMessage}
                className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shadow-lg active:scale-95 transition-all"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <PaywallOverlay isOpen={showPaywall} onClose={() => setShowPaywall(false)} reason={paywallReason} />
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <ChatContent />
    </Suspense>
  );
}
