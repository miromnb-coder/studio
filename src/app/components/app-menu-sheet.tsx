'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Menu } from 'lucide-react';
import { useAppStore } from '../store/app-store';
import { MenuSheet } from '@/components/chat/MenuSheet';
import { sharedPrimaryMenu, sharedSecondaryMenu } from '@/components/chat/menu-config';

export function AppMenuSheet() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const createConversation = useAppStore((s) => s.createConversation);
  const openConversation = useAppStore((s) => s.openConversation);
  const logout = useAppStore((s) => s.logout);

  const hidden = ['/login', '/signup'];
  const isHidden = hidden.includes(pathname) || pathname === '/chat';

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (isHidden) return null;

  const closeAndNavigate = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-4 top-[max(12px,env(safe-area-inset-top))] z-40 inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#d7dbe2] bg-[#f8f9fb] text-[#21252b] shadow-sm"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="fixed inset-0 z-50 mx-auto w-full max-w-md">
        <MenuSheet
          open={open}
          primaryRows={sharedPrimaryMenu}
          secondaryRows={sharedSecondaryMenu}
          onClose={() => setOpen(false)}
          onPrimaryClick={(row) => {
            if (row.action === 'new-chat') {
              const id = createConversation();
              openConversation(id);
              closeAndNavigate('/chat');
              return;
            }
            if (row.action === 'conversations') {
              closeAndNavigate('/history');
              return;
            }
            if (row.href) {
              closeAndNavigate(row.href);
            }
          }}
          onSecondaryClick={(row) => row.href && closeAndNavigate(row.href)}
          onSignOut={() => {
            logout();
            setOpen(false);
            router.push('/login');
          }}
        />
      </div>
    </>
  );
}
