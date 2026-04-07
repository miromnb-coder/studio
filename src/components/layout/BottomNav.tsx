"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, History, Home, LayoutDashboard, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/analyze", label: "Chat", icon: Bot },
  { href: "/history", label: "History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85 md:hidden">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-2 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-xs font-medium transition-colors",
                isActive ? "text-indigo-600" : "text-slate-400"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
