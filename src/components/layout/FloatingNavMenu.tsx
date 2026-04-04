"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  History, 
  CloudLightning, 
  Settings,
  Zap,
  ArrowRight,
  Home,
  Cpu
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { memo } from 'react';

const NAV_ITEMS = [
  { icon: Home, href: '/', label: 'Intelligence Briefing', desc: 'Main control canvas' },
  { icon: LayoutDashboard, href: '/dashboard', label: 'Command Center', desc: 'Real-time telemetry' },
  { icon: History, href: '/history', label: 'Neural Memory', desc: 'Context & personalization' },
  { icon: CloudLightning, href: '/money-saver', label: 'Efficiency Autopilot', desc: 'Optimization protocols' },
  { icon: Cpu, href: '/tools', label: 'Tool Marketplace', desc: 'Agent capabilities' },
  { icon: Settings, href: '/settings', label: 'System Settings', desc: 'Engine configuration' },
];

export const FloatingNavMenu = memo(({ onClose }: { onClose: () => void }) => {
  const pathname = usePathname();

  return (
    <>
      {/* Backdrop to close menu */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[140] bg-slate-900/10 backdrop-blur-md pointer-events-auto"
      />
      
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] w-[calc(100%-2rem)] max-w-2xl pointer-events-none"
      >
        <div className="glass-panel p-4 rounded-[2.5rem] border-white/80 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] overflow-y-auto max-h-[75vh] pointer-events-auto stealth-scrollbar ring-1 ring-white/40">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link 
                  key={item.label} 
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-3xl transition-all group",
                    isActive 
                      ? "bg-primary text-white shadow-lg shadow-primary/20" 
                      : "hover:bg-white/80 text-slate-600 hover:text-slate-900"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                    isActive ? "bg-white/20" : "bg-slate-100 group-hover:bg-white shadow-sm"
                  )}>
                    <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-slate-400 group-hover:text-primary")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold uppercase tracking-widest">{item.label}</p>
                    <p className={cn(
                      "text-[10px] font-medium opacity-60 truncate",
                      isActive ? "text-white" : "text-slate-400"
                    )}>{item.desc}</p>
                  </div>
                  <ArrowRight className={cn(
                    "w-4 h-4 opacity-0 -translate-x-2 transition-all",
                    isActive ? "opacity-40" : "group-hover:opacity-40 group-hover:translate-x-0"
                  )} />
                </Link>
              );
            })}
          </div>
        </div>
      </motion.div>
    </>
  );
});

FloatingNavMenu.displayName = 'FloatingNavMenu';
