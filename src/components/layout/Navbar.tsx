"use client";

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Cpu, Bell, Search } from 'lucide-react';
import { motion } from 'framer-motion';

export function Navbar() {
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
        <button className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-primary rounded-full" />
        </button>
      </div>
    </header>
  );
}
