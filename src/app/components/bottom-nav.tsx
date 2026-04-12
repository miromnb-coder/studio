'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CircleUserRound, Crosshair, MessageSquare, MessagesSquare, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const tabs = [
  { label: 'Chat', href: '/chat', icon: MessageSquare },
  { label: 'Chats', href: '/chat?panel=conversations', icon: MessagesSquare },
  { label: 'Focus', href: '/focus', icon: Crosshair },
  { label: 'Actions', href: '/actions', icon: Sparkles },
  { label: 'Profile', href: '/profile', icon: CircleUserRound },
];

export function BottomNav() {
  const pathname = usePathname();
  const hiddenOn = ['/login', '/signup'];

  if (hiddenOn.includes(pathname)) return null;

  return (
    <nav className="fixed bottom-[max(10px,env(safe-area-inset-bottom))] left-1/2 z-40 w-full max-w-md -translate-x-1/2 px-4 pb-[max(2px,env(safe-area-inset-bottom)/3)]">
      <div className="grid grid-cols-5 rounded-[28px] border border-white/7 bg-[#0b0c0f]/88 px-1.5 py-1.5 shadow-[0_28px_54px_rgba(0,0,0,0.68)] backdrop-blur-2xl">
        {tabs.map(({ label, href, icon: Icon }) => {
          const active = href === '/chat?panel=conversations' ? pathname === '/chat' : pathname === href;
          return (
            <Link
              key={label}
              href={href}
              className={`relative flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-[18px] py-2 text-[11px] font-medium transition ${
                active ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              {active ? (
                <motion.span
                  layoutId="active-tab"
                  className="absolute inset-0 rounded-[16px] border border-white/10 bg-white/[0.085] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                  transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                />
              ) : null}
              <Icon className="relative z-10 h-[18px] w-[18px] stroke-[2]" />
              <span className="relative z-10">{label}</span>
              {active ? <span className="relative z-10 h-1 w-1 rounded-full bg-zinc-100/80" /> : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
