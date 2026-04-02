
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { 
  LayoutDashboard, 
  History, 
  Settings, 
  MessageSquare, 
  Zap, 
  Plus,
  Loader2
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
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { cn } from '@/lib/utils';

export function AppSidebar() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeId = searchParams?.get('c');
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const conversationsQuery = useMemoFirebase(() => {
    try {
      if (!db || !user) return null;
      return query(
        collection(db, 'users', user.uid, 'conversations'),
        orderBy('updatedAt', 'desc'),
        limit(20)
      );
    } catch (e) {
      console.error('Sidebar Intelligence Query Error:', e);
      return null;
    }
  }, [db, user]);

  const { data: conversations, isLoading } = useCollection(conversationsQuery);

  const coreItems = [
    { icon: LayoutDashboard, href: '/dashboard', label: 'Console' },
    { icon: History, href: '/history', label: 'Audit Ledger' },
    { icon: Zap, href: '/money-saver', label: 'Optimizer' },
    { icon: Settings, href: '/settings', label: 'Sync' },
  ];

  // HARD HYDRATION GUARD
  if (!mounted) {
    return (
      <Sidebar className="border-r border-white/5 bg-[#19191C]">
        <div className="flex h-full items-center justify-center">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground/10" />
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar className="border-r border-white/5 bg-[#19191C]">
      <SidebarHeader className="p-6">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-background group-hover:scale-105 transition-transform">
            <span className="font-headline font-bold text-lg">O</span>
          </div>
          <span className="font-headline font-bold text-lg tracking-tight text-white">Operator</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu className="px-2">
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => router.push('/')}
                className="rounded-xl h-11 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all px-4"
              >
                <Plus className="w-4 h-4 mr-2" />
                <span className="font-bold text-sm">New Conversation</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Recent Intelligence</SidebarGroupLabel>
          <SidebarMenu className="px-2 space-y-1">
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
              </div>
            ) : (conversations || []).length > 0 ? (
              (conversations || [])
                .filter(conv => conv && conv.id) // DATA VALIDATION: Skip corrupted docs
                .map((conv) => (
                  <SidebarMenuItem key={conv.id}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={activeId === conv.id}
                      className={cn(
                        "rounded-xl h-11 transition-all px-4",
                        activeId === conv.id ? "bg-white/5 text-primary" : "text-muted-foreground hover:text-white hover:bg-white/[0.02]"
                      )}
                    >
                      <Link href={`/?c=${conv.id}`}>
                        <MessageSquare className="w-4 h-4 mr-2 shrink-0" />
                        <span className="truncate font-medium text-xs">{conv.title || 'Audit Session'}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
            ) : !isLoading && (
              <p className="px-4 py-2 text-[10px] text-muted-foreground/30 italic uppercase tracking-widest">No records found</p>
            )}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-auto pb-4">
          <SidebarGroupLabel className="px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Systems</SidebarGroupLabel>
          <SidebarMenu className="px-2">
            {coreItems.map((item) => (
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
          <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 group-hover:border-primary/50 transition-colors bg-muted/50">
            {user?.uid ? (
              <img 
                src={`https://picsum.photos/seed/${user.uid}/64/64`} 
                alt="Profile" 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full bg-white/5" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">{user?.displayName || 'Operator User'}</p>
            <p className="text-[10px] font-medium text-muted-foreground truncate">Operator V1.5 IQ-Active</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
