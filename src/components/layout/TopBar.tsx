
"use client";

import { useState, useCallback, useMemo, useEffect } from 'react';
import { StatusDot } from '@/components/ui/StatusDot';
import { Bell, User, X, Zap, LogOut, ShieldCheck, TrendingUp, Menu, Star, ArrowRight, Plus, Search, Clock, Activity } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, limit } from 'firebase/firestore';
import { FloatingNavMenu } from './FloatingNavMenu';
import { motion, AnimatePresence } from 'framer-motion';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { getAuth, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { SubscriptionService } from '@/services/subscription-service';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { UpgradeButton } from '@/components/upgrade/UpgradeButton';

export function TopBar() {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    if (db && user) {
      SubscriptionService.getUserStatus(db, user.uid).then(setStatus);
    }
  }, [db, user]);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    router.push('/login');
  };

  const analysesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'analyses'), limit(20));
  }, [db, user]);

  const { data: analyses } = useCollection(analysesQuery);
  
  const totalSaved = useMemo(() => {
    return (analyses || []).reduce((acc, a) => acc + (a.estimatedMonthlySavings || 0), 0);
  }, [analyses]);

  // Default to showing free/upgrade until premium is confirmed
  const isPremium = status?.plan === 'PREMIUM';
  const usagePercent = status ? (status.usage.agentRuns / status.usage.limit) * 100 : 0;

  return (
    <>
      <header className="fixed top-4 md:top-6 left-1/2 -translate-x-1/2 z-[150] w-[calc(100%-1rem)] md:w-[calc(100%-2rem)] max-w-6xl pointer-events-none">
        <div className="glass-panel h-14 md:h-16 px-2 md:px-4 flex items-center justify-between rounded-full border-white/80 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.15)] pointer-events-auto ring-1 ring-white/20 bg-white/40 backdrop-blur-3xl">
          
          {/* Left Section: Menu & Quick Actions */}
          <div className="flex items-center gap-1 md:gap-3 shrink-0">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleMenu}
              className={cn(
                "h-10 md:h-11 px-3 md:px-4 rounded-full flex items-center gap-2 transition-all z-[160]",
                isMenuOpen 
                  ? "bg-slate-900 text-white shadow-lg" 
                  : "bg-white/80 hover:bg-white text-slate-900 shadow-sm border border-slate-200/50"
              )}
            >
              {isMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              <span className="text-[10px] font-black uppercase tracking-[0.1em] hidden sm:block">Menu</span>
            </motion.button>
            
            <button 
              onClick={() => router.push('/')}
              className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-white/60 hover:bg-white flex items-center justify-center text-slate-400 hover:text-primary transition-all border border-slate-200/50 active:scale-90"
            >
              <Plus className="w-4 h-4" />
            </button>

            <div className="h-6 w-px bg-slate-200/40 hidden lg:block mx-1" />
            
            <div className="hidden lg:flex flex-col">
              <span className="text-[10px] font-bold tracking-tighter text-slate-900 leading-none">OPERATOR</span>
              <span className="text-[8px] font-black text-primary uppercase tracking-[0.2em] mt-0.5">
                {isPremium ? 'ULTRA CLEARANCE' : 'V5.6 CORE'}
              </span>
            </div>
          </div>

          {/* Center Section: Value Metrics & Intelligence Status */}
          <div className="flex items-center gap-2 md:gap-4 flex-1 justify-center px-2 overflow-hidden">
            {/* Real-time Value Metrics (Desktop/Tablet) */}
            <div className="hidden md:flex items-center gap-2">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/40 border border-white/60 shadow-sm cursor-default"
              >
                <Zap className="w-3.5 h-3.5 text-primary" />
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Saved</span>
                  <span className="text-xs font-bold text-slate-900 leading-none">${totalSaved.toFixed(0)}</span>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/40 border border-white/60 shadow-sm cursor-default"
              >
                <Clock className="w-3.5 h-3.5 text-success" />
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Reclaimed</span>
                  <span className="text-xs font-bold text-slate-900 leading-none">14.2h</span>
                </div>
              </motion.div>
            </div>

            {/* Central Usage & Status Pill (Only for Free/Loading) */}
            {!isPremium && (
              <div className="flex items-center gap-2 md:gap-4 bg-slate-50/80 border border-slate-200/50 rounded-full pl-3 pr-1 py-1 h-10 md:h-11 shadow-inner max-w-fit pointer-events-auto">
                {status && (
                  <div className="hidden xs:flex flex-col w-12 md:w-16 gap-1 mr-1">
                    <Progress value={usagePercent} className="h-1 bg-slate-200" />
                    <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none truncate">
                      {status.usage.agentRuns}/{status.usage.limit}
                    </span>
                  </div>
                )}
                <UpgradeButton />
              </div>
            )}

            {/* Neural Link Info (Large Screens Only) */}
            <div className="hidden xl:flex items-center gap-2 px-4 py-2 bg-success/5 border border-success/10 rounded-full">
              <StatusDot status="active" />
              <span className="text-[9px] font-bold text-success uppercase tracking-widest">Neural Link Stable</span>
            </div>
          </div>

          {/* Right Section: Alerts, Search & Profile */}
          <div className="flex items-center gap-1 md:gap-2 shrink-0">
            <button className="hidden sm:flex w-10 h-10 rounded-full items-center justify-center text-slate-400 hover:bg-white/60 transition-all active:scale-90">
              <Search className="w-4 h-4" />
            </button>

            <Popover>
              <PopoverTrigger asChild>
                <button className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-white/60 transition-all relative active:scale-90">
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-3 right-3 w-1.5 h-1.5 bg-primary rounded-full border-2 border-white" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72 md:w-80 glass-panel p-4 shadow-xl mt-4 rounded-[2rem] border-white/60" align="end">
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

            <Popover>
              <PopoverTrigger asChild>
                <button className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm ring-1 ring-slate-100 active:scale-90 transition-transform">
                  {user?.uid ? (
                    <img src={`https://picsum.photos/seed/${user.uid}/40/40`} alt="User" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-50 flex items-center justify-center"><User className="w-4 h-4 text-slate-300" /></div>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 glass-panel p-2 shadow-xl mt-4 rounded-3xl border-white/60" align="end">
                <div className="p-3 border-b border-slate-100/60 mb-1">
                  <p className="text-xs font-bold text-slate-900 truncate">{user?.displayName || 'Active Operator'}</p>
                  <p className="text-[9px] font-bold text-primary uppercase tracking-widest mt-0.5">
                    {isPremium ? 'Ultra Clearance' : 'Free Access'}
                  </p>
                </div>
                {!isPremium && (
                  <button 
                    onClick={() => router.push('/upgrade')}
                    className="w-full flex items-center gap-3 p-3 text-primary hover:bg-primary/5 rounded-2xl transition-all text-xs font-bold"
                  >
                    <Star className="w-4 h-4 fill-primary" />
                    Upgrade to Ultra
                  </button>
                )}
                <button 
                  onClick={() => router.push('/settings')}
                  className="w-full flex items-center gap-3 p-3 text-slate-600 hover:bg-slate-50 rounded-2xl transition-all text-xs font-bold"
                >
                  <Activity className="w-4 h-4" />
                  System Metrics
                </button>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 p-3 text-slate-600 hover:text-danger hover:bg-danger/5 rounded-2xl transition-all text-xs font-bold"
                >
                  <LogOut className="w-4 h-4" />
                  Terminate Session
                </button>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isMenuOpen && (
          <FloatingNavMenu onClose={closeMenu} />
        )}
      </AnimatePresence>
    </>
  );
}
