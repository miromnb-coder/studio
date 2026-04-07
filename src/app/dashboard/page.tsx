
"use client";

import { SystemCard } from '@/components/systems/SystemCard';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, where, doc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, ShieldCheck, Zap, ChevronRight, Activity, Clock, Cpu, BarChart3, Bell, ArrowRight, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useEffect, useState } from 'react';
import { ProactiveAlerts } from '@/components/dashboard/ProactiveAlerts';
import { DigestService, DailyDigest } from '@/services/digest-service';
import { DailyDigestCard } from '@/components/chat/DailyDigestCard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { SubscriptionService } from '@/services/subscription-service';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [latestDigest, setLatestDigest] = useState<DailyDigest | null>(null);
  const [status, setStatus] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Sync profile and get status
  useEffect(() => {
    if (db && user && !isUserLoading) {
      console.log('[DASHBOARD] User ready, fetching status...');
      SubscriptionService.getUserStatus(db, user.uid)
        .then(res => {
          setStatus(res);
          setIsInitializing(false);
        })
        .catch((err) => {
          console.error('[DASHBOARD] Initialization error:', err);
          setIsInitializing(false);
        });
    } else if (!isUserLoading && !user) {
      // Not logged in
      setIsInitializing(false);
    }
  }, [db, user, isUserLoading]);

  const analysesQuery = useMemoFirebase(() => {
    if (!db || !user || isUserLoading || isInitializing) return null;
    return query(
      collection(db, 'users', user.uid, 'analyses'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
  }, [db, user, isUserLoading, isInitializing]);

  const { data: analyses, isLoading, error: analysesError } = useCollection(analysesQuery);

  const alertsQuery = useMemoFirebase(() => {
    if (!db || !user || isUserLoading || isInitializing) return null;
    return query(
      collection(db, 'users', user.uid, 'alerts'),
      where('isDismissed', '==', false),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
  }, [db, user, isUserLoading, isInitializing]);

  const { data: alerts, isLoading: isAlertsLoading, error: alertsError } = useCollection(alertsQuery);
  
  useEffect(() => {
    if (db && user && !isUserLoading && !isInitializing) {
      DigestService.getLatestDigest(db, user.uid)
        .then(digest => setLatestDigest(digest));
    }
  }, [db, user, isUserLoading, isInitializing, analyses]);

  const totalReclaimed = useMemo(() => {
    return (analyses ?? []).reduce((acc, a) => acc + (a.estimatedMonthlySavings || 0), 0);
  }, [analyses]);

  const reclaimedHours = useMemo(() => {
    return (totalReclaimed / 50).toFixed(1);
  }, [totalReclaimed]);

  const activePatterns = (analyses ?? []).filter(a => a.status === 'completed').length;

  if (isUserLoading || isInitializing) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Accessing Neural Telemetry...</p>
      </div>
    );
  }

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-16"
    >
      <motion.header variants={item} className="space-y-6">
        <div className="flex items-center gap-3 px-4 py-1.5 bg-primary/5 border border-primary/10 rounded-full w-fit">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-bold text-primary uppercase tracking-[0.3em]">Operational Readiness: {status?.label || 'Verified'}</span>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-slate-900 leading-[0.85]">
            Intelligence.<br/>Briefing
          </h1>
          <p className="text-lg text-slate-500 font-medium max-w-xl leading-relaxed">
            Consolidated telemetry from your autonomous reasoning cycles and optimization protocols.
          </p>
        </div>
      </motion.header>

      {(analysesError || alertsError) && (
        <Alert variant="destructive" className="rounded-3xl border-danger/20 bg-danger/5">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Telemetry Sync Latency</AlertTitle>
          <AlertDescription>
            Your neural environment is still settling. Data will populate as signals are verified.
          </AlertDescription>
        </Alert>
      )}

      <AnimatePresence>
        {latestDigest && (
          <motion.section 
            variants={item}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-[0.3em]">Neural Synthesis Complete</h3>
            </div>
            <DailyDigestCard digest={latestDigest} />
          </motion.section>
        )}
      </AnimatePresence>

      <div className="grid gap-12 lg:grid-cols-3 items-start">
        <motion.div variants={item} className="lg:col-span-2 space-y-8">
          <div className="grid gap-8 sm:grid-cols-2">
            <SystemCard 
              title="Action Engine"
              description="Autonomous reasoning loop for immediate tactical execution."
              status="active"
              value={`$${totalReclaimed.toFixed(0)}`}
              metrics={[
                { label: 'Latency', value: '0.04ms' },
                { label: 'Directives', value: `${activePatterns} Active` }
              ]}
              actions={[
                { label: 'Open Ledger', variant: 'primary', onClick: () => router.push('/money-saver') },
                { label: 'Neural Sync', variant: 'secondary', onClick: () => router.push('/history') }
              ]}
            >
              <div className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50/50 border border-slate-100 cursor-pointer hover:bg-slate-100 transition-all" onClick={() => router.push('/money-saver')}>
                <BarChart3 className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-slate-600">Audit Ledger: {(analyses ?? []).length} Entries.</span>
              </div>
            </SystemCard>

            <SystemCard 
              title="Optimization Hub"
              description="Deep pattern recognition results and mitigation vectors."
              status={isLoading ? "syncing" : "active"}
              value={`+${reclaimedHours}h`}
              metrics={[
                { label: 'Efficiency', value: (analyses ?? []).length ? '84%' : '0%' },
                { label: 'Confidence', value: 'High' }
              ]}
              actions={[
                { label: 'View Insights', variant: 'primary', onClick: () => router.push('/money-saver') }
              ]}
            >
               <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-2xl bg-white/40 border border-white/60 flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[10px] font-bold text-slate-500">Stable</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/40 border border-white/60 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-success" />
                    <span className="text-[10px] font-bold text-slate-500">Live Sync</span>
                  </div>
               </div>
            </SystemCard>
          </div>

          <section className="space-y-8">
            <div className="flex items-center gap-4">
              <Terminal className="w-5 h-5 text-slate-400" />
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.4em]">Operational Telemetry</h3>
            </div>

            <div className="space-y-4">
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="h-24 w-full rounded-4xl bg-white/20 animate-pulse" />
                ))
              ) : analyses && analyses.length > 0 ? (
                (analyses ?? []).map((a, idx) => (
                  <motion.div 
                    key={a.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => router.push(`/results/${a.id}`)}
                    className="p-6 rounded-4xl bg-white/40 border border-white/60 flex items-center justify-between group hover:bg-white/80 transition-all cursor-pointer shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-primary shadow-sm group-hover:shadow-md transition-all">
                        <Zap className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{a.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {new Date(a.createdAt?.toDate?.() || Date.now()).toLocaleTimeString()}
                          </p>
                          <span className="text-slate-200 text-xs">•</span>
                          <p className="text-[10px] font-bold text-success uppercase tracking-widest">
                            RECLAIMED ${a.estimatedMonthlySavings}
                          </p>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary transition-colors" />
                  </motion.div>
                ))
              ) : (
                <div className="p-16 text-center border-2 border-dashed border-slate-200 rounded-[3rem] opacity-40 space-y-4">
                  <Cpu className="w-12 h-12 text-slate-300 mx-auto" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Telemetry feed silent</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Run an audit to generate signals</p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </motion.div>

        <motion.aside variants={item} className="space-y-8">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-primary" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-[0.3em]">Proactive Intelligence</h3>
          </div>
          
          <ProactiveAlerts alerts={alerts ?? []} isLoading={isAlertsLoading} />

          <div className="p-8 rounded-[2.5rem] bg-slate-900 text-white space-y-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/30 transition-all" />
            <div className="space-y-2 relative z-10">
              <p className="text-[10px] font-bold text-primary uppercase tracking-[0.3em]">System Health</p>
              <h4 className="text-2xl font-bold tracking-tight">Logic Coverage: 94%</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed relative z-10">
              Your agent is currently monitoring for price hikes, trial expirations, and duplicate billing signals.
            </p>
            <button className="text-[10px] font-bold uppercase tracking-widest text-white flex items-center gap-2 group/btn" onClick={() => router.push('/settings')}>
              Manage Signals <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.aside>
      </div>
    </motion.div>
  );
}
