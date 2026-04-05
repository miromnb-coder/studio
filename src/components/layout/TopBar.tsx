
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
        "w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm hover:bg-slate-50 transition-all active:scale-95 shrink-0",
        className
      )}
    >
      <Icon className="w-4 h-4" />
    </button>
  );

  return (
    <>
      <header className="fixed top-4 sm:top-6 left-0 right-0 z-[150] px-4 pointer-events-none flex justify-center">
        <div className="w-full max-w-6xl flex items-center justify-between pointer-events-auto">
          
          {/* Left Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
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
            className="h-9 sm:h-10 px-4 sm:px-5 rounded-full bg-[#4F95FF] flex items-center gap-2 text-white shadow-[0_8px_30px_rgb(79,149,255,0.3)] active:scale-95 transition-all"
          >
            <Star className="w-3.5 h-3.5 fill-white" />
            <ArrowRight className="w-3.5 h-3.5" />
          </motion.button>

          {/* Right Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
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
                <button className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-white shadow-md ring-1 ring-slate-100 active:scale-95 transition-transform shrink-0">
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
