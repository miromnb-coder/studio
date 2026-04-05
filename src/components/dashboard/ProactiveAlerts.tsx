"use client";

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Zap, 
  Calendar, 
  ArrowRight,
  TrendingUp,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface Alert {
  id: string;
  title: string;
  explanation: string;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  action: string;
  date?: string;
  type: 'trial' | 'price_increase' | 'duplicate' | 'optimization';
  analysisId?: string;
}

interface ProactiveAlertsProps {
  analyses: any[];
  isLoading?: boolean;
}

export function ProactiveAlerts({ analyses, isLoading }: ProactiveAlertsProps) {
  const alerts = useMemo(() => {
    if (!analyses || !Array.isArray(analyses)) return [];
    
    const findings: Alert[] = [];
    
    // Scan recent analyses for urgency markers
    analyses.forEach(analysis => {
      // High Burn Trigger
      if (analysis.estimatedMonthlySavings > 50) {
        findings.push({
          id: `alert-${analysis.id}`,
          title: 'High Burn Detected',
          explanation: `Potential waste of $${analysis.estimatedMonthlySavings}/mo identified in your "${analysis.title}" audit.`,
          urgency: 'high',
          action: 'Mitigate Now',
          type: 'optimization',
          date: analysis.analysisDate,
          analysisId: analysis.id
        });
      }
    });

    // Add strategic mock alert for "Trial Expiration" to demonstrate the system
    if (analyses.length > 0) {
      findings.unshift({
        id: 'mock-trial-exp',
        title: 'Trial Ending in 48h',
        explanation: 'Your YouTube Premium trial expires soon. Operator suggests downgrading to avoid automatic $15.99 charge.',
        urgency: 'urgent',
        action: 'Review Protocol',
        type: 'trial',
        date: new Date(Date.now() + 172800000).toISOString()
      });
    }

    return findings.slice(0, 3);
  }, [analyses]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-32 w-full rounded-3xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="p-12 text-center rounded-[2.5rem] border-2 border-dashed border-slate-100 opacity-40 space-y-3">
        <TrendingUp className="w-8 h-8 text-slate-300 mx-auto" />
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Signals Optimal</p>
          <p className="text-[8px] font-bold uppercase text-slate-300">No immediate liquidity leaks detected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {alerts.map((alert, i) => (
        <motion.div
          key={alert.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <Card className={cn(
            "p-6 rounded-[2rem] border-white shadow-sm overflow-hidden relative group transition-all hover:shadow-md",
            alert.urgency === 'urgent' ? "bg-danger/[0.02] border-danger/10" : "bg-white/40"
          )}>
            <div className="flex gap-5 relative z-10">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                alert.urgency === 'urgent' ? "bg-danger/10 text-danger" : "bg-primary/10 text-primary"
              )}>
                {alert.urgency === 'urgent' ? <AlertTriangle className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
              </div>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 tracking-tight">{alert.title}</h4>
                  <Badge variant={alert.urgency === 'urgent' ? 'destructive' : 'secondary'} className="text-[8px] font-bold uppercase tracking-widest px-2 h-5 rounded-full border-0">
                    {alert.urgency}
                  </Badge>
                </div>
                
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  {alert.explanation}
                </p>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                    <Calendar className="w-3.5 h-3.5 opacity-40" />
                    {alert.date ? new Date(alert.date).toLocaleDateString() : 'Immediate'}
                  </div>
                  <Button asChild variant="link" className={cn(
                    "p-0 h-auto text-[10px] font-bold uppercase tracking-widest hover:no-underline group-hover:translate-x-1 transition-transform",
                    alert.urgency === 'urgent' ? "text-danger" : "text-primary"
                  )}>
                    <Link href={alert.analysisId ? `/results/${alert.analysisId}` : '/money-saver'}>
                      {alert.action} <ArrowRight className="w-3 h-3 ml-1.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
            {/* Urgency Glow */}
            {alert.urgency === 'urgent' && (
              <div className="absolute top-0 right-0 w-24 h-24 bg-danger/5 rounded-full blur-2xl -mr-12 -mt-12" />
            )}
          </Card>
        </motion.div>
      ))}
    </div>
  );
}