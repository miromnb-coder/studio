"use client";

import { useState, useRef, useEffect, Suspense, memo } from 'react';
import { 
  ArrowRight,
  Loader2,
  ImageIcon,
  Activity,
  Zap,
  ShieldCheck,
  Sparkles,
  Cpu
} from 'lucide-react';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { PaywallOverlay } from '@/components/monetization/PaywallOverlay';
import { OnboardingOverlay } from '@/components/onboarding/OnboardingOverlay';
import AICoreOrbit from '@/components/ai-core/AICoreOrbit';

const BackgroundEnergyField = memo(() => (
  <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#FBFBFE]">
    {/* Shader-style moving halo */}
    <motion.div 
      animate={{
        scale: [1, 1.2, 1],
        x: [0, 50, 0],
        y: [0, 30, 0],
      }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[100vw] rounded-full opacity-[0.03] bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 blur-[120px]"
    />
    
    {/* Fluid energy field (Lower opacity waves) */}
    <div className="absolute inset-0 opacity-[0.05]">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <motion.path 
          d="M0,50 Q25,40 50,50 T100,50 V100 H0 Z" 
          fill="url(#waveGradient)"
          animate={{ d: ["M0,50 Q25,45 50,50 T100,50 V100 H0 Z", "M0,50 Q25,55 50,50 T100,50 V100 H0 Z", "M0,50 Q25,45 50,50 T100,50 V100 H0 Z"] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <defs>
          <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
      </svg>
    </div>

    {/* Micro Particles */}
    {[...Array(20)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 bg-blue-400 rounded-full opacity-[0.08]"
        initial={{ x: Math.random() * 100 + "vw", y: Math.random() * 100 + "vh" }}
        animate={{ 
          y: ["0vh", "100vh"],
          x: ["0vw", "10vw", "-10vw", "0vw"]
        }}
        transition={{ duration: 25 + Math.random() * 20, repeat: Infinity, ease: "linear" }}
      />
    ))}
  </div>
));
BackgroundEnergyField.displayName = 'BackgroundEnergyField';

function ChatContent() {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedToolImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const sendMessage = async () => {
    if (!user || (!input.trim() && !selectedImage) || !db || isProcessing) return;
    setIsProcessing(true);
    // Simulated processing state
    setTimeout(() => setIsProcessing(false), 3000);
  };

  const hasMessages = (messages || []).length > 0;

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full relative">
      <BackgroundEnergyField />
      
      <AnimatePresence>
        {showOnboarding && <OnboardingOverlay onSelectGoal={() => setShowOnboarding(false)} />}
      </AnimatePresence>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-12 pb-48 pt-10 px-4 md:px-0 stealth-scrollbar relative z-10">
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
                    msg.role === 'user' ? "bg-slate-900 text-white" : "bg-white/80 backdrop-blur-xl border border-white/80 text-slate-700"
                  )}>
                    {msg.imageUri && <img src={msg.imageUri} alt="Source" className="max-w-full rounded-2xl mb-4" />}
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : !showOnboarding && (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-12 px-4">
              
              {/* Center Glowing Core */}
              <div className="relative">
                <AICoreOrbit 
                  state={isProcessing ? "thinking" : input.length > 20 ? "reasoning" : "idle"} 
                  isFocused={isFocused}
                />
              </div>
              
              {/* Header Text Section */}
              <div className="space-y-6">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex justify-center"
                >
                  <div className="px-4 py-1.5 rounded-full bg-blue-50/80 backdrop-blur-md border border-blue-100 flex items-center gap-2 shadow-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">System Active</span>
                  </div>
                </motion.div>

                <div className="space-y-3">
                  <h2 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter text-slate-900 leading-[0.9]">
                    Intelligence<br/>Hub
                  </h2>
                  <p className="text-[9px] sm:text-[11px] font-black uppercase tracking-[0.5em] text-slate-400">
                    AUTONOMOUS FORGE ACTIVE
                  </p>
                </div>
              </div>

              {/* Metrics Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl">
                {[
                  { label: "Neural Activity", val: "87%", icon: Activity, color: "text-blue-500" },
                  { label: "Processing Speed", val: "1.8x", icon: Zap, color: "text-cyan-500" },
                  { label: "Confidence", val: "94%", icon: ShieldCheck, color: "text-purple-500" }
                ].map((metric, i) => (
                  <motion.div
                    key={metric.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="p-6 rounded-[2rem] bg-white/40 backdrop-blur-xl border border-white/60 shadow-sm flex flex-col items-start gap-4 text-left group hover:bg-white/60 transition-all"
                  >
                    <div className={cn("w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm", metric.color)}>
                      <metric.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">{metric.label}</p>
                      <p className="text-2xl font-black text-slate-900 tracking-tight">{metric.val}</p>
                    </div>
                    <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        className={cn("h-full", metric.color.replace('text-', 'bg-'))}
                        initial={{ width: 0 }}
                        animate={{ width: metric.val.includes('%') ? metric.val : '70%' }}
                        transition={{ duration: 1.5, delay: 0.8 }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
          
          {isProcessing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4">
              <Loader2 className="w-6 h-6 text-blue-400/40 animate-spin" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Section */}
      <div className="fixed bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 sm:px-6 z-50">
        <div className="relative group">
          <div className={cn(
            "absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-[2.5rem] blur-xl transition-opacity duration-500",
            isFocused ? "opacity-100" : "opacity-0"
          )} />
          <div className="relative flex items-center gap-2 sm:gap-4 bg-white/80 backdrop-blur-3xl border border-white/80 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] rounded-[2.5rem] px-4 sm:px-6 py-3 sm:py-4 transition-all">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              className="hidden" 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="text-slate-300 hover:text-slate-500 transition-colors shrink-0"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            
            <textarea 
              ref={textareaRef}
              rows={1}
              value={input}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe intent..."
              className="flex-1 bg-transparent border-0 focus:ring-0 text-sm font-medium text-slate-700 placeholder:text-slate-300 resize-none py-1 max-h-[200px] stealth-scrollbar"
            />

            <button 
              onClick={sendMessage}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg active:scale-95 transition-all shrink-0",
                (input.trim() || selectedImage) ? "bg-primary shadow-blue-500/20" : "bg-slate-100 text-slate-300"
              )}
            >
              <ArrowRight className="w-5 h-5" />
            </button>
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
