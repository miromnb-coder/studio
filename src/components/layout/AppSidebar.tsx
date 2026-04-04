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
  Pin
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
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, doc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export function AppSidebar() {
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showArchived, setShowArchived] = useState(false);
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
        const matchesSearch = (conv.title || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesArchive = showArchived ? conv.isArchived : !conv.isArchived;
        return matchesSearch && matchesArchive;
      })
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return 0;
      });
  }, [conversations, searchTerm, showArchived]);

  const coreItems = [
    { icon: LayoutDashboard, href: '/dashboard', label: 'Console' },
    { icon: History, href: '/history', label: 'Memory' },
    { icon: Zap, href: '/money-saver', label: 'Optimization' },
    { icon: Settings, href: '/settings', label: 'Systems' },
  ];

  const handleDelete = async (id: string) => {
    if (!db || !user) return;
    if (confirm("Permanently purge this record?")) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'conversations', id));
        if (activeId === id) router.push('/');
        toast({ title: "Record Purged" });
      } catch (err) {
        toast({ variant: 'destructive', title: "Purge Failed" });
      }
    }
  };

  const isSyncing = !mounted || isLoading;

  return (
    <Sidebar className="border-r border-slate-100 bg-white">
      <SidebarHeader className="p-6">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex items-center justify-center w-9 h-9 rounded-2xl bg-nordic-sage text-white group-hover:scale-105 transition-transform shadow-lg shadow-nordic-sage/20">
            <span className="font-bold text-lg">O</span>
          </div>
          <span className="font-bold text-lg tracking-tight text-slate-900">Operator</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu className="px-2">
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => router.push('/')}
                className="rounded-2xl h-12 bg-nordic-sage text-white hover:bg-nordic-sage/90 transition-all px-4 group shadow-md shadow-nordic-sage/10"
              >
                <Plus className="w-4 h-4 mr-2 text-white/80 group-hover:rotate-90 transition-transform" />
                <span className="font-bold text-sm">New Session</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <div className="px-4 mt-4 relative">
          <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
          <Input 
            placeholder="Search context..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 pl-10 bg-slate-50 border-transparent text-xs font-medium rounded-xl focus:bg-white focus:border-nordic-moss transition-all"
          />
        </div>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">History</SidebarGroupLabel>
          <SidebarMenu className="px-2 space-y-1">
            {isSyncing ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-nordic-moss animate-spin" /></div>
            ) : filteredConversations.length > 0 ? (
              filteredConversations.map((conv) => (
                <SidebarMenuItem key={conv.id} className="group/item">
                  <SidebarMenuButton 
                    asChild 
                    isActive={activeId === conv.id}
                    className={cn(
                      "rounded-xl h-11 transition-all px-4",
                      activeId === conv.id ? "bg-nordic-moss/20 text-nordic-sage font-semibold" : "text-slate-500 hover:text-slate-900 hover:bg-nordic-silk"
                    )}
                  >
                    <Link href={`/?c=${conv.id}`}>
                      <div className="flex items-center gap-3 truncate">
                        <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-40" />
                        <span className="truncate">{conv.title || 'Untitled'}</span>
                      </div>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))
            ) : (
              <div className="px-4 py-8 text-center opacity-20 italic text-[10px]">No records found</div>
            )}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-auto pb-4">
          <SidebarMenu className="px-2">
            {coreItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton 
                  asChild 
                  isActive={pathname === item.href}
                  className={cn(
                    "rounded-xl h-11 transition-all px-4",
                    pathname === item.href ? "bg-nordic-moss/20 text-nordic-sage font-semibold" : "text-slate-500 hover:text-slate-900 hover:bg-nordic-silk"
                  )}
                >
                  <Link href={item.href}>
                    <item.icon className="w-4 h-4 mr-3 opacity-60" />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-slate-50">
        <div className="flex items-center gap-3 px-3 py-2 rounded-2xl hover:bg-nordic-silk transition-colors cursor-pointer group">
          <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-100 bg-slate-50">
            {user?.uid && mounted ? (
              <img src={`https://picsum.photos/seed/${user.uid}/64/64`} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-slate-100" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">{user?.displayName || 'User'}</p>
            <p className="text-[9px] font-bold text-nordic-sage uppercase tracking-widest truncate">Verified Profile</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}