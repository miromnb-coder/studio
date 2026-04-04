"use client";

import { useState, useCallback, useMemo, useEffect } from 'react';
import { StatusDot } from '@/components/ui/StatusDot';
import { Bell, LayoutGrid, User, X, Zap, Clock, LogOut, ShieldCheck, Star, Activity, TrendingUp } from 'lucide-react';
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

  const usagePercent = status ? (status.usage.agentRuns / status.usage.limit) * 100 : 0;

  return (
    <>
      <header className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-3rem)] max-w-5xl pointer-events-none">
        <div className="glass-panel h-16 px-4 md:px-6 flex items-center justify-between rounded-full border-white/60 shadow-[0_16px_32px_-8px_rgba(0,0,0,0.1)] pointer-events-auto">
          {/* Left: Navigation Trigger */}
          <div className="flex items-center gap-3 md:gap-4">
            <button 
              onClick={toggleMenu}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:bg-white/60 hover:text-primary transition-all active:scale-95 z-[110]"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
            </button>
            <div className="h-6 w-px bg-slate-200/60 hidden sm:block" />
            <div className="hidden sm:flex flex-col">
              <span className="text-[10px] font-bold tracking-tighter text-slate-900 leading-none">OPERATOR</span>
              <span className="text-[8px] font-bold text-primary uppercase tracking-[0.2em] mt-0.5">INTEL V5.6</span>
            </div>
          </div>

          {/* Center: System Status & Value Indicators */}
          <div className="flex items-center gap-4 md:gap-8">
            <div className="hidden lg:flex items-center gap-4">
              {/* Value Indicator */}
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-success/5 border border-success/10 cursor-default"
              >
                <TrendingUp className="w-3 h-3 text-success" />
                <span className="text-[10px] font-bold text-slate-900">${totalSaved.toFixed(0)} Saved</span>
              </motion.div>

              {/* Usage Meter - Soft Upsell */}
              {status && status.plan === 'FREE' && (
                <div className="flex flex-col w-32 gap-1.5">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Logic Quota</span>
                    <span className="text-[8px] font-bold text-slate-900">{status.usage.agentRuns}/{status.usage.limit}</span>
                  </div>
                  <Progress value={usagePercent} className="h-1 bg-slate-100" />
                </div>
              )}

              {status?.plan === 'PREMIUM' && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-warning/5 border border-warning/20">
                  <Star className="w-3 h-3 text-warning fill-warning" />
                  <span className="text-[9px] font-bold text-slate-900 uppercase">Ultra Access</span>
                </div>
              )}
            </div>
            <StatusDot status="active" />
          </div>

          {/* Right: Actions & Profile */}
          <div className="flex items-center gap-2 md:gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <button className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-white/60 transition-all relative active:scale-90">
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-primary rounded-full border-2 border-white" />
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
                    {status?.plan === 'PREMIUM' ? 'Ultra Clearance' : 'Free Access'}
                  </p>
                </div>
                {status?.plan === 'FREE' && (
                  <button 
                    onClick={() => router.push('/tools')}
                    className="w-full flex items-center gap-3 p-3 text-primary hover:bg-primary/5 rounded-2xl transition-all text-xs font-bold mb-1"
                  >
                    <Star className="w-4 h-4 fill-primary" />
                    Upgrade to Ultra
                  </button>
                )}
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
