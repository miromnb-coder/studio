"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Bot, History, Home, MessageSquare } from "lucide-react";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/analyze", label: "Chat", icon: MessageSquare },
  { href: "/tools", label: "Agents", icon: Bot },
  { href: "/dashboard", label: "Alerts", icon: Bell },
  { href: "/history", label: "History", icon: History },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-2 sm:px-6 lg:px-8">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <item.icon className={`h-5 w-5 ${active ? "text-indigo-600" : "text-slate-400"}`} />
              <span className={`text-xs ${active ? "text-indigo-600" : "text-slate-500"}`}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
