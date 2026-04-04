"use client";

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Bell, Activity, ShieldCheck, Zap, Clock, ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, limit } from 'firebase/firestore';
import { motion } from 'framer-motion';

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
    <header className="fixed top-4 right-6 left-6 lg:left-[calc(var(--sidebar-width)+1.5rem)] z-40 h-16 flex items-center px-6 justify-between transition-all glass-panel rounded-[2rem]">
      <div className="flex items-center gap-6">
        <SidebarTrigger className="text-slate-400 hover:text-primary transition-colors floating-button" />
        
        <div className="hidden md:flex items-center gap-2 border-l border-slate-200/60 pl-6">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/40 hover:bg-white/80 transition-all cursor-default border border-white/40 shadow-sm"
          >
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 leading-none mb-0.5">Saved</span>
              <span className="text-sm font-bold text-slate-900 leading-none">${totalSaved.toFixed(0)}</span>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/40 hover:bg-white/80 transition-all cursor-default border border-white/40 shadow-sm"
          >
            <div className="w-7 h-7 rounded-full bg-success/10 flex items-center justify-center text-success">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 leading-none mb-0.5">Reclaimed</span>
              <span className="text-sm font-bold text-slate-900 leading-none">14.2h</span>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-success/5 border border-success/10 rounded-full">
          <div className="status-dot-active" />
          <span className="text-[10px] font-bold text-success uppercase tracking-widest">Neural Link Stable</span>
        </div>

        <div className="flex items-center gap-1">
          <Popover>
            <PopoverTrigger asChild>
              <button className="p-2.5 text-slate-400 hover:text-primary hover:bg-white/60 rounded-full transition-all relative floating-button">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full border-2 border-white" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 glass-panel p-4 shadow-xl mt-4 rounded-[2rem] border-white/60" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100/60 pb-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Intelligence Alerts</p>
                  <Badge className="bg-primary/10 text-primary border-0 rounded-full text-[9px] px-2.5 py-0.5">2 New</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex gap-3 p-3 hover:bg-white/60 rounded-2xl transition-all cursor-pointer group border border-transparent hover:border-white/40">
                    <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-900">Optimization Ready</p>
                      <p className="text-[11px] text-slate-500 leading-relaxed">Agent identified a lower rate for your Netflix subscription.</p>
                    </div>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <Link href="/settings" className="p-2.5 text-slate-400 hover:text-primary hover:bg-white/60 rounded-full transition-all floating-button">
            <Activity className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
