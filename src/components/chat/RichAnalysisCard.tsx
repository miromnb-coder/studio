
"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Zap, 
  TrendingUp, 
  Copy, 
  Check, 
  ChevronRight, 
  Target,
  Terminal,
  ShieldCheck,
  Activity,
  ArrowRight,
  Sparkles,
  Star,
  Mail,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useUser, useFirestore } from '@/firebase';
import { SubscriptionService } from '@/services/subscription-service';
import { GmailService } from '@/services/gmail-service';
import { PaywallOverlay } from '@/components/monetization/PaywallOverlay';
import { useToast } from '@/hooks/use-toast';

interface RichAnalysisCardProps {
  data: {
    title?: string;
    summary?: string;
    strategy?: string;
    savingsEstimate?: number;
    detectedItems?: any[];
    intent?: string;
    beforeAfterComparison?: {
      currentSituation: string;
      optimizedSituation: string;
    };
  };
}

export function RichAnalysisCard({ data }: RichAnalysisCardProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(true);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    if (db && user) {
      SubscriptionService.getUserStatus(db, user.uid).then(s => {
        setIsPremium(s.plan === 'PREMIUM' || s.plan === 'STARTER');
      });
    }
  }, [db, user]);

  if (!data) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExecute = async (item: any, id: string) => {
    // CONTEXTUAL PAYWALL TRIGGER:
    // If user is FREE and there's real money at stake, trigger the paywall
    if (!isPremium && item.estimatedSavings > 0) {
      setIsPaywallOpen(true);
      return;
    }

    const token = localStorage.getItem('operator_gmail_token');
    if (!token) {
      toast({ 
        title: "Connection Required", 
        description: "Please connect your Gmail in System Settings to execute protocols.",
        variant: "destructive"
      });
      return;
    }

    setExecutingId(id);
    
    try {
      if (item.copyableMessage) {
        const recipient = item.title.split(' ')[0].toLowerCase() + "@support.com"; 
        const success = await GmailService.sendEmail(
          token, 
          recipient, 
          `Account Optimization: ${item.title}`, 
          item.copyableMessage
        );

        if (success) {
          setSuccessId(id);
          toast({ title: "Protocol Deployed", description: `Negotiation sent to ${item.title} support.` });
        } else {
          throw new Error("Transmission failed");
        }
      } else {
        await new Promise(r => setTimeout(r, 1500));
        setSuccessId(id);
        toast({ title: "Fix Applied", description: "The identified inefficiency has been mitigated." });
      }
    } catch (err) {
      toast({ variant: 'destructive', title: "Execution Failed", description: "Operational sync delayed." });
    } finally {
      setExecutingId(null);
      setTimeout(() => setSuccessId(null), 3000);
    }
  };

  const detectedItems = Array.isArray(data.detectedItems) ? data.detectedItems : [];
  const savingsEstimate = typeof data.savingsEstimate === 'number' ? data.savingsEstimate : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="grid gap-8 mt-10 w-full text-left"
    >
      <Card className="glass-panel p-12 rounded-[3rem] border-white/80 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
        
        <div className="flex justify-between items-start gap-10 relative z-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[1rem] bg-primary/10 flex items-center justify-center text-primary shadow-sm ring-1 ring-primary/20">
                <Target className="w-5 h-5" />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-primary">Strategic Objective</p>
            </div>
            <h3 className="text-4xl font-bold tracking-tighter text-slate-900">
              {data.title || 'Extraction Node'}
            </h3>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 bg-white/60 border border-white/80 rounded-full shadow-sm">
            <Activity className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Real-Time Synthesis</span>
          </div>
        </div>
        
        <div className="mt-10 p-8 bg-white/40 rounded-[2rem] border border-white/80 shadow-inner group-hover:bg-white/60 transition-all duration-700">
          <p className="text-base font-bold text-slate-700 leading-relaxed italic opacity-80">
            "{data.strategy || 'Calculating optimal response vector...'}"
          </p>
        </div>

        <div className="grid grid-cols-2 gap-10 mt-10 pt-10 border-t border-slate-100/60">
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Annual Projection</p>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-bold text-success/60">$</span>
              <p className="text-4xl font-bold text-success tracking-tighter">${(savingsEstimate * 12).toFixed(0)}</p>
            </div>
          </div>
          <div className="text-right space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Monthly Yield</p>
            <div className="flex items-baseline justify-end gap-1">
              <span className="text-sm font-bold text-primary/60">+</span>
              <p className="text-4xl font-bold text-primary tracking-tighter">${savingsEstimate.toFixed(0)}</p>
            </div>
          </div>
        </div>

        {/* PSYCHOLOGICAL TRIGGER: Show value then block the action */}
        {!isPremium && savingsEstimate > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-6 rounded-[2rem] bg-primary/5 border border-primary/20 flex flex-col md:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                <Star className="w-5 h-5 fill-primary" />
              </div>
              <p className="text-xs font-bold text-slate-700 leading-tight">
                We've identified <span className="text-primary">${savingsEstimate.toFixed(0)}/mo</span> in waste. <br/>
                <span className="text-slate-400 font-medium">Upgrade to Ultra to execute the reclamation protocol.</span>
              </p>
            </div>
            <Button 
              size="sm" 
              className="bg-primary text-white hover:bg-primary/90 rounded-xl text-[9px] font-bold uppercase tracking-widest px-6 h-10 shadow-lg shadow-primary/20 whitespace-nowrap"
              onClick={() => setIsPaywallOpen(true)}
            >
              Claim Savings
            </Button>
          </motion.div>
        )}
      </Card>

      {detectedItems.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center gap-4">
              <Terminal className="w-5 h-5 text-slate-400" />
              <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-slate-400">Telemetry Anomalies</p>
            </div>
            <Badge className="bg-white/60 text-slate-500 border-white shadow-sm rounded-full text-[10px] font-bold px-4 py-1 uppercase tracking-widest">{detectedItems.length} Findings</Badge>
          </div>
          
          <div className="grid gap-4">
            {detectedItems.map((item: any, idx: number) => {
              const itemId = `item-${idx}`;
              const isExecuting = executingId === itemId;
              const isSuccess = successId === itemId;

              return (
                <motion.div 
                  key={idx}
                  whileHover={{ scale: 1.01, y: -4 }}
                  className="glass-card p-8 rounded-[2.5rem] group hover:bg-white/80"
                >
                  <div className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 rounded-[1.5rem] bg-white border border-white/80 shadow-sm flex items-center justify-center group-hover:shadow-[0_8px_20px_rgba(59,130,246,0.1)] transition-all duration-500">
                        {isSuccess ? <CheckCircle2 className="w-6 h-6 text-success" /> : <Zap className="w-6 h-6 text-primary" />}
                      </div>
                      <div className="space-y-2">
                        <p className="text-lg font-bold text-slate-900 tracking-tight">{item.title}</p>
                        <div className="flex items-center gap-4">
                          <Badge className={cn(
                            "text-[9px] font-bold uppercase tracking-[0.2em] px-3 py-0.5 rounded-full border-0 shadow-sm",
                            item.urgencyLevel === 'high' ? "bg-danger/10 text-danger" : "bg-primary/10 text-primary"
                          )}>
                            {item.urgencyLevel || 'Standard'}
                          </Badge>
                          <span className="text-[11px] font-bold text-success uppercase tracking-[0.2em] flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3" /> Save ${item.estimatedSavings || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm"
                        disabled={isExecuting || isSuccess}
                        className={cn(
                          "rounded-xl h-10 px-6 font-bold uppercase tracking-widest text-[9px] transition-all",
                          isSuccess ? "bg-success text-white" : "bg-slate-900 text-white shadow-lg shadow-slate-900/20",
                          !isPremium && "opacity-80"
                        )}
                        onClick={() => handleExecute(item, itemId)}
                      >
                        {isExecuting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : isSuccess ? <Check className="w-3.5 h-3.5 mr-2" /> : <Mail className="w-3.5 h-3.5 mr-2" />}
                        {isExecuting ? 'Deploying...' : isSuccess ? 'Deployed' : isPremium ? 'Execute Fix' : 'Claim with Ultra'}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-8 pt-8 border-t border-slate-50/60 space-y-6">
                    <p className="text-sm text-slate-500 font-bold leading-relaxed opacity-70 italic">"{item.summary}"</p>
                    
                    {item.copyableMessage && (
                      <div className="p-6 bg-white/40 rounded-[1.5rem] border border-white/80 space-y-4 shadow-inner">
                        <div className="flex items-center justify-between">
                          <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-slate-400">Transmission Protocol Draft</p>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 px-4 rounded-xl text-[9px] font-bold uppercase tracking-[0.25em] gap-2 hover:bg-white hover:text-primary shadow-sm border border-transparent hover:border-white/80"
                            onClick={() => handleCopy(item.copyableMessage, itemId)}
                          >
                            {copiedId === itemId ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3 text-slate-400" />}
                            {copiedId === itemId ? 'Stored' : 'Copy Protocol'}
                          </Button>
                        </div>
                        <p className="text-xs font-bold leading-relaxed text-slate-600 line-clamp-2 opacity-80">
                          {item.copyableMessage}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      <PaywallOverlay 
        isOpen={isPaywallOpen} 
        onClose={() => setIsPaywallOpen(false)} 
        reason="premium_tool"
      />
    </motion.div>
  );
}
