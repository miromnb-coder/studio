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
    <header className="fixed top-0 right-0 left-0 lg:left-[var(--sidebar-width)] z-40 bg-background/40 backdrop-blur-3xl border-b border-white/[0.04] h-20 flex items-center px-8 justify-between">
      <div className="flex items-center gap-8">
        <SidebarTrigger className="text-muted-foreground hover:text-white transition-colors" />
        
        {/* Value Strip Mini */}
        <div className="hidden xl:flex items-center gap-10">
          <div className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-success/10 flex items-center justify-center text-success border border-success/10 group-hover:scale-110 transition-transform">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">Liquidity</p>
              <p className="text-sm font-bold text-white tracking-tight">${totalSaved.toFixed(0)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center text-accent border border-accent/10 group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">Time Gain</p>
              <p className="text-sm font-bold text-white tracking-tight">12.4h</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden sm:flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white/[0.03] border border-white/[0.05] shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse shadow-[0_0_8px_rgba(57,217,138,0.5)]" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Neural Link Stable</span>
        </div>

        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <button className="p-3 rounded-2xl hover:bg-white/5 text-muted-foreground transition-all relative group border border-transparent hover:border-white/5">
                <Bell className="w-5 h-5 group-hover:text-white" />
                <span className="absolute top-3 right-3 w-2 h-2 bg-danger rounded-full border-2 border-background glow-danger" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-[#16161a] border-white/10 p-5 rounded-[2rem] shadow-2xl mt-4" align="end">
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Alert Protocols</p>
                  <Badge className="bg-danger/10 text-danger border-0 h-5 px-2 text-[9px] font-bold uppercase tracking-widest">Priority</Badge>
                </div>
                <div className="space-y-3">
                  <div className="flex gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all cursor-pointer group border border-transparent hover:border-white/5">
                    <div className="w-11 h-11 rounded-xl bg-danger/10 text-danger flex items-center justify-center shrink-0 border border-danger/10">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <p className="text-xs font-bold text-white group-hover:text-primary transition-colors truncate">Trial Finalization</p>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">Netflix "Ultra" ends in 48h. Deploy downgrade?</p>
                    </div>
                  </div>
                </div>
                <Button asChild variant="outline" className="w-full h-11 text-[10px] font-bold uppercase tracking-widest border-white/5 rounded-xl hover:bg-white/5">
                  <Link href="/dashboard" className="text-white">Enter Console</Link>
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          
          <Link href="/settings" className="p-3 rounded-2xl hover:bg-white/5 text-muted-foreground transition-all border border-transparent hover:border-white/5">
            <Network className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}