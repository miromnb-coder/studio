"use client";

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { 
  LayoutDashboard, 
  History, 
  Settings, 
  MessageSquare, 
  Zap, 
  Plus,
  Loader2,
  Terminal,
  Activity,
  Cpu,
  Database,
  CloudLightning
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
import { Input } from '@/components/ui/input';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { cn } from '@/lib/utils';

export function AppSidebar() {
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
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
        limit(50)
      );
    } catch (e) {
      return null;
    }
  }, [db, user]);

  const { data: conversations, isLoading } = useCollection(conversationsQuery);

  const filteredConversations = useMemo(() => {
    if (!Array.isArray(conversations)) return [];
    return conversations
      .filter(conv => {
        if (!conv) return false;
        return (conv.title || '').toLowerCase().includes(searchTerm.toLowerCase());
      });
  }, [conversations, searchTerm]);

  const coreItems = [
    { icon: LayoutDashboard, href: '/dashboard', label: 'Command Center' },
    { icon: History, href: '/history', label: 'Neural Memory' },
    { icon: CloudLightning, href: '/money-saver', label: 'Optimization' },
    { icon: Settings, href: '/settings', label: 'System Setup' },
  ];

  const isSyncing = !mounted || isLoading;

  return (
    <Sidebar className="border-r border-slate-200/60 bg-slate-50/50 backdrop-blur-xl">
      <SidebarHeader className="p-6">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex items-center justify-center w-9 h-9 bg-primary rounded-2xl text-white transition-all group-hover:scale-105 shadow-lg shadow-primary/20">
            <Cpu className="w-5 h-5" />
          </div>
          <span className="font-bold text-sm tracking-tight text-slate-900">Operator</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu className="px-4">
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => router.push('/')}
                className="h-11 bg-primary text-white hover:bg-primary/90 rounded-2xl transition-all px-4 group flex justify-between shadow-md shadow-primary/10"
              >
                <span className="font-bold text-xs">New Analysis</span>
                <Plus className="w-4 h-4 text-white/80 group-hover:rotate-90 transition-transform" />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <div className="px-4 mt-4 relative">
          <Input 
            placeholder="Search activity..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 pl-10 bg-white/50 border-slate-200/60 rounded-2xl text-xs font-medium focus:ring-primary/20 transition-all"
          />
          <Terminal className="absolute left-7 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        </div>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Intelligence Log</SidebarGroupLabel>
          <SidebarMenu className="px-2 mt-2 space-y-1">
            {isSyncing ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-primary/40 animate-spin" /></div>
            ) : filteredConversations.length > 0 ? (
              filteredConversations.map((conv) => (
                <SidebarMenuItem key={conv.id}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={activeId === conv.id}
                    className={cn(
                      "h-10 transition-all px-4 rounded-xl",
                      activeId === conv.id ? "bg-white text-primary shadow-sm border border-slate-100" : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
                    )}
                  >
                    <Link href={`/?c=${conv.id}`}>
                      <div className="flex items-center gap-3 truncate">
                        <MessageSquare className="w-4 h-4 shrink-0 opacity-40" />
                        <span className="truncate text-xs font-semibold">{conv.title || 'Untitled Session'}</span>
                      </div>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-[11px] text-slate-400 font-medium italic">Empty log</div>
            )}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-auto pb-4 border-t border-slate-100/60 pt-4">
          <SidebarMenu className="px-2 space-y-1">
            {coreItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton 
                  asChild 
                  isActive={pathname === item.href}
                  className={cn(
                    "h-10 transition-all px-4 rounded-xl",
                    pathname === item.href ? "bg-white text-primary shadow-sm border border-slate-100" : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
                  )}
                >
                  <Link href={item.href}>
                    <item.icon className="w-4 h-4 mr-3 opacity-60" />
                    <span className="text-xs font-semibold">{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-slate-100/60 bg-white/20">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-white/50 transition-all cursor-pointer group border border-transparent hover:border-slate-100">
          <div className="w-9 h-9 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {user?.uid && mounted ? (
              <img src={`https://picsum.photos/seed/${user.uid}/64/64`} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-slate-50" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">{user?.displayName || 'User'}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Standard Clearance</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}