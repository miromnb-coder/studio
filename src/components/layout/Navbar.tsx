
"use client";

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Cpu, Bell, Search, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export function Navbar() {
  const [hasAlerts, setHasAlerts] = useState(true);

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-[var(--sidebar-width)] z-40 bg-background/80 backdrop-blur-xl border-b border-white/5 h-16 flex items-center px-6 justify-between">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="text-muted-foreground hover:text-white" />
        <div className="h-4 w-px bg-white/10 mx-2 hidden md:block" />
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
        >
          <Cpu className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Operator v1.0</span>
        </motion.div>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground transition-colors">
          <Search className="w-4 h-4" />
        </button>
        
        <Popover>
          <PopoverTrigger asChild>
            <button className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground transition-colors relative">
              <Bell className="w-4 h-4" />
              {hasAlerts && (
                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-danger rounded-full animate-pulse" />
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 bg-card border-white/10 p-4 rounded-2xl shadow-2xl mt-2" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Proactive Intelligence</p>
                <Badge className="bg-danger/10 text-danger border-0 h-4 px-1.5 text-[8px] font-bold">2 Live</Badge>
              </div>
              
              <div className="space-y-3">
                <div className="flex gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
                  <div className="w-8 h-8 rounded-lg bg-danger/10 text-danger flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-white group-hover:text-primary transition-colors">Trial Expiration Imminent</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">Netflix Ultra trial ends in 48h. Optimization suggested.</p>
                  </div>
                </div>
                <div className="flex gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-white group-hover:text-primary transition-colors">High-Burn Detected</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">New $50+ recurring charge identified in audit.</p>
                  </div>
                </div>
              </div>

              <Button asChild variant="outline" className="w-full h-8 text-[9px] font-bold uppercase tracking-widest border-white/10 rounded-lg">
                <Link href="/dashboard" className="text-white">View Protocol Console</Link>
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}

function Badge({ children, className, variant = 'default' }: any) {
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-full font-medium",
      className
    )}>
      {children}
    </span>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
