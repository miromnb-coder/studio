'use client';

import { useState, useEffect, Suspense } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * RootClientLayout handles the spatial background and hydration guard.
 */
export function RootClientLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full relative bg-slate-50/50">
        {/* Spatial Background Elements */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <motion.div 
            animate={{ 
              x: [0, 50, 0], 
              y: [0, 30, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="ambient-blob bg-blue-400 w-[600px] h-[600px] top-[-200px] left-[-100px]" 
          />
          <motion.div 
            animate={{ 
              x: [0, -40, 0], 
              y: [0, 60, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="ambient-blob bg-purple-300 w-[500px] h-[500px] bottom-[-100px] right-[-100px]" 
          />
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[100px]" />
        </div>

        <Suspense fallback={null}>
          <AppSidebar />
        </Suspense>
        
        <main className="flex-1 relative flex flex-col min-w-0 z-10" id="main-content">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
