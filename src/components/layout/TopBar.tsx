
"use client";

import { useState, useCallback, useEffect } from 'react';
import { Bell, User, X, LogOut, Star, ArrowRight, Plus, History, Menu } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { FloatingNavMenu } from './FloatingNavMenu';
import { motion, AnimatePresence } from 'framer-motion';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getAuth, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { SubscriptionService } from '@/services/subscription-service';
import { cn } from '@/lib/utils';

export function TopBar() {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [status, setStatus] = useState<any>(null);

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
        "w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm hover:bg-white hover:text-slate-900 transition-all active:scale-90 shrink-0",
        className
      )}
    >
      <Icon className="w-4 h-4 stroke-[1.5]" />
    </button>
  );

  return (
    <>
      <header className="fixed top-4 sm:top-6 left-0 right-0 z-[150] px-4 pointer-events-none flex justify-center">
        <div className="w-full max-w-6xl flex items-center justify-between pointer-events-auto">
          
          {/* Left Navigation Group */}
          <div className="flex items-center gap-2 sm:gap-3">
            <NavButton icon={isMenuOpen ? X : Menu} onClick={toggleMenu} />
            <Popover>
              <PopoverTrigger asChild>
                <NavButton icon={History} />
              </PopoverTrigger>
              <PopoverContent className="w-72 glass-panel p-0 shadow-2xl mt-4 rounded-[2.5rem] border-white/60 overflow-hidden" align="start">
                <div className="p-5 border-b border-slate-100/60 bg-white/40">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Context Memory</p>
                </div>
                <div className="p-8 text-center text-[10px] text-slate-400 uppercase font-bold tracking-widest opacity-40 italic">
                  No active memories found
                </div>
              </PopoverContent>
            </Popover>
            <NavButton icon={Plus} onClick={() => router.push('/')} />
          </div>

          {/* Center Action Pill */}
          <motion.button 
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/upgrade')}
            className="h-11 px-6 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center gap-3 text-white shadow-[0_12px_24px_-8px_rgba(59,130,246,0.5)] active:scale-95 transition-all group"
          >
            <Star className="w-4 h-4 fill-white group-hover:rotate-12 transition-transform" />
            <ArrowRight className="w-4 h-4 opacity-80" />
          </motion.button>

          {/* Right Navigation Group */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <NavButton icon={Bell} />
              </PopoverTrigger>
              <PopoverContent className="w-72 glass-panel p-4 shadow-xl mt-4 rounded-[2rem] border-white/60" align="end">
                <p className="text-[10px] text-center py-4 text-slate-400 font-bold uppercase tracking-widest">No New Signals</p>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <button className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-md ring-1 ring-slate-100 active:scale-90 transition-transform shrink-0">
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
                <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 text-slate-600 hover:text-danger hover:bg-danger/5 rounded-2xl text-xs font-bold transition-colors">
                  <LogOut className="w-4 h-4" /> Terminate Session
                </button>
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
