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
  CloudLightning,
  Sparkles
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
import { motion } from 'framer-motion';

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
    <Sidebar className="border-r border-white/40 bg-white/20 backdrop-blur-3xl m-4 h-[calc(100vh-2rem)] rounded-[2.5rem] shadow-xl overflow-hidden">
      <SidebarHeader className="p-8">
        <Link href="/" className="flex items-center gap-4 group">
          <div className="flex items-center justify-center w-11 h-11 bg-primary rounded-[1.25rem] text-white transition-all group-hover:scale-110 shadow-lg shadow-primary/30">
            <Cpu className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tighter text-slate-900 leading-none mb-1">Operator</span>
            <span className="text-[9px] font-bold text-primary uppercase tracking-[0.25em] leading-none">Ultra Glass</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-4">
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => router.push('/')}
                className="h-14 bg-primary text-white hover:bg-primary/90 rounded-[1.5rem] transition-all px-6 group flex justify-between shadow-lg shadow-primary/20 floating-button"
              >
                <span className="font-bold text-sm tracking-tight">New Analysis</span>
                <Plus className="w-5 h-5 text-white/80 group-hover:rotate-90 transition-transform" />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <div className="mt-8 relative px-2">
          <Input 
            placeholder="Search activity..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-11 pl-11 bg-white/40 border-white/60 rounded-[1.25rem] text-xs font-bold placeholder:text-slate-400 focus:ring-primary/30 transition-all shadow-sm"
          />
          <Terminal className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        </div>

        <SidebarGroup className="mt-8">
          <SidebarGroupLabel className="px-4 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-4">Intelligence Feed</SidebarGroupLabel>
          <SidebarMenu className="space-y-2">
            {isSyncing ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-primary/30 animate-spin" /></div>
            ) : filteredConversations.length > 0 ? (
              filteredConversations.map((conv) => (
                <SidebarMenuItem key={conv.id}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={activeId === conv.id}
                    className={cn(
                      "h-12 transition-all px-5 rounded-[1.25rem] group",
                      activeId === conv.id 
                        ? "bg-white text-primary shadow-md border border-white/80" 
                        : "text-slate-500 hover:text-slate-900 hover:bg-white/60"
                    )}
                  >
                    <Link href={`/?c=${conv.id}`}>
                      <div className="flex items-center gap-4 truncate">
                        <div className={cn(
                          "w-2 h-2 rounded-full transition-colors",
                          activeId === conv.id ? "bg-primary animate-pulse" : "bg-slate-200 group-hover:bg-slate-400"
                        )} />
                        <span className="truncate text-xs font-bold tracking-tight">{conv.title || 'Untitled Session'}</span>
                      </div>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest italic opacity-40">Feed Empty</div>
            )}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-auto pb-6 border-t border-slate-200/40 pt-8">
          <SidebarMenu className="space-y-2">
            {coreItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton 
                  asChild 
                  isActive={pathname === item.href}
                  className={cn(
                    "h-12 transition-all px-5 rounded-[1.25rem]",
                    pathname === item.href 
                      ? "bg-white text-primary shadow-md border border-white/80" 
                      : "text-slate-500 hover:text-slate-900 hover:bg-white/60"
                  )}
                >
                  <Link href={item.href}>
                    <item.icon className="w-5 h-5 mr-4 opacity-60" />
                    <span className="text-xs font-bold tracking-tight">{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-6 border-t border-slate-200/40 bg-white/10">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="flex items-center gap-4 px-4 py-3 rounded-[1.5rem] bg-white/40 hover:bg-white/80 transition-all cursor-pointer group border border-white/40 shadow-sm"
        >
          <div className="w-10 h-10 overflow-hidden rounded-[1rem] border-2 border-white shadow-sm">
            {user?.uid && mounted ? (
              <img src={`https://picsum.photos/seed/${user.uid}/64/64`} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-slate-100" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">{user?.displayName || 'User'}</p>
            <p className="text-[9px] font-bold text-primary uppercase tracking-[0.2em] mt-0.5">High Clearance</p>
          </div>
        </motion.div>
      </SidebarFooter>
    </Sidebar>
  );
}
