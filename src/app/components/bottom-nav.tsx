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
    <nav className="fixed bottom-[max(8px,env(safe-area-inset-bottom))] left-1/2 z-40 w-full max-w-md -translate-x-1/2 px-3">
      <div className="grid grid-cols-5 rounded-[22px] border border-[#E5E7EB]/90 bg-white/80 px-1.5 py-1.5 shadow-[0_12px_30px_rgba(15,23,42,0.10)] backdrop-blur-xl">
        {tabs.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={label}
              href={href}
              className={`relative flex flex-col items-center gap-1 rounded-2xl py-2 text-[11px] font-medium transition ${
                active ? 'text-[#5B5CF0]' : 'text-slate-500 hover:text-slate-700'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              {active ? <motion.span layoutId="active-tab" className="absolute inset-0 rounded-xl bg-[#EEF0FF]" transition={{ type: 'spring', stiffness: 280, damping: 24 }} /> : null}
              <Icon className="relative z-10 h-[18px] w-[18px] stroke-[2]" />
              <span className="relative z-10">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
