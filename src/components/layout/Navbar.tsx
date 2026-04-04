"use client";

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Cpu, Bell, Zap, Clock, Coins, Activity, Network } from 'lucide-react';
import { motion } from 'framer-motion';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
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
    <header className="fixed top-0 right-0 left-0 lg:left-[var(--sidebar-width)] z-40 bg-white/60 backdrop-blur-md border-b border-slate-200/50 h-20 flex items-center px-8 justify-between">
      <div className="flex items-center gap-8">
        <SidebarTrigger className="text-slate-400 hover:text-nordic-sage transition-colors" />
        
        {/* Value Strip Mini */}
        <div className="hidden xl:flex items-center gap-10">
          <div className="flex items-center gap-3 group cursor-default">
            <div className="w-10 h-10 rounded-2xl bg-nordic-moss/30 flex items-center justify-center text-nordic-sage transition-transform group-hover:scale-105">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Monthly Saved</p>
              <p className="text-sm font-semibold text-slate-900">${totalSaved.toFixed(0)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 group cursor-default">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 transition-transform group-hover:scale-105">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Time Gain</p>
              <p className="text-sm font-semibold text-slate-900">12.4h</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden sm:flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-nordic-moss/20 border border-nordic-moss/30 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_rgba(16,185,129,0.2)]" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-nordic-sage">Operator Active</span>
        </div>

        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <button className="p-3 rounded-2xl hover:bg-slate-100 text-slate-400 transition-all relative group">
                <Bell className="w-5 h-5 group-hover:text-nordic-sage" />
                <span className="absolute top-3 right-3 w-2 h-2 bg-nordic-sage rounded-full border-2 border-white shadow-sm" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-white border-slate-100 p-5 rounded-[2rem] shadow-2xl mt-4" align="end">
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Notifications</p>
                  <Badge className="bg-nordic-moss/30 text-nordic-sage border-0 h-5 px-2 text-[9px] font-bold">New</Badge>
                </div>
                <div className="space-y-3">
                  <div className="flex gap-4 p-4 rounded-2xl hover:bg-nordic-silk transition-all cursor-pointer group">
                    <div className="w-11 h-11 rounded-2xl bg-nordic-moss/20 text-nordic-sage flex items-center justify-center shrink-0">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-900 group-hover:text-nordic-sage transition-colors truncate">Optimization Ready</p>
                      <p className="text-[10px] text-slate-500 leading-relaxed">New findings in Netflix subscription.</p>
                    </div>
                  </div>
                </div>
                <Button asChild variant="outline" className="w-full h-11 text-[10px] font-bold uppercase tracking-widest border-slate-100 rounded-xl hover:bg-nordic-silk">
                  <Link href="/dashboard">View All</Link>
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          
          <Link href="/settings" className="p-3 rounded-2xl hover:bg-slate-100 text-slate-400 transition-all">
            <Network className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}