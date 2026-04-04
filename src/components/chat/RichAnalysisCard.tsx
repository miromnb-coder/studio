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
  Activity,
  Target,
  Terminal
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid gap-4 mt-4 w-full text-left"
    >
      {/* Intelligence Briefing Card */}
      <Card className="bg-stealth-onyx border-l-4 border-primary p-8 space-y-6">
        <div className="flex justify-between items-start gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Target className="w-3 h-3 text-primary animate-glow-pulse" />
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary glow-text">Intel_Strategic_Objective</p>
            </div>
            <h3 className="text-2xl font-bold uppercase tracking-tighter text-white">
              Tactical_Extraction_Plan
            </h3>
          </div>
          <Terminal className="w-6 h-6 text-primary/50" />
        </div>
        
        <div className="p-4 bg-stealth-ebon border border-stealth-slate border-l-2 border-l-primary">
          <p className="text-xs font-bold text-foreground/90 leading-relaxed uppercase">
            "{data.strategy || 'Calculating_Optimal_Response_Vector...'}"
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-stealth-slate">
          <div className="space-y-1">
            <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Annual_Impact_Projection</p>
            <p className="text-xl font-bold text-success tracking-tighter">${(savingsEstimate * 12).toFixed(0)}</p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Monthly_Delta_Shift</p>
            <p className="text-xl font-bold text-primary tracking-tighter glow-text">+${savingsEstimate.toFixed(0)}</p>
          </div>
        </div>
      </Card>

      {/* Comparison Protocol */}
      {data.beforeAfterComparison && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-4 bg-stealth-onyx border border-stealth-slate space-y-2">
            <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Legacy_Operational_State</p>
            <p className="text-[10px] font-bold uppercase opacity-50 leading-relaxed italic">"{data.beforeAfterComparison.currentSituation || 'In_Situ_Data.'}"</p>
          </Card>
          <Card className="p-4 bg-stealth-onyx border border-primary/30 space-y-2">
            <p className="text-[8px] font-bold uppercase tracking-widest text-primary">Target_Extraction_State</p>
            <p className="text-[10px] font-bold uppercase text-primary/80 leading-relaxed">"{data.beforeAfterComparison.optimizedSituation || 'Final_Objective.'}"</p>
          </Card>
        </div>
      )}

      {/* Observation Ledger */}
      {detectedItems.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-2">
            <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-muted-foreground">Observation_Ledger</p>
            <Badge className="bg-stealth-slate text-muted-foreground border-0 text-[8px] font-bold uppercase">{detectedItems.length}_Anomalies</Badge>
          </div>
          
          <div className="grid gap-2">
            {detectedItems.map((item: any, idx: number) => (
              <Card key={idx} className="p-4 bg-stealth-onyx border border-stealth-slate group hover:border-primary transition-all">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-stealth-ebon border border-stealth-slate flex items-center justify-center group-hover:border-primary transition-all">
                      <Zap className="w-4 h-4 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold uppercase tracking-tight text-white">{item.title}</p>
                      <div className="flex items-center gap-3">
                        <Badge className="text-[7px] h-3 font-bold uppercase tracking-widest px-1.5 bg-primary/10 text-primary border border-primary/30">
                          {item.urgencyLevel || 'Standard'}
                        </Badge>
                        <span className="text-[9px] font-bold text-success uppercase tracking-widest">Reclaim_${item.estimatedSavings || 0}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all" />
                </div>
                
                <div className="mt-4 pt-4 border-t border-stealth-slate space-y-4">
                  <p className="text-[10px] text-muted-foreground uppercase leading-relaxed font-bold">"{item.summary}"</p>
                  
                  {item.copyableMessage && (
                    <div className="p-3 bg-stealth-ebon border-l-2 border-l-primary space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[8px] font-bold uppercase tracking-widest text-primary">Transmission_Script</p>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2 text-[8px] font-bold uppercase tracking-widest gap-1 hover:bg-primary hover:text-white"
                          onClick={() => handleCopy(item.copyableMessage, `item-${idx}`)}
                        >
                          {copiedId === `item-${idx}` ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                          {copiedId === `item-${idx}` ? 'SENT' : 'COPY'}
                        </Button>
                      </div>
                      <p className="text-[9px] font-mono leading-relaxed text-muted-foreground/80 line-clamp-2 uppercase">
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
