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

  // We no longer return null or a full-screen loader here to allow the shell to render immediately.
  // The SidebarProvider and AppSidebar handle their own internal loading states.
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Suspense fallback={
          <div className="w-[var(--sidebar-width)] bg-[#19191C] border-r border-white/5 flex items-center justify-center">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground/10" />
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
