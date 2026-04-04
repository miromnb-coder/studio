"use client";

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Cpu, Bell, Activity, Network, ShieldAlert, Crosshair } from 'lucide-react';
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
    <header className="fixed top-0 right-0 left-0 lg:left-[var(--sidebar-width)] z-40 bg-stealth-ebon/90 backdrop-blur-md border-b border-stealth-slate h-16 flex items-center px-6 justify-between">
      <div className="flex items-center gap-6">
        <SidebarTrigger className="text-muted-foreground hover:text-primary transition-colors" />
        
        <div className="hidden xl:flex items-center gap-8 border-l border-stealth-slate pl-6 h-8">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Capital_Reclaimed</span>
            <span className="text-xs font-bold text-primary glow-text">${totalSaved.toFixed(0)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Neural_Sync</span>
            <span className="text-xs font-bold text-success uppercase">Active_Link</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1 border border-primary/30 bg-primary/5">
          <div className="w-1.5 h-1.5 bg-primary animate-glow-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Stealth_Mode</span>
        </div>

        <div className="flex items-center gap-1">
          <Popover>
            <PopoverTrigger asChild>
              <button className="p-2 text-muted-foreground hover:text-primary transition-all relative group">
                <Bell className="w-4 h-4" />
                <span className="absolute top-2 right-2 w-1 h-1 bg-primary animate-pulse" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-stealth-onyx border-primary/50 p-4 shadow-2xl mt-4" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-stealth-slate pb-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">System_Alerts</p>
                  <Badge className="bg-primary/20 text-primary border-0 h-4 px-1.5 text-[8px] font-bold">New</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex gap-3 p-3 bg-stealth-ebon border border-stealth-slate hover:border-primary transition-all cursor-pointer group">
                    <ShieldAlert className="w-4 h-4 text-primary shrink-0" />
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-primary uppercase">Optimization_Ready</p>
                      <p className="text-[9px] text-muted-foreground leading-none">Subscription_Leak_Detected</p>
                    </div>
                  </div>
                </div>
                <Button asChild variant="outline" className="w-full h-8 text-[10px] font-bold uppercase tracking-widest border-stealth-slate hover:bg-primary hover:text-white transition-all">
                  <Link href="/dashboard">Access_Console</Link>
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          
          <Link href="/settings" className="p-2 text-muted-foreground hover:text-primary transition-all">
            <Crosshair className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
