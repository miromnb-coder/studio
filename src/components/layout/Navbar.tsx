"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, History, Settings, Plus, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';

export function Navbar() {
  const pathname = usePathname();
  const { user } = useUser();

  const navItems = [
    { icon: LayoutDashboard, href: '/dashboard', label: 'Dashboard' },
    { icon: Sparkles, href: '/money-saver', label: 'Saver' },
    { icon: Plus, href: '/analyze', label: 'Scan' },
    { icon: History, href: '/history', label: 'History' },
    { icon: Settings, href: '/settings', label: 'Settings' },
  ];

  return (
    <>
      {/* Top Header - Desktop Only */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 px-12 py-8 items-center justify-between pointer-events-none">
        <Link href="/" className="flex items-center gap-3 group pointer-events-auto">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-background font-bold shadow-2xl shadow-primary/20 transition-transform group-hover:scale-110">
            O
          </div>
          <span className="font-headline text-xl font-bold tracking-tight">
            Operator
          </span>
        </Link>
        
        <div className="flex items-center gap-6 pointer-events-auto">
          <div className="flex bg-white/5 rounded-full p-1 border border-white/5 backdrop-blur-xl">
            {navItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all",
                  pathname === item.href 
                    ? "bg-white/10 text-white shadow-xl" 
                    : "text-muted-foreground hover:text-white"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden">
            <img src={`https://picsum.photos/seed/${user?.uid || 'user'}/100/100`} alt="Profile" className="w-full h-full object-cover" />
          </div>
        </div>
      </nav>

      {/* Floating Bottom Navigation - Mobile Only */}
      <nav className="md:hidden fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-[320px]">
        <div className="glass rounded-full p-2 flex items-center justify-around shadow-2xl">
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "w-12 h-12 flex items-center justify-center rounded-full transition-all",
                pathname === item.href 
                  ? "bg-primary text-background shadow-lg shadow-primary/20 scale-110" 
                  : "text-muted-foreground hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5" />
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}