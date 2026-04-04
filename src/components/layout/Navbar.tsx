"use client";

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Bell, Activity, ShieldCheck, Zap, Clock, CheckCircle2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, limit } from 'firebase/firestore';

export function Navbar() {
  const { user } = useUser();
  const db = useFirestore();

  const analysesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'analyses'), limit(20));
  }, [db, user]);

  const { data: analyses } = useCollection(analysesQuery);
  const totalSaved = (analyses || []).reduce((acc, a) => acc + (a.estimatedMonthlySavings || 0), 0);

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-[var(--sidebar-width)] z-40 bg-white/60 backdrop-blur-xl border-b border-slate-200/60 h-16 flex items-center px-6 justify-between transition-all">
      <div className="flex items-center gap-6">
        <SidebarTrigger className="text-slate-400 hover:text-primary transition-colors" />
        
        <div className="hidden md:flex items-center gap-8 border-l border-slate-200 pl-6 h-8">
          <div className="flex items-center gap-3 group px-3 py-1.5 rounded-full hover:bg-slate-50 transition-colors">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Zap className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Monthly Saved</span>
              <span className="text-sm font-bold text-slate-900">${totalSaved.toFixed(0)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 group px-3 py-1.5 rounded-full hover:bg-slate-50 transition-colors">
            <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center text-success">
              <Clock className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Time Reclaimed</span>
              <span className="text-sm font-bold text-slate-900">14.2h</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-success/5 border border-success/10 rounded-full">
          <div className="status-dot-active" />
          <span className="text-[11px] font-bold text-success uppercase tracking-wider">System Active</span>
        </div>

        <div className="flex items-center gap-1">
          <Popover>
            <PopoverTrigger asChild>
              <button className="p-2.5 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-full transition-all relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full border-2 border-white" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 glass-panel p-4 shadow-xl mt-4 rounded-3xl" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">System Alerts</p>
                  <Badge className="bg-primary/10 text-primary border-0 rounded-full text-[10px] px-2">New</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex gap-3 p-3 hover:bg-slate-50 rounded-2xl transition-all cursor-pointer group">
                    <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-900">Optimization Ready</p>
                      <p className="text-[11px] text-slate-500 leading-relaxed">Neural analysis identified a new leak in active subscriptions.</p>
                    </div>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <Link href="/settings" className="p-2.5 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-full transition-all">
            <Activity className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}