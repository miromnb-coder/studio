
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/firebase';

/**
 * A wrapper component that protects routes.
 * Redirects unauthenticated users to the login page.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Allow '/' (Landing), '/login', and '/upgrade' without forcing login immediately
    // although upgrade page normally needs login, we don't want a crash if visited during transition
    const isPublicPath = pathname === '/login' || pathname === '/' || pathname === '/upgrade';
    
    if (!isUserLoading && !user && !isPublicPath) {
      router.push('/login');
    }
  }, [user, isUserLoading, router, pathname]);

  if (isUserLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
