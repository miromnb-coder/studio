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
  Target,
  Terminal,
  ShieldCheck,
  Activity,
  ArrowRight
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
      className="grid gap-6 mt-6 w-full text-left"
    >
      {/* Intelligence Briefing Card */}
      <Card className="glass-panel p-10 rounded-[2rem] space-y-8">
        <div className="flex justify-between items-start gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Target className="w-4 h-4" />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-primary">Strategic Objective</p>
            </div>
            <h3 className="text-3xl font-bold tracking-tight text-slate-900">
              Extraction Protocol
            </h3>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-full">
            <Activity className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Live Logic</span>
          </div>
        </div>
        
        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-sm font-semibold text-slate-700 leading-relaxed italic">
            "{data.strategy || 'Calculated response vector in progress...'}"
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-100">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Annual Projection</p>
            <p className="text-2xl font-bold text-success tracking-tight">${(savingsEstimate * 12).toFixed(0)}</p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Monthly Yield</p>
            <p className="text-2xl font-bold text-primary tracking-tight">+${savingsEstimate.toFixed(0)}</p>
          </div>
        </div>
      </Card>

      {/* Comparison Protocol */}
      {data.beforeAfterComparison && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="glass-card p-6 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <p className="text-[10px] font-bold uppercase tracking-widest">Initial State</p>
            </div>
            <p className="text-xs font-semibold text-slate-500 leading-relaxed italic">"{data.beforeAfterComparison.currentSituation}"</p>
          </div>
          <div className="glass-card p-6 rounded-2xl space-y-3 border-primary/20">
            <div className="flex items-center gap-2 text-primary">
              <Zap className="w-3.5 h-3.5" />
              <p className="text-[10px] font-bold uppercase tracking-widest">Optimized State</p>
            </div>
            <p className="text-xs font-bold text-slate-900 leading-relaxed">"{data.beforeAfterComparison.optimizedSituation}"</p>
          </div>
        </div>
      )}

      {/* Observation Ledger */}
      {detectedItems.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2.5">
              <Terminal className="w-4 h-4 text-slate-400" />
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Anomalies Detected</p>
            </div>
            <Badge className="bg-slate-100 text-slate-500 border-0 rounded-full text-[10px] px-2.5">{detectedItems.length} Findings</Badge>
          </div>
          
          <div className="grid gap-3">
            {detectedItems.map((item: any, idx: number) => (
              <div key={idx} className="glass-card p-6 rounded-2xl group hover:border-primary/20">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-all">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-900">{item.title}</p>
                      <div className="flex items-center gap-3">
                        <Badge className={cn(
                          "text-[9px] font-bold uppercase tracking-wider px-2 rounded-full",
                          item.urgencyLevel === 'high' ? "bg-danger/10 text-danger" : "bg-primary/10 text-primary"
                        )}>
                          {item.urgencyLevel || 'Standard'}
                        </Badge>
                        <span className="text-[10px] font-bold text-success uppercase tracking-wider">Save ${item.estimatedSavings || 0}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 opacity-0 group-hover:opacity-100 transition-all" />
                </div>
                
                <div className="mt-5 pt-5 border-t border-slate-50 space-y-5">
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed">"{item.summary}"</p>
                  
                  {item.copyableMessage && (
                    <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Transmission Draft</p>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider gap-1.5 hover:bg-white hover:text-primary shadow-sm"
                          onClick={() => handleCopy(item.copyableMessage, `item-${idx}`)}
                        >
                          {copiedId === `item-${idx}` ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                          {copiedId === `item-${idx}` ? 'Copied' : 'Copy Draft'}
                        </Button>
                      </div>
                      <p className="text-[11px] font-medium leading-relaxed text-slate-600 line-clamp-2 italic">
                        {item.copyableMessage}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}