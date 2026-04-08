'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Bot, Clock3, Home, MessageSquare } from 'lucide-react';

const tabs = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Chat', href: '/chat', icon: MessageSquare },
  { label: 'Agents', href: '/agents', icon: Bot },
  { label: 'Alerts', href: '/alerts', icon: Bell },
  { label: 'History', href: '/history', icon: Clock3 },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="mobile-nav glass fixed bottom-0 left-1/2 z-40 grid w-full max-w-md -translate-x-1/2 grid-cols-5 border-t border-black/[0.05] bg-white/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      {tabs.map(({ label, href, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={label}
            href={href}
            className={`nav-tab tap-feedback flex flex-col items-center gap-1.5 rounded-xl py-1.5 text-xs font-medium transition ${
              active ? 'text-indigo-500' : 'text-slate-400 hover:text-slate-600'
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
