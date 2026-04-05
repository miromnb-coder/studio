
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
  Sparkles,
  Hammer,
  X,
  Plus,
  MessageSquare,
  Search,
  Clock,
  Layout
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

export default function ChatPage() {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedImage, setSelectedToolImage] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationId = searchParams?.get('c');
  const { toast } = useToast();

  // Check if onboarding is needed
  const convsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'conversations'), limit(1));
  }, [db, user]);
  const { data: convs, isLoading: isConvsLoading } = useCollection(convsQuery);

  useEffect(() => {
    if (!isConvsLoading && convs && convs.length === 0 && !conversationId) {
      setShowOnboarding(true);
    }
  }, [convs, isConvsLoading, conversationId]);

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
    if (!user || !db) return;
    setShowOnboarding(false);
    setIsProcessing(true);

    const goalMap: Record<string, string> = {
      'save_money': 'Optimize my expenses and find hidden savings.',
      'save_time': 'Audit my schedule and automate repetitive tasks.',
      'analyze_visual': 'Analyze my latest financial statements for anomalies.'
    };

    const initialIntent = goalMap[goalId] || 'Initialize general audit.';
    
    try {
      const newRef = doc(collection(db, 'users', user.uid, 'conversations'));
      const activeId = newRef.id;
      
      // 1. Initialize Memory
      await setDoc(doc(db, 'users', user.uid, 'memory', 'main'), {
        userId: user.uid,
        goals: [goalId],
        behaviorSummary: `User initialized with primary focus: ${goalId}.`,
        lastUpdated: serverTimestamp()
      }, { merge: true });

      // 2. Create Conversation
      await setDoc(newRef, { 
        id: activeId, 
        userId: user.uid, 
        title: goalId.replace('_', ' ').toUpperCase(), 
        createdAt: serverTimestamp(), 
        updatedAt: serverTimestamp() 
      });

      router.push(`/?c=${activeId}`);

      // 3. Send Initial Message
      await addDocumentNonBlocking(collection(db, 'users', user.uid, 'conversations', activeId, 'messages'), {
        role: 'user',
        content: initialIntent,
        timestamp: serverTimestamp()
      });

      // 4. Trigger Agent
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          input: initialIntent, 
          history: [], 
          userId: user.uid 
        }),
      });

      if (!response.ok) throw new Error("Operational link failed");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let currentMetadata: any = null;
      let buffer = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          const lines = buffer.split('\n');
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("__METADATA__:")) {
              try {
                currentMetadata = JSON.parse(line.replace("__METADATA__:", ""));
              } catch (e) {}
            } else {
              fullContent += line + "\n";
            }
          }
        }
        if (buffer && !buffer.startsWith("__METADATA__:")) fullContent += buffer;
      }

      await addDocumentNonBlocking(collection(db, 'users', user.uid, 'conversations', activeId, 'messages'), {
        role: 'assistant',
        content: fullContent.trim(),
        timestamp: serverTimestamp(),
        metadata: currentMetadata
      });

    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: "Onboarding Failed", description: "Could not initialize protocol." });
    } finally {
      setIsProcessing(false);
    }
  };

  const sendMessage = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if ((!input.trim() && !selectedImage) || !db || isProcessing) return;

    const currentInput = input;
    const currentImage = selectedImage;
    
    setIsProcessing(true);
    setInput('');
    setSelectedToolImage(null);

    try {
      let activeId = conversationId;
      if (!activeId) {
        const newRef = doc(collection(db, 'users', user.uid, 'conversations'));
        activeId = newRef.id;
        await setDoc(newRef, { 
          id: activeId, 
          userId: user.uid, 
          title: currentInput.slice(0, 30) || "Visual Analysis", 
          createdAt: serverTimestamp(), 
          updatedAt: serverTimestamp() 
        });
        router.push(`/?c=${activeId}`);
      }

      const userMsg = { 
        role: 'user', 
        content: currentInput, 
        imageUri: currentImage,
        timestamp: serverTimestamp() 
      };
      
      await addDocumentNonBlocking(collection(db, 'users', user.uid, 'conversations', activeId, 'messages'), userMsg);
      
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          input: currentInput, 
          history: (messages || []).map(m => ({ role: m.role, content: m.content })), 
          userId: user.uid,
          imageUri: currentImage
        }),
      });

      if (response.status === 403) {
        setShowPaywall(true);
        setIsProcessing(false);
        return;
      }

      if (!response.ok) throw new Error("Operational link failed");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let currentMetadata: any = null;
      let buffer = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          const lines = buffer.split('\n');
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("__METADATA__:")) {
              try {
                currentMetadata = JSON.parse(line.replace("__METADATA__:", ""));
              } catch (e) {
                console.error("Metadata parsing failed", e);
              }
            } else {
              fullContent += line + "\n";
            }
          }
        }
        if (buffer) {
          if (!buffer.startsWith("__METADATA__:")) fullContent += buffer;
        }
      }

      await addDocumentNonBlocking(collection(db, 'users', user.uid, 'conversations', activeId, 'messages'), {
        role: 'assistant',
        content: fullContent.trim(),
        timestamp: serverTimestamp(),
        metadata: currentMetadata
      });
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: "Sync Interrupted", description: "Re-establishing link with intelligence core." });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getModeIcon = (intent?: string) => {
    switch(intent) {
      case 'finance': return <Zap className="w-3.5 h-3.5 text-primary" />;
      case 'time_optimizer': return <Clock className="w-3.5 h-3.5 text-success" />;
      case 'technical': return <Terminal className="w-3.5 h-3.5 text-primary" />;
      case 'analysis': return <Search className="w-3.5 h-3.5 text-accent" />;
      default: return <Activity className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      <AnimatePresence>
        {showOnboarding && <OnboardingOverlay onSelectGoal={handleSelectGoal} />}
      </AnimatePresence>

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
                <div className={cn("max-w-[90%] space-y-4", msg.role === 'user' ? "items-end text-right" : "items-start text-left")}>
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-3 mb-2 px-2">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white/40 border border-white/60 shadow-sm">
                        {getModeIcon(msg.metadata?.intent)}
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Engine V5.6 • {msg.metadata?.intent || 'General'}
                      </span>
                    </div>
                  )}
                  
                  <div className={cn(
                    "p-8 rounded-[2.5rem] text-sm font-medium leading-relaxed shadow-sm overflow-hidden",
                    msg.role === 'user' 
                      ? "bg-slate-900 text-white" 
                      : "glass-surface text-slate-700 border-white/60"
                  )}>
                    {msg.imageUri && (
                      <img src={msg.imageUri} alt="Uploaded source" className="max-w-full rounded-2xl mb-4 border border-white/10" />
                    )}
                    <div className="whitespace-pre-wrap">{msg.content}</div>

                    {msg.role === 'assistant' && msg.metadata?.structuredData && (
                      <RichAnalysisCard 
                        data={{
                          title: (msg.metadata.intent || 'Analysis').toUpperCase() + " Report",
                          strategy: msg.metadata.plan,
                          savingsEstimate: msg.metadata.structuredData.estimatedMonthlySavings || 0,
                          detectedItems: msg.metadata.structuredData.leaks || msg.metadata.structuredData.findings || [],
                          intent: msg.metadata.intent
                        }} 
                      />
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          ) : !showOnboarding && (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-8">
              <div className="w-24 h-24 rounded-[3rem] bg-white border border-slate-100 flex items-center justify-center shadow-xl">
                <Terminal className="w-10 h-10 text-slate-200" />
              </div>
              <div className="space-y-2">
                <h2 className="text-5xl font-bold tracking-tighter text-slate-900 leading-none">Intelligence Hub</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.4em]">Autonomous Forge Active</p>
              </div>
            </div>
          )}
          
          {isProcessing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-start gap-4">
              <div className="flex items-center gap-3 px-2">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reasoning & Executing...</span>
              </div>
              <div className="p-8 rounded-[2.5rem] glass-surface border-white/60 animate-shimmer min-w-[300px]">
                <div className="h-4 bg-slate-100 rounded-full w-24 mb-4" />
                <div className="h-4 bg-slate-100 rounded-full w-64" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 z-50">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-[3rem] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none" />
          
          <GlassCard className="!p-2 rounded-[2.5rem] flex flex-col gap-2 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.12)] border-white/80 transition-all duration-300 bg-white/40 backdrop-blur-3xl relative z-10">
            <AnimatePresence>
              {selectedImage && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-4 pt-4 flex gap-4 overflow-hidden"
                >
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden border border-white/60 shadow-inner group/preview">
                    <img src={selectedImage} alt="Selection" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => setSelectedToolImage(null)}
                      className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/preview:opacity-100 flex items-center justify-center transition-opacity"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-end gap-2">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/*" 
                className="hidden" 
              />
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 mb-0.5",
                  selectedImage ? "text-primary bg-primary/10" : "text-slate-400 hover:bg-white/60 hover:text-slate-600"
                )}
              >
                <ImageIcon className="w-5 h-5" />
              </button>

              <textarea 
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isProcessing}
                placeholder={selectedImage ? "Describe this image..." : "Describe intent or ask for analysis..."}
                className="flex-1 bg-transparent border-0 focus:ring-0 text-sm font-medium text-slate-700 placeholder:text-slate-300 resize-none py-3 min-h-[48px] max-h-[200px] stealth-scrollbar"
              />

              <div className="flex items-center gap-2 mb-0.5 mr-0.5">
                <AnimatePresence mode="wait">
                  {(input.trim() || selectedImage || isProcessing) && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                    >
                      <GlassButton 
                        size="sm" 
                        className="!rounded-full !w-12 !h-12 !p-0 shadow-lg shadow-primary/20 relative overflow-hidden group/send"
                        onClick={sendMessage}
                        loading={isProcessing}
                      >
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover/send:translate-x-[100%] transition-transform duration-700" />
                        {!isProcessing && <ArrowRight className="w-5 h-5" />}
                      </GlassButton>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      <PaywallOverlay 
        isOpen={showPaywall} 
        onClose={() => setShowPaywall(false)} 
        reason="limit_reached" 
      />
    </div>
  );
}
