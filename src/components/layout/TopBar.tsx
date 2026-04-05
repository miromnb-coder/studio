
"use client";

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Bell, User, X, Zap, LogOut, ShieldCheck, TrendingUp, Menu, Star, ArrowRight, Plus, Search, Clock, Activity, History, MessageSquare, Trash2, Loader2 } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, limit, orderBy, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { FloatingNavMenu } from './FloatingNavMenu';
import { motion, AnimatePresence } from 'framer-motion';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { getAuth, signOut } from 'firebase/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { SubscriptionService } from '@/services/subscription-service';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export function TopBar() {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeId = searchParams?.get('c');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (db && user) {
      const userRef = doc(db, 'users', user.uid);
      const unsub = onSnapshot(userRef, () => {
        SubscriptionService.getUserStatus(db, user.uid).then(setStatus);
      });
      return () => unsub();
    }
  }, [db, user]);

  const toggleMenu = useCallback(() => setIsMenuOpen(prev => !prev), []);
  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    router.push('/login');
  };

  const NavButton = ({ icon: Icon, onClick, className }: { icon: any, onClick?: () => void, className?: string }) => (
    <button 
      onClick={onClick}
      className={cn(
        "w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm hover:bg-slate-50 transition-all active:scale-95",
        className
      )}
    >
      <Icon className="w-4 h-4" />
    </button>
  );

  return (
    <>
      <header className="fixed top-4 md:top-6 left-1/2 -translate-x-1/2 z-[150] w-full max-w-6xl px-4 pointer-events-none">
        <div className="flex items-center justify-between w-full pointer-events-auto">
          
          {/* Left Buttons */}
          <div className="flex items-center gap-2">
            <NavButton icon={isMenuOpen ? X : Menu} onClick={toggleMenu} />
            <Popover>
              <PopoverTrigger asChild>
                <NavButton icon={History} />
              </PopoverTrigger>
              <PopoverContent className="w-72 glass-panel p-0 shadow-2xl mt-4 rounded-[2.5rem] border-white/60 overflow-hidden" align="start">
                <div className="p-5 border-b border-slate-100/60 bg-white/40">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">History</p>
                </div>
                <div className="p-8 text-center text-[10px] text-slate-400 uppercase font-bold tracking-widest opacity-40 italic">
                  Neural memory empty
                </div>
              </PopoverContent>
            </Popover>
            <NavButton icon={Plus} onClick={() => router.push('/')} />
          </div>

          {/* Center Star Pill */}
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/upgrade')}
            className="h-10 px-5 rounded-full bg-[#4F95FF] flex items-center gap-2 text-white shadow-[0_8px_30px_rgb(79,149,255,0.3)] active:scale-95 transition-all"
          >
            <Star className="w-3.5 h-3.5 fill-white" />
            <ArrowRight className="w-3.5 h-3.5" />
          </motion.button>

          {/* Right Buttons */}
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <NavButton icon={Bell} />
              </PopoverTrigger>
              <PopoverContent className="w-72 glass-panel p-4 shadow-xl mt-4 rounded-[2rem] border-white/60" align="end">
                <p className="text-[10px] text-center py-4 text-slate-400 font-bold uppercase tracking-widest">No Alerts</p>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <button className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-md ring-1 ring-slate-100 active:scale-95 transition-transform">
                  {user?.uid ? (
                    <img src={`https://picsum.photos/seed/${user.uid}/40/40`} alt="User" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-50 flex items-center justify-center"><User className="w-4 h-4 text-slate-300" /></div>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 glass-panel p-2 shadow-xl mt-4 rounded-3xl border-white/60" align="end">
                <div className="p-3 border-b border-slate-100/60 mb-1">
                  <p className="text-xs font-bold text-slate-900 truncate">{user?.displayName || 'Operator'}</p>
                </div>
                <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 text-slate-600 hover:text-danger hover:bg-danger/5 rounded-2xl text-xs font-bold"><LogOut className="w-4 h-4" />Terminate Session</button>
              </PopoverContent>
            </Popover>
          </div>

        </div>
      </header>

      <AnimatePresence>
        {isMenuOpen && (
          <FloatingNavMenu key="nav-menu" onClose={closeMenu} />
        )}
      </AnimatePresence>
    </>
  );
}
