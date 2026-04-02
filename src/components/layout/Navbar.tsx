"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, History, Settings, Plus, Sparkles, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';
import { motion } from 'framer-motion';

export function Navbar() {
  const pathname = usePathname();
  const { user } = useUser();

  const navItems = [
    { icon: LayoutDashboard, href: '/dashboard', label: 'Console' },
    { icon: Sparkles, href: '/money-saver', label: 'Optimizer' },
    { icon: Plus, href: '/analyze', label: 'Analyze' },
    { icon: History, href: '/history', label: 'Ledger' },
    { icon: Settings, href: '/settings', label: 'Sync' },
  ];

  return (
    <>
      {/* Top Navigation - Shared Layout */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center p-6 pointer-events-none">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center gap-2 p-2 rounded-2xl glass pointer-events-auto shadow-2xl"
        >
          <Link href="/" className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-background mr-4 hover:scale-105 transition-transform">
            <span className="font-headline font-bold text-xl">O</span>
          </Link>
          
          <div className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap",
                  pathname === item.href 
                    ? "bg-white/10 text-white" 
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className="w-4 h-4" />
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            ))}
          </div>

          <div className="ml-4 pl-4 border-l border-white/10 flex items-center">
            <Link href="/settings" className="w-8 h-8 rounded-full overflow-hidden border border-white/10 hover:border-primary transition-colors">
              <img 
                src={`https://picsum.photos/seed/${user?.uid || 'user'}/64/64`} 
                alt="Profile" 
                className="w-full h-full object-cover" 
              />
            </Link>
          </div>
        </motion.div>
      </nav>
    </>
  );
}
