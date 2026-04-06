
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
  Loader2,
  Trash2
} from 'lucide-react';
import Link from 'next/link';
import { useFirestore, useUser, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';

interface Alert {
  id: string;
  title: string;
  explanation: string;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  actionLabel?: string;
  date?: any;
  type: 'trial' | 'price_increase' | 'duplicate' | 'optimization';
  analysisId?: string;
  impact?: number;
}

interface ProactiveAlertsProps {
  alerts: Alert[];
  isLoading?: boolean;
}

export function ProactiveAlerts({ alerts, isLoading }: ProactiveAlertsProps) {
  const db = useFirestore();
  const { user } = useUser();

  const handleDismiss = async (alertId: string) => {
    if (!db || !user) return;
    const alertRef = doc(db, 'users', user.uid, 'alerts', alertId);
    updateDocumentNonBlocking(alertRef, { isDismissed: true });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-32 w-full rounded-3xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <div className="p-12 text-center rounded-[2.5rem] border-2 border-dashed border-slate-100 opacity-40 space-y-3">
        <TrendingUp className="w-8 h-8 text-slate-300 mx-auto" />
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Signals Optimal</p>
          <p className="text-[8px] font-bold uppercase text-slate-300">No immediate intelligence triggers</p>
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
                  <div className="flex items-center gap-2">
                    <Badge variant={alert.urgency === 'urgent' ? 'destructive' : 'secondary'} className="text-[8px] font-bold uppercase tracking-widest px-2 h-5 rounded-full border-0">
                      {alert.urgency}
                    </Badge>
                    <button 
                      onClick={() => handleDismiss(alert.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-danger transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  {alert.explanation}
                </p>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                    <Calendar className="w-3.5 h-3.5 opacity-40" />
                    {alert.impact ? `Impact: $${alert.impact}/mo` : 'Immediate'}
                  </div>
                  <Button asChild variant="link" className={cn(
                    "p-0 h-auto text-[10px] font-bold uppercase tracking-widest hover:no-underline group-hover:translate-x-1 transition-transform",
                    alert.urgency === 'urgent' ? "text-danger" : "text-primary"
                  )}>
                    <Link href={alert.analysisId ? `/results/${alert.analysisId}` : '/money-saver'}>
                      {alert.actionLabel || 'Inspect'} <ArrowRight className="w-3 h-3 ml-1.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
            {alert.urgency === 'urgent' && (
              <div className="absolute top-0 right-0 w-24 h-24 bg-danger/5 rounded-full blur-2xl -mr-12 -mt-12" />
            )}
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
