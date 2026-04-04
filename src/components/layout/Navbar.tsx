"use client";

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Cpu, Bell, Zap, Clock, Coins, Activity } from 'lucide-react';
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
    <header className="fixed top-0 right-0 left-0 lg:left-[var(--sidebar-width)] z-40 bg-background/60 backdrop-blur-2xl border-b border-white/[0.05] h-20 flex items-center px-8 justify-between">
      <div className="flex items-center gap-6">
        <SidebarTrigger className="text-muted-foreground hover:text-white transition-colors" />
        <div className="h-6 w-px bg-white/5 hidden md:block" />
        
        {/* Value Strip */}
        <div className="hidden lg:flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center text-success">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Saved</p>
              <p className="text-xs font-bold text-white">${totalSaved.toFixed(0)}/mo</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Time Reclaimed</p>
              <p className="text-xs font-bold text-white">~12.4h</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Automated</p>
              <p className="text-xs font-bold text-white">42 Actions</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.05]">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Neural Link Active</span>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <button className="p-2.5 rounded-xl hover:bg-white/5 text-muted-foreground transition-all relative group">
              <Bell className="w-5 h-5 group-hover:text-white" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-danger rounded-full border-2 border-background" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 bg-card border-white/10 p-4 rounded-2xl shadow-2xl mt-4" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Intelligence Alerts</p>
                <Badge className="bg-danger/10 text-danger border-0 h-4 px-1.5 text-[8px] font-bold">2 Priority</Badge>
              </div>
              <div className="space-y-3">
                <div className="flex gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
                  <div className="w-10 h-10 rounded-xl bg-danger/10 text-danger flex items-center justify-center shrink-0">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <p className="text-xs font-bold text-white group-hover:text-primary transition-colors truncate">Trial Expiring</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">Netflix trial ends in 48h. Action needed.</p>
                  </div>
                </div>
              </div>
              <Button asChild variant="outline" className="w-full h-10 text-[9px] font-bold uppercase tracking-widest border-white/5 rounded-xl">
                <Link href="/dashboard" className="text-white">Full Console</Link>
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}