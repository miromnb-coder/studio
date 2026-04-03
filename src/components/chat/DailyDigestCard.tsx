
"use client";

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CalendarDays, 
  TrendingUp, 
  Zap, 
  ArrowRight,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface DailyDigestCardProps {
  digest: {
    date: string;
    summary: string;
    estimatedMonthlySavings: number;
    findingsCount: number;
    topActions: any[];
  };
}

export function DailyDigestCard({ digest }: DailyDigestCardProps) {
  if (!digest) return null;

  const topActions = Array.isArray(digest.topActions) ? digest.topActions : [];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full mt-6"
    >
      <Card className="premium-card bg-[#1E1E22] border-primary/20 p-0 overflow-hidden shadow-[0_24px_64px_-12px_rgba(148,148,247,0.15)]">
        {/* Header */}
        <div className="bg-primary/5 p-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">Intelligence Briefing</p>
              <h3 className="text-xl font-bold font-headline text-white">Daily Digest • {new Date(digest.date).toLocaleDateString()}</h3>
            </div>
          </div>
          <Badge variant="outline" className="border-primary/20 text-primary uppercase text-[8px] font-bold tracking-widest px-3">
            Live Pattern Sync
          </Badge>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex-1 space-y-4">
              <p className="text-lg text-muted-foreground font-medium leading-relaxed italic">
                "{digest.summary || 'Summary finalized for the current period.'}"
              </p>
              <div className="flex items-center gap-4 pt-2">
                <div className="px-4 py-2 rounded-xl bg-success/10 border border-success/20 text-success text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5" />
                  +${(digest.estimatedMonthlySavings || 0).toFixed(0)}/mo saved
                </div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">
                  {digest.findingsCount || 0} Audits Processed
                </div>
              </div>
            </div>

            {topActions.length > 0 && (
              <div className="w-full md:w-64 space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Top Reclaimed Items</p>
                <div className="space-y-2">
                  {topActions.map((action, i) => (
                    <div key={i} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between group cursor-pointer hover:bg-white/5 transition-colors">
                      <span className="text-[11px] font-bold text-white truncate max-w-[120px]">{action.title}</span>
                      <Badge className={cn(
                        "text-[8px] px-1.5 h-4 font-bold uppercase",
                        action.urgency === 'high' ? "bg-danger/20 text-danger border-0" : "bg-primary/20 text-primary border-0"
                      )}>
                        {action.urgency || 'medium'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/30">
            <ShieldCheck className="w-3 h-3" />
            Secure Audit Sandbox
          </div>
          <Button asChild size="sm" className="rounded-xl h-10 px-6 font-bold uppercase tracking-widest text-[10px] gap-2">
            <Link href="/dashboard">
              View Console <ArrowRight className="w-3 h-3" />
            </Link>
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
