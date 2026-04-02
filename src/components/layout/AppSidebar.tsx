"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  History, 
  Settings, 
  MessageSquare, 
  Zap, 
  ShieldCheck,
  Cpu,
  UserCircle
} from 'lucide-react';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel
} from '@/components/ui/sidebar';
import { useUser } from '@/firebase';
import { cn } from '@/lib/utils';

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useUser();

  const primaryItems = [
    { icon: MessageSquare, href: '/', label: 'Operator Chat' },
    { icon: LayoutDashboard, href: '/dashboard', label: 'Console' },
    { icon: History, href: '/history', label: 'Audit Ledger' },
  ];

  const secondaryItems = [
    { icon: Zap, href: '/money-saver', label: 'Optimizer' },
    { icon: Settings, href: '/settings', label: 'Sync & Protocols' },
  ];

  return (
    <Sidebar className="border-r border-white/5 bg-[#19191C]">
      <SidebarHeader className="p-6">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-background group-hover:scale-105 transition-transform">
            <span className="font-headline font-bold text-lg">O</span>
          </div>
          <span className="font-headline font-bold text-lg tracking-tight">Operator</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Core Engine</SidebarGroupLabel>
          <SidebarMenu className="px-2">
            {primaryItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton 
                  asChild 
                  isActive={pathname === item.href}
                  className={cn(
                    "rounded-xl h-11 transition-all px-4",
                    pathname === item.href ? "bg-white/5 text-primary" : "text-muted-foreground hover:text-white hover:bg-white/[0.02]"
                  )}
                >
                  <Link href={item.href}>
                    <item.icon className="w-4 h-4 mr-2" />
                    <span className="font-medium text-sm">{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Intelligence</SidebarGroupLabel>
          <SidebarMenu className="px-2">
            {secondaryItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton 
                  asChild 
                  isActive={pathname === item.href}
                  className={cn(
                    "rounded-xl h-11 transition-all px-4",
                    pathname === item.href ? "bg-white/5 text-primary" : "text-muted-foreground hover:text-white hover:bg-white/[0.02]"
                  )}
                >
                  <Link href={item.href}>
                    <item.icon className="w-4 h-4 mr-2" />
                    <span className="font-medium text-sm">{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 group-hover:border-primary/50 transition-colors">
            <img 
              src={`https://picsum.photos/seed/${user?.uid || 'user'}/64/64`} 
              alt="Profile" 
              className="w-full h-full object-cover" 
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">{user?.displayName || 'Operator User'}</p>
            <p className="text-[10px] font-medium text-muted-foreground truncate">V1 Core active</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
