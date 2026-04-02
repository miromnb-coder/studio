'use client';

import { useState, useEffect, Suspense } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Loader2 } from 'lucide-react';

/**
 * RootClientLayout handles the hydration guard and global client-side providers.
 * This ensures that interactive components like the Sidebar only render once 
 * the client-side environment is stable.
 */
export function RootClientLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-primary">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin" />
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-50">Operator Protocol Loading</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Suspense fallback={
          <div className="w-[var(--sidebar-width)] bg-[#19191C] border-r border-white/5 flex items-center justify-center">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        }>
          <AppSidebar />
        </Suspense>
        <main className="flex-1 relative flex flex-col min-w-0" id="main-content">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
