'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, CircleUserRound, ClipboardCheck, Home, MessageSquare } from 'lucide-react';

const tabs = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Chat', href: '/chat', icon: MessageSquare },
  { label: 'Tasks', href: '/tasks', icon: ClipboardCheck },
  { label: 'Alerts', href: '/alerts', icon: Bell },
  { label: 'Profile', href: '/profile', icon: CircleUserRound },
];

export function BottomNav() {
  const pathname = usePathname();
  const hiddenOn = ['/login', '/signup'];

  if (hiddenOn.includes(pathname)) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-1/2 z-40 grid w-full max-w-md -translate-x-1/2 grid-cols-5 border-t border-black/10 bg-[#f7f7f7]/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-sm">
      {tabs.map(({ label, href, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={label}
            href={href}
            className={`nav-tab tap-feedback flex flex-col items-center gap-1.5 rounded-xl py-1.5 text-xs font-medium transition ${
              active ? 'text-black' : 'text-[#666] hover:text-[#111]'
            }`}
            aria-current={active ? 'page' : undefined}
          >
            <Icon className="h-[18px] w-[18px] stroke-[1.9]" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
