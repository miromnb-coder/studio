"use client";

import { useState } from 'react';
import { StatusDot } from '@/components/ui/StatusDot';
import { Bell, LayoutGrid, User, X, Zap, Clock } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, limit } from 'firebase/firestore';
import { FloatingNavMenu } from './FloatingNavMenu';
import { motion, AnimatePresence } from 'framer-motion';

export function TopBar() {
  const { user } = useUser();
  const db = useFirestore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const analysesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'analyses'), limit(20));
  }, [db, user]);

  const { data: analyses } = useCollection(analysesQuery);
  const totalSaved = (analyses || []).reduce((acc, a) => acc + (a.estimatedMonthlySavings || 0), 0);

  return (
    <>
      <header className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-3rem)] max-w-5xl">
        <div className="glass-panel h-16 px-4 md:px-6 flex items-center justify-between rounded-full border-white/60 shadow-[0_16px_32px_-8px_rgba(0,0,0,0.1)]">
          {/* Left: Navigation Trigger */}
          <div className="flex items-center gap-3 md:gap-4">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:bg-white/60 hover:text-primary transition-all active:scale-95"
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
            <button className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-white/60 transition-all relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-primary rounded-full border-2 border-white" />
            </button>
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm ring-1 ring-slate-100">
              {user?.uid ? (
                <img src={`https://picsum.photos/seed/${user.uid}/40/40`} alt="User" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-50 flex items-center justify-center"><User className="w-4 h-4 text-slate-300" /></div>
              )}
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isMenuOpen && (
          <FloatingNavMenu onClose={() => setIsMenuOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
