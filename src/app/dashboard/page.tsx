"use client";

import { useState } from 'react';
import { SystemCard } from '@/components/systems/SystemCard';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { Activity, Terminal, ShieldCheck, Zap } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useUser();
  const db = useFirestore();

  const analysesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'users', user.uid, 'analyses'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
  }, [db, user]);

  const { data: analyses, isLoading } = useCollection(analysesQuery);
  const totalReclaimed = (analyses || []).reduce((acc, a) => acc + (a.estimatedMonthlySavings || 0), 0);

  return (
    <div className="space-y-16">
      <header className="space-y-6">
        <div className="flex items-center gap-3 px-4 py-1.5 bg-primary/5 border border-primary/10 rounded-full w-fit">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-bold text-primary uppercase tracking-[0.3em]">Operational Readiness High</span>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-slate-900 leading-[0.85]">
            Intelligence.<br/>Briefing
          </h1>
          <p className="text-lg text-slate-500 font-medium max-w-xl leading-relaxed">
            Consolidated telemetry from your autonomous reasoning cycles and optimization protocols.
          </p>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-2">
        <SystemCard 
          title="Action Engine"
          description="Autonomous reasoning loop for immediate tactical execution."
          status="active"
          value={`$${totalReclaimed.toFixed(0)}`}
          metrics={[
            { label: 'Latency', value: '0.04ms' },
            { label: 'Directives', value: '84 Active' }
          ]}
          actions={[
            { label: 'Global Audit', variant: 'primary' },
            { label: 'Neural Sync', variant: 'secondary' }
          ]}
        >
          <div className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50/50 border border-slate-100">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs font-bold text-slate-600">All logic cores synchronized.</span>
          </div>
        </SystemCard>

        <SystemCard 
          title="Optimization Hub"
          description="Deep pattern recognition results and mitigation vectors."
          status="syncing"
          value="+4.2h"
          metrics={[
            { label: 'Efficiency', value: '84%' },
            { label: 'Confidence', value: 'High' }
          ]}
          actions={[
            { label: 'View Insights', variant: 'primary' }
          ]}
        />
      </div>

      <section className="space-y-8">
        <div className="flex items-center gap-4">
          <Terminal className="w-5 h-5 text-slate-400" />
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.4em]">Operational Telemetry</h3>
        </div>

        <div className="space-y-4">
          {(analyses || []).map((a, idx) => (
            <motion.div 
              key={a.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="p-6 rounded-4xl bg-white/40 border border-white/60 flex items-center justify-between group hover:bg-white/80 transition-all"
            >
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-primary shadow-sm group-hover:shadow-md transition-all">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{a.title}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    {new Date(a.createdAt?.toDate?.() || Date.now()).toLocaleTimeString()} // RECLAIMED ${a.estimatedMonthlySavings}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary transition-colors" />
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}