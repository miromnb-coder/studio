'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, ChevronRight, X } from 'lucide-react';

type MenuItem = { label: string; href?: string; action?: () => void };

export function AppMenuSheet() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const hidden = ['/login', '/signup'];
  const isHidden = hidden.includes(pathname) || pathname === '/chat';

  const groups = useMemo(
    () => [
      {
        title: 'Navigation',
        items: [
          { label: 'Home', href: '/' },
          { label: 'Tasks', href: '/tasks' },
          { label: 'Alerts', href: '/alerts' },
          { label: 'History', href: '/history' },
          { label: 'Profile', href: '/profile' },
        ] as MenuItem[],
      },
      {
        title: 'Chat Tools',
        items: [
          { label: 'New Chat', href: '/chat' },
          { label: 'Conversations', href: '/chat' },
          { label: 'Connected Apps', href: '/chat' },
          { label: 'Search', href: '/history' },
        ] as MenuItem[],
      },
      {
        title: 'Account',
        items: [
          { label: 'Upgrade', href: '/upgrade' },
          { label: 'Usage', href: '/settings' },
          { label: 'Settings', href: '/settings' },
          { label: 'Sign Out', action: () => router.push('/login') },
        ] as MenuItem[],
      },
    ],
    [router],
  );

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (isHidden) return null;

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

      <AnimatePresence>
        {open ? (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/20"
              aria-label="Close menu"
            />
            <motion.section
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-md rounded-t-[30px] border border-[#dde1e8] bg-[#f5f6f8] px-4 pb-[calc(20px+env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_30px_rgba(17,24,39,0.12)]"
            >
              <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-[#c8ced8]" />
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[#1f2329]">Kivo menu</h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#d8dce4] bg-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {groups.map((group) => (
                <div key={group.title} className="mb-3 rounded-2xl border border-[#dde1e8] bg-white p-2.5">
                  <p className="px-2 pb-1 text-xs uppercase tracking-[0.16em] text-[#7a838f]">{group.title}</p>
                  {group.items.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        if (item.href) router.push(item.href);
                        item.action?.();
                        setOpen(false);
                      }}
                      className="flex w-full items-center justify-between rounded-xl px-2 py-2.5 text-left text-sm text-[#2b3037] hover:bg-[#f3f5f8]"
                    >
                      <span>{item.label}</span>
                      <ChevronRight className="h-4 w-4 text-[#8b95a3]" />
                    </button>
                  ))}
                </div>
              ))}
            </motion.section>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
