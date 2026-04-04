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
  Search,
  MoreVertical,
  Trash2,
  Archive,
  Edit2,
  X,
  Pin,
  Terminal,
  Activity
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, doc, deleteDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export function AppSidebar() {
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeId = searchParams?.get('c');
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

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
    { icon: Terminal, href: '/dashboard', label: 'Console' },
    { icon: History, href: '/history', label: 'Memory' },
    { icon: Zap, href: '/money-saver', label: 'Optimization' },
    { icon: Settings, href: '/settings', label: 'Systems' },
  ];

  const isSyncing = !mounted || isLoading;

  return (
    <Sidebar className="border-r border-stealth-slate bg-stealth-ebon">
      <SidebarHeader className="p-6">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex items-center justify-center w-8 h-8 bg-primary text-white transition-all group-hover:scale-110 shadow-[0_0_10px_rgba(225,29,72,0.4)]">
            <span className="font-bold text-lg">O</span>
          </div>
          <span className="font-bold text-sm tracking-widest text-primary uppercase glow-text">Operator</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu className="px-4">
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => router.push('/')}
                className="h-10 bg-primary text-white hover:bg-primary/90 transition-all px-4 group flex justify-between"
              >
                <span className="font-bold text-[10px] uppercase tracking-widest">Initial_Protocol</span>
                <Plus className="w-3.5 h-3.5 text-white/80 group-hover:rotate-90 transition-transform" />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <div className="px-4 mt-4 relative">
          <span className="absolute left-7 top-1/2 -translate-y-1/2 text-[10px] text-primary/50">{'>'}</span>
          <Input 
            placeholder="Filter_Session..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 pl-10 bg-stealth-onyx border-stealth-slate text-[10px] font-bold uppercase tracking-widest focus:border-primary transition-all text-muted-foreground"
          />
        </div>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="px-4 text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground/50">Intelligence_Log</SidebarGroupLabel>
          <SidebarMenu className="px-2 space-y-1">
            {isSyncing ? (
              <div className="flex justify-center py-8"><Loader2 className="w-4 h-4 text-primary animate-spin" /></div>
            ) : filteredConversations.length > 0 ? (
              filteredConversations.map((conv) => (
                <SidebarMenuItem key={conv.id}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={activeId === conv.id}
                    className={cn(
                      "h-9 transition-all px-4 border-l-2",
                      activeId === conv.id ? "bg-primary/10 border-primary text-primary" : "border-transparent text-muted-foreground hover:text-primary hover:bg-stealth-onyx"
                    )}
                  >
                    <Link href={`/?c=${conv.id}`}>
                      <div className="flex items-center gap-3 truncate">
                        <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-40" />
                        <span className="truncate text-[10px] font-bold uppercase tracking-wider">{conv.title || 'Unknown_Session'}</span>
                      </div>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))
            ) : (
              <div className="px-4 py-8 text-center opacity-20 italic text-[9px] uppercase">No_Records_Found</div>
            )}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-auto pb-4 border-t border-stealth-slate">
          <SidebarMenu className="px-2 space-y-1">
            {coreItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton 
                  asChild 
                  isActive={pathname === item.href}
                  className={cn(
                    "h-9 transition-all px-4 border-l-2",
                    pathname === item.href ? "bg-primary/10 border-primary text-primary" : "border-transparent text-muted-foreground hover:text-primary hover:bg-stealth-onyx"
                  )}
                >
                  <Link href={item.href}>
                    <item.icon className="w-3.5 h-3.5 mr-3 opacity-60" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-stealth-slate bg-stealth-ebon">
        <div className="flex items-center gap-3 px-3 py-2 border border-stealth-slate bg-stealth-ebon hover:border-primary transition-colors cursor-pointer group">
          <div className="w-8 h-8 overflow-hidden bg-stealth-onyx border border-stealth-slate">
            {user?.uid && mounted ? (
              <img src={`https://picsum.photos/seed/${user.uid}/64/64`} alt="ID" className="w-full h-full object-cover grayscale brightness-50 contrast-125" />
            ) : (
              <div className="w-full h-full bg-stealth-onyx" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-primary truncate uppercase">{user?.displayName || 'Unknown_Agent'}</p>
            <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest truncate">Verified_Clearance</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
