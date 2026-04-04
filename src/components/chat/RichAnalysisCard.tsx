"use client";

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Zap, 
  TrendingUp, 
  Copy, 
  Check, 
  ChevronRight, 
  MessageSquare,
  ShieldCheck,
  BrainCircuit,
  ArrowRight,
  Activity
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

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

  if (!data) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const detectedItems = Array.isArray(data.detectedItems) ? data.detectedItems : [];
  const savingsEstimate = typeof data.savingsEstimate === 'number' ? data.savingsEstimate : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid gap-6 mt-6 w-full text-left"
    >
      {/* Intelligence Briefing Card */}
      <Card className="premium-card bg-primary/10 border-primary/20 p-10 space-y-6">
        <div className="flex justify-between items-start gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">Intelligence Briefing</p>
            </div>
            <h3 className="text-4xl font-bold font-headline text-white tracking-tighter">
              Operational Strategy
            </h3>
          </div>
          <div className="w-14 h-14 rounded-[1.5rem] bg-primary/20 flex items-center justify-center text-primary">
            <BrainCircuit className="w-7 h-7" />
          </div>
        </div>
        
        <div className="p-6 rounded-[1.5rem] bg-white/[0.03] border-l-4 border-primary/50">
          <p className="text-base font-medium text-white/90 leading-relaxed italic">
            "{data.strategy || 'Strategizing optimized outcome...'}"
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 pt-6 border-t border-white/5">
          <div className="space-y-1">
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Annual Impact</p>
            <p className="text-3xl font-bold text-success font-headline tracking-tighter">${(savingsEstimate * 12).toFixed(0)}</p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Monthly Liquidity</p>
            <p className="text-3xl font-bold text-primary font-headline tracking-tighter">+${savingsEstimate.toFixed(0)}</p>
          </div>
        </div>
      </Card>

      {/* Comparison Protocol */}
      {data.beforeAfterComparison && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="premium-card !p-6 bg-white/[0.02] border-white/5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Legacy State</p>
            </div>
            <p className="text-sm font-medium italic opacity-60 leading-relaxed">"{data.beforeAfterComparison.currentSituation || 'Current protocol.'}"</p>
          </Card>
          <Card className="premium-card !p-6 bg-success/5 border-success/10 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-success">Optimized Target</p>
            </div>
            <p className="text-sm font-medium text-success/80 leading-relaxed">"{data.beforeAfterComparison.optimizedSituation || 'Target state.'}"</p>
          </Card>
        </div>
      )}

      {/* Observation Ledger */}
      {detectedItems.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-muted-foreground" />
              <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted-foreground">Observation Ledger</h4>
            </div>
            <Badge variant="outline" className="border-white/5 text-[9px] opacity-40">{detectedItems.length} Markers</Badge>
          </div>
          
          <div className="grid gap-4">
            {detectedItems.map((item: any, idx: number) => (
              <Card key={idx} className="premium-card !p-0 overflow-hidden bg-white/[0.01] border-white/5 group">
                <div className="p-6 flex items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-all">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-lg font-bold tracking-tight text-white">{item.title}</p>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-[8px] h-4 font-bold uppercase tracking-widest px-2 border-white/10">
                          {item.urgencyLevel || 'Standard'}
                        </Badge>
                        <span className="text-[10px] font-bold text-success uppercase tracking-widest">Reclaim ${item.estimatedSavings || 0}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-all">
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
                
                <div className="px-6 pb-6 pt-0 space-y-6">
                  <p className="text-sm text-muted-foreground leading-relaxed italic border-l-2 border-white/10 pl-4 py-1">"{item.summary}"</p>
                  
                  {item.copyableMessage && (
                    <div className="p-5 rounded-[1.5rem] bg-black/40 border border-white/5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                          <MessageSquare className="w-3.5 h-3.5" />
                          Action Protocol
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 px-4 text-[9px] font-bold uppercase tracking-widest gap-2 hover:bg-white/10"
                          onClick={() => handleCopy(item.copyableMessage, `item-${idx}`)}
                        >
                          {copiedId === `item-${idx}` ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                          {copiedId === `item-${idx}` ? 'Stored' : 'Copy'}
                        </Button>
                      </div>
                      <p className="text-xs font-mono leading-relaxed text-muted-foreground/80 line-clamp-2">
                        {item.copyableMessage}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}