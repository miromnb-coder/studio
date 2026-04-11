'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, CircleUserRound, ClipboardCheck, Home, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

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

  if (hiddenOn.includes(pathname)) return null;

  return (
    <nav className="fixed bottom-[max(10px,env(safe-area-inset-bottom))] left-1/2 z-40 w-full max-w-md -translate-x-1/2 px-4">
      <div className="grid grid-cols-5 rounded-[28px] border border-white/12 bg-[#0b0c0f]/84 px-1.5 py-1.5 shadow-[0_26px_48px_rgba(0,0,0,0.62)] backdrop-blur-2xl">
        {tabs.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={label}
              href={href}
              className={`relative flex flex-col items-center gap-1 rounded-[18px] py-2 text-[11px] font-medium transition ${
                active ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              {active ? (
                <motion.span
                  layoutId="active-tab"
                  className="absolute inset-0 rounded-[16px] border border-white/16 bg-white/[0.12]"
                  transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                />
              ) : null}
              <Icon className="relative z-10 h-[18px] w-[18px] stroke-[2]" />
              <span className="relative z-10">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
