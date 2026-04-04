"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  History, 
  CloudLightning, 
  Settings,
  Cpu,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { icon: LayoutDashboard, href: '/dashboard', label: 'Console' },
  { icon: History, href: '/history', label: 'Memory' },
  { icon: CloudLightning, href: '/money-saver', label: 'Audit' },
  { icon: Settings, href: '/settings', label: 'System' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-24 flex-col items-center py-10 border-r border-white/40 bg-white/20 backdrop-blur-2xl sticky top-0 h-screen">
      <Link href="/" className="mb-12">
        <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-glow hover:scale-110 transition-all">
          <Cpu className="w-6 h-6" />
        </div>
      </Link>

      <nav className="flex-1 flex flex-col gap-8">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} title={item.label}>
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all group relative",
                isActive ? "bg-white shadow-sm" : "hover:bg-white/40"
              )}>
                <item.icon className={cn(
                  "w-5 h-5 transition-colors",
                  isActive ? "text-primary" : "text-slate-400 group-hover:text-slate-600"
                )} />
                {isActive && (
                  <motion.div 
                    layoutId="sidebar-active"
                    className="absolute left-[-12px] w-1 h-6 bg-primary rounded-full"
                  />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      <Link href="/">
        <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 hover:border-primary hover:text-primary transition-all">
          <Plus className="w-5 h-5" />
        </div>
      </Link>
    </aside>
  );
}