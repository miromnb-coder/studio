"use client";

import { useState, useCallback, useMemo } from 'react';
import { StatusDot } from '@/components/ui/StatusDot';
import { Bell, LayoutGrid, User, X, Zap, Clock, LogOut, ShieldCheck } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, limit } from 'firebase/firestore';
import { FloatingNavMenu } from './FloatingNavMenu';
import { motion, AnimatePresence } from 'framer-motion';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { getAuth, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export function TopBar() {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
              <span className="text-[8px] font-bold text-primary uppercase tracking-[0.2em] mt-0.5">INTEL V5.2</span>
            </div>
          </div>

          {/* Center: System Status & Impact */}
          <div className="flex items-center gap-4 md:gap-8">
            <div className="hidden lg:flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10">
                <Zap className="w-3 h-3 text-primary" />
                <span className="text-[10px] font-bold text-slate-900">${totalSaved.toFixed(0)}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/5 border border-success/10">
                <Clock className="w-3 h-3 text-success" />
                <span className="text-[10px] font-bold text-slate-900">14.2h</span>
              </div>
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
                        <p className="text-xs font-bold text-slate-900">System Synced</p>
                        <p className="text-[11px] text-slate-500 leading-relaxed">Agent has updated your neural memory from recent activity.</p>
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
                  <p className="text-[9px] font-bold text-primary uppercase tracking-widest mt-0.5">Level 5 Clearance</p>
                </div>
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
