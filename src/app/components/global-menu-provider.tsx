'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { MenuSheet, type MenuRow } from '@/components/chat/MenuSheet';
import { sharedPrimaryMenu, sharedSecondaryMenu } from '@/components/chat/menu-config';
import { useAppStore } from '../store/app-store';

type GlobalMenuContextValue = {
  openMenu: () => void;
  closeMenu: () => void;
  toggleMenu: () => void;
  isOpen: boolean;
};

const GlobalMenuContext = createContext<GlobalMenuContextValue | null>(null);

export function GlobalMenuProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const createConversation = useAppStore((s) => s.createConversation);
  const openConversation = useAppStore((s) => s.openConversation);
  const logout = useAppStore((s) => s.logout);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const closeAndNavigate = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  const onPrimaryClick = useCallback(
    (row: MenuRow) => {
      if (row.action === 'new-chat') {
        const id = createConversation();
        openConversation(id);
        closeAndNavigate('/chat');
        return;
      }

      if (row.action === 'conversations') {
        closeAndNavigate('/memory');
        return;
      }

      if (row.href) {
        closeAndNavigate(row.href);
      }
    },
    [closeAndNavigate, createConversation, openConversation],
  );

  const onSecondaryClick = useCallback(
    (row: MenuRow) => {
      if (row.href) closeAndNavigate(row.href);
    },
    [closeAndNavigate],
  );

  const onSignOut = useCallback(() => {
    logout();
    setOpen(false);
    router.push('/login');
  }, [logout, router]);

  const value = useMemo<GlobalMenuContextValue>(
    () => ({
      openMenu: () => setOpen(true),
      closeMenu: () => setOpen(false),
      toggleMenu: () => setOpen((prev) => !prev),
      isOpen: open,
    }),
    [open],
  );

  return (
    <GlobalMenuContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-0 z-50 mx-auto w-full max-w-md">
        <div className={`relative h-full w-full ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}>
          <MenuSheet
            open={open}
            primaryRows={sharedPrimaryMenu}
            secondaryRows={sharedSecondaryMenu}
            onClose={() => setOpen(false)}
            onPrimaryClick={onPrimaryClick}
            onSecondaryClick={onSecondaryClick}
            onSignOut={onSignOut}
          />
        </div>
      </div>
    </GlobalMenuContext.Provider>
  );
}

export function useGlobalMenu() {
  const context = useContext(GlobalMenuContext);
  if (!context) {
    throw new Error('useGlobalMenu must be used within a GlobalMenuProvider');
  }
  return context;
}
