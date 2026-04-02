
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

interface Alert {
  id: string;
  title: string;
  explanation: string;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  action: string;
  date?: string;
  type: 'trial' | 'price_increase' | 'duplicate' | 'optimization';
}

interface ProactiveAlertsProps {
  analyses: any[];
  isLoading?: boolean;
}

export function ProactiveAlerts({ analyses, isLoading }: ProactiveAlertsProps) {
  const alerts = useMemo(() => {
    if (!analyses || !Array.isArray(analyses)) return [];
    
    const findings: Alert[] = [];
    
    // In a real app, this would be derived from structured data or a dedicated collection
    // For MVP, we derive alerts from the most recent high-burn analyses
    analyses.forEach(analysis => {
      if (analysis.estimatedMonthlySavings > 50) {
        findings.push({
          id: `alert-${analysis.id}`,
          title: 'High Burn Detected',
          explanation: `Your ${analysis.title} analysis indicates potential monthly waste of $${analysis.estimatedMonthlySavings}.`,
          urgency: 'high',
          action: 'Mitigate Waste',
          type: 'optimization',
          date: analysis.analysisDate
        });
      }
    });

    // Mock trial alert for visual readiness
    if (findings.length > 0) {
      findings.unshift({
        id: 'mock-trial',
        title: 'Trial Expiration',
        explanation: 'Your Netflix "Ultra" trial ends in 48 hours. Logic suggests downgrading to Standard.',
        urgency: 'urgent',
        action: 'Downgrade Now',
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
          <div key={i} className="h-32 w-full rounded-2xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="premium-card bg-white/[0.01] border-dashed border-white/5 py-12 text-center space-y-3">
        <TrendingUp className="w-8 h-8 text-white/10 mx-auto" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">No Proactive Alerts</p>
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
            "premium-card relative overflow-hidden group",
            alert.urgency === 'urgent' ? "bg-danger/5 border-danger/10" : "bg-white/[0.02] border-white/5"
          )}>
            <div className="flex gap-5">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                alert.urgency === 'urgent' ? "bg-danger/10 text-danger" : "bg-primary/10 text-primary"
              )}>
                {alert.urgency === 'urgent' ? <AlertTriangle className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
              </div>
              
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white tracking-tight">{alert.title}</h4>
                  <Badge variant={alert.urgency === 'urgent' ? 'destructive' : 'secondary'} className="text-[8px] font-bold uppercase tracking-widest px-1.5 h-4">
                    {alert.urgency}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                  {alert.explanation}
                </p>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">
                    <Calendar className="w-3 h-3" />
                    {alert.date ? new Date(alert.date).toLocaleDateString() : 'Immediate'}
                  </div>
                  <Button asChild variant="link" className={cn(
                    "p-0 h-auto text-[10px] font-bold uppercase tracking-widest hover:no-underline group-hover:translate-x-1 transition-transform",
                    alert.urgency === 'urgent' ? "text-danger" : "text-primary"
                  )}>
                    <Link href="/">
                      {alert.action} <ArrowRight className="w-3 h-3 ml-1.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
