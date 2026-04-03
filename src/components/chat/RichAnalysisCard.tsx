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
    if (!text) return;
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
      {/* Executive Strategy Card */}
      <Card className="premium-card bg-primary/10 border-primary/20 p-8 space-y-4">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Operatiivinen Strategia</p>
            <h3 className="text-4xl font-bold font-headline text-white tracking-tighter">
              Reaktiosuunnitelma
            </h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
            <BrainCircuit className="w-6 h-6" />
          </div>
        </div>
        <p className="text-sm font-medium text-white/80 leading-relaxed border-l-2 border-primary/30 pl-4 py-2 italic bg-primary/5 rounded-r-xl">
          "{data.strategy || 'Strategiaa valmistellaan...'}"
        </p>
        <div className="pt-4 flex items-center justify-between border-t border-white/5">
          <div className="space-y-1">
            <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Arvioitu Vuotuinen Säästö</p>
            <p className="text-2xl font-bold text-success font-headline">${(savingsEstimate * 12).toFixed(0)}</p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Kuukausittainen Likviditeetti</p>
            <p className="text-2xl font-bold text-primary font-headline">+${savingsEstimate.toFixed(0)}</p>
          </div>
        </div>
      </Card>

      {/* Comparison Grid */}
      {data.beforeAfterComparison && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="premium-card !p-5 bg-white/[0.02] border-white/5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Nykyinen tila</p>
            </div>
            <p className="text-xs font-medium italic opacity-60 leading-relaxed">"{data.beforeAfterComparison.currentSituation || 'Vakiotila.'}"</p>
          </Card>
          <Card className="premium-card !p-5 bg-success/5 border-success/10 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              <p className="text-[9px] font-bold uppercase tracking-widest text-success">Optimoitu tila</p>
            </div>
            <p className="text-xs font-medium text-success/80 leading-relaxed">"{data.beforeAfterComparison.optimizedSituation || 'Optimoitu protokolla.'}"</p>
          </Card>
        </div>
      )}

      {/* Detected Findings */}
      {detectedItems.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Havaitut poikkeamat ({detectedItems.length})</p>
          </div>
          
          <div className="grid gap-3">
            {detectedItems.map((item: any, idx: number) => {
              if (!item) return null;
              return (
                <Card key={idx} className="premium-card !p-0 overflow-hidden bg-white/[0.01] border-white/5 group">
                  <div className="p-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold tracking-tight text-white">{item.title || 'Tuntematon havainto'}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[8px] h-4 font-bold uppercase tracking-widest px-1.5 border-white/10">
                            {item.urgencyLevel || 'low'}
                          </Badge>
                          <span className="text-[9px] font-bold text-success uppercase tracking-widest">Säästä ${item.estimatedSavings || 0}/kk</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
                  </div>
                  
                  <div className="px-5 pb-5 pt-0 space-y-4">
                    <p className="text-xs text-muted-foreground leading-relaxed italic border-l border-white/10 pl-3">"{item.summary || 'Ei kuvausta.'}"</p>
                    
                    {item.alternativeSuggestion && (
                      <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-between group/alt cursor-pointer hover:bg-primary/10 transition-all">
                        <div className="flex items-center gap-3">
                          <TrendingUp className="w-3.5 h-3.5 text-primary" />
                          <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Suositeltu vaihtoehto</span>
                        </div>
                        <span className="text-[11px] font-bold text-white flex items-center gap-1">
                          {item.alternativeSuggestion} <ArrowRight className="w-3 h-3 group-hover/alt:translate-x-1 transition-transform" />
                        </span>
                      </div>
                    )}

                    {item.copyableMessage && (
                      <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">
                            <MessageSquare className="w-3 h-3" />
                            Toimenpideviesti
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 px-2 text-[8px] font-bold uppercase tracking-widest gap-1.5 hover:bg-white/5"
                            onClick={() => handleCopy(item.copyableMessage, `item-${idx}`)}
                          >
                            {copiedId === `item-${idx}` ? <Check className="w-2.5 h-2.5 text-success" /> : <Copy className="w-2.5 h-2.5" />}
                            {copiedId === `item-${idx}` ? 'Kopioitu' : 'Kopioi'}
                          </Button>
                        </div>
                        <p className="text-[11px] font-mono leading-relaxed text-muted-foreground/80 line-clamp-2">
                          {item.copyableMessage}
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
