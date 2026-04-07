
"use client";

import { useState, useRef, useEffect, Suspense, memo } from 'react';
import { 
  ArrowRight,
  Loader2,
  ImageIcon,
  ShieldCheck,
  Sparkles,
  Cpu
} from 'lucide-react';
import { useFirestore, useUser, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { PaywallOverlay } from '@/components/monetization/PaywallOverlay';
import { OnboardingOverlay } from '@/components/onboarding/OnboardingOverlay';
import AICoreOrbit from '@/components/ai-core/AICoreOrbit';
import { RichAnalysisCard } from '@/components/chat/RichAnalysisCard';

const BackgroundEnergyField = memo(() => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 200]);
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#FBFBFE]">
      <motion.div 
        style={{ y: y1 }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.02, 0.04, 0.02] }}
        transition={{ duration: 25, repeat: Infinity }}
        className="absolute top-[-20%] left-[-10%] w-[120vw] h-[120vw] rounded-full bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 blur-[150px]"
      />
    </div>
  );
});
BackgroundEnergyField.displayName = 'BackgroundEnergyField';

function ChatContent() {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedImage, setSelectedToolImage] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedToolImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const sendMessage = async () => {
    if (!user || !db || isProcessing) return;
    
    const trimmedInput = input.trim();
    // Do not allow sending if both are empty
    if (!trimmedInput && !selectedImage) return;
    
    let activeConversationId = conversationId;

    if (!activeConversationId) {
      const convRef = await addDocumentNonBlocking(collection(db, 'users', user.uid, 'conversations'), {
        userId: user.uid,
        title: (trimmedInput || 'Visual Audit').slice(0, 30) + '...',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      if (!convRef) return;
      activeConversationId = convRef.id;
      router.push(`/?c=${activeConversationId}`);
    }

    const messagesRef = collection(db, 'users', user.uid, 'conversations', activeConversationId, 'messages');
    
    // Save user message
    addDocumentNonBlocking(messagesRef, {
      role: 'user',
      content: trimmedInput || "[Image Attached]",
      imageUri: selectedImage,
      timestamp: serverTimestamp(),
    });

    setIsProcessing(true);
    const userMessage = trimmedInput || "Analyze visual source.";
    const currentImage = selectedImage;
    
    setInput('');
    setSelectedToolImage(null);

    try {
      // 🛡️ CRITICAL: Sanitize history before sending to API
      const safeHistory = (messages || [])
        .filter(m => m && typeof m.content === 'string' && m.content.trim().length > 0)
        .map(m => ({
          role: m.role || 'user',
          content: m.content.trim()
        }));

      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: userMessage,
          imageUri: currentImage,
          userId: user.uid,
          history: safeHistory,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        if (err.error === 'LIMIT_REACHED') setShowPaywall(true);
        throw new Error(err.message || 'Logic core failure');
      }

      const reader = response.body?.getReader();
      let assistantContent = '';
      let metadata: any = null;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('__METADATA__:')) {
              try { metadata = JSON.parse(line.replace('__METADATA__:', '')); } catch (e) {}
            } else { assistantContent += line; }
          }
        }
      }

      if (assistantContent.trim()) {
        addDocumentNonBlocking(messagesRef, {
          role: 'assistant',
          content: assistantContent,
          timestamp: serverTimestamp(),
          data: metadata?.structuredData || null,
          metadata: metadata || null,
        });
        
        // Update conversation timestamp
        updateDoc(doc(db, 'users', user.uid, 'conversations', activeConversationId), {
          updatedAt: serverTimestamp()
        });
      }

    } catch (err: any) {
      toast({ variant: 'destructive', title: "Sync Interrupted", description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full relative">
      <BackgroundEnergyField />
      
      <AnimatePresence>
        {showOnboarding && <OnboardingOverlay onSelectGoal={() => setShowOnboarding(false)} />}
      </AnimatePresence>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-12 pb-48 pt-6 px-4 md:px-0 stealth-scrollbar relative z-10">
        <AnimatePresence initial={false}>
          {(messages || []).length > 0 ? (
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
                    msg.role === 'user' ? "bg-slate-900 text-white" : "bg-white/80 backdrop-blur-xl border border-white/80 text-slate-700"
                  )}>
                    {msg.imageUri && <img src={msg.imageUri} alt="Source" className="max-w-full rounded-2xl mb-4" />}
                    <div className="whitespace-pre-wrap">{msg.content || "[Empty Message]"}</div>
                  </div>
                  {msg.data && <RichAnalysisCard data={msg.data} />}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-12 px-4">
              <AICoreOrbit state={isProcessing ? "thinking" : "idle"} isFocused={isFocused} />
              <div className="space-y-4">
                <h2 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter text-slate-900 leading-[0.85]">Intelligence<br/>Hub</h2>
                <p className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-400">Autonomous Forge Active</p>
              </div>
            </div>
          )}
          
          {isProcessing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 text-center">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 text-blue-400/40 animate-spin" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Logic Loop Iterating...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="fixed bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 sm:px-6 z-50">
        <div className="relative group">
          <div className="relative flex items-center gap-2 sm:gap-4 bg-white/90 backdrop-blur-3xl border border-white/80 shadow-2xl rounded-[2.5rem] px-4 sm:px-6 py-3 sm:py-4 transition-all">
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="text-slate-300 hover:text-slate-500 transition-colors shrink-0">
              <ImageIcon className="w-5 h-5" />
            </button>
            <textarea 
              ref={textareaRef}
              rows={1}
              value={input}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Describe intent..."
              className="flex-1 bg-transparent border-0 focus:ring-0 text-sm font-medium text-slate-700 placeholder:text-slate-300 resize-none py-1 max-h-[200px] stealth-scrollbar"
            />
            <button onClick={sendMessage} disabled={isProcessing || (!input.trim() && !selectedImage)} className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg active:scale-95 transition-all shrink-0",
              (input.trim() || selectedImage) ? "bg-primary shadow-blue-500/20" : "bg-slate-100 text-slate-300"
            )}>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <PaywallOverlay isOpen={showPaywall} onClose={() => setShowPaywall(false)} />
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
