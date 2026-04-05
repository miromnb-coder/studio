'use client';

import { ReactNode, useState, useEffect } from 'react';
import { AppShell } from './AppShell';
import { Loader2 } from 'lucide-react';
import { AICoreProvider } from '@/components/ai-core/AICoreContext';

export function RootClientLayout({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary/40 animate-spin" />
      </div>
    );
  }

  return (
    <AICoreProvider>
      <AppShell>
        {children}
      </AppShell>
    </AICoreProvider>
  );
}
