
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
    { icon: History, href: '/history', label: 'Audit Ledger' },
    { icon: Zap, href: '/money-saver', label: 'Optimizer' },
    { icon: Settings, href: '/settings', label: 'Sync' },
  ];

  const handleRename = async (id: string, currentTitle: string) => {
    const newTitle = prompt("Rename Protocol Thread:", currentTitle);
    if (newTitle && newTitle !== currentTitle) {
      await updateDoc(doc(db!, 'users', user!.uid, 'conversations', id), {
        title: newTitle,
        updatedAt: serverTimestamp()
      });
      toast({ title: "Thread Renamed", description: "Ledger updated successfully." });
    }
  };

  const handleArchive = async (id: string, isArchived: boolean) => {
    await updateDoc(doc(db!, 'users', user!.uid, 'conversations', id), {
      isArchived: !isArchived,
      updatedAt: serverTimestamp()
    });
    toast({ 
      title: isArchived ? "Thread Restored" : "Thread Archived", 
      description: isArchived ? "Moved back to active intelligence." : "Stored in secondary archives." 
    });
  };

  const handlePin = async (id: string, isPinned: boolean) => {
    await updateDoc(doc(db!, 'users', user!.uid, 'conversations', id), {
      isPinned: !isPinned,
      updatedAt: serverTimestamp()
    });
    toast({ 
      title: isPinned ? "Thread Unpinned" : "Thread Pinned", 
      description: isPinned ? "Removed from priority view." : "Moved to top of protocol list." 
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm("CRITICAL: Permanently purge this intelligence thread? This cannot be undone.")) {
      await deleteDoc(doc(db!, 'users', user!.uid, 'conversations', id));
      if (activeId === id) router.push('/');
      toast({ title: "Thread Purged", description: "Record removed from secure ledger." });
    }
  };

  const isSyncing = !mounted || isLoading;

  return (
    <Sidebar className="border-r border-white/5 bg-[#19191C]">
      <SidebarHeader className="p-6">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-background group-hover:scale-105 transition-transform shadow-lg shadow-primary/20">
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
                className="rounded-xl h-12 bg-white/5 text-white border border-white/5 hover:bg-white/10 transition-all px-4 group"
              >
                <Plus className="w-4 h-4 mr-2 text-primary group-hover:rotate-90 transition-transform" />
                <span className="font-bold text-sm tracking-tight">New Protocol</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <div className="px-4 mt-4 relative">
          <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/30" />
          <Input 
            placeholder="Search ledger..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 pl-10 bg-white/[0.03] border-white/5 text-[11px] font-medium rounded-xl focus:ring-primary/20 text-white placeholder:text-muted-foreground/20"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-7 top-1/2 -translate-y-1/2">
              <X className="w-3 h-3 text-muted-foreground/30 hover:text-white" />
            </button>
          )}
        </div>

        <SidebarGroup className="mt-4">
          <div className="flex items-center justify-between px-4 mb-2">
            <SidebarGroupLabel className="p-0 text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">
              {showArchived ? 'Archives' : 'Active Threads'}
            </SidebarGroupLabel>
            <button 
              onClick={() => setShowArchived(!showArchived)}
              className="text-[8px] font-bold uppercase tracking-widest text-primary/40 hover:text-primary transition-colors flex items-center gap-1"
            >
              {showArchived ? 'Active' : 'Archives'}
              <Archive className="w-2.5 h-2.5" />
            </button>
          </div>
          <SidebarMenu className="px-2 space-y-1">
            {isSyncing ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 text-primary/20 animate-spin" />
              </div>
            ) : filteredConversations.length > 0 ? (
              filteredConversations.map((conv) => (
                <SidebarMenuItem key={conv.id} className="group/item relative">
                  <div className="flex items-center gap-1">
                    <SidebarMenuButton 
                      asChild 
                      isActive={activeId === conv.id}
                      className={cn(
                        "flex-1 rounded-xl h-11 transition-all px-4 relative",
                        activeId === conv.id ? "bg-white/5 text-primary border-l-2 border-l-primary" : "text-muted-foreground hover:text-white hover:bg-white/[0.02]"
                      )}
                    >
                      <Link href={`/?c=${conv.id}`}>
                        <div className="flex items-center gap-3 min-w-0">
                          <MessageSquare className={cn("w-3.5 h-3.5 shrink-0", activeId === conv.id ? "text-primary" : "text-muted-foreground/40")} />
                          <span className="truncate font-medium text-xs">{conv.title || 'Untitled Audit'}</span>
                          {conv.isPinned && <Pin className="w-2.5 h-2.5 text-primary fill-primary shrink-0" />}
                        </div>
                      </Link>
                    </SidebarMenuButton>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="w-8 h-8 opacity-0 group-hover/item:opacity-100 transition-opacity rounded-lg hover:bg-white/5">
                          <MoreVertical className="w-3 h-3 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52 bg-card border-white/10 rounded-2xl p-2 shadow-2xl">
                        <DropdownMenuItem onClick={() => handlePin(conv.id, !!conv.isPinned)} className="rounded-xl h-10 gap-3 cursor-pointer">
                          <Pin className="w-3.5 h-3.5" /> <span className="text-sm font-medium">{conv.isPinned ? 'Unpin' : 'Pin to Top'}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleRename(conv.id, conv.title)} className="rounded-xl h-10 gap-3 cursor-pointer">
                          <Edit2 className="w-3.5 h-3.5" /> <span className="text-sm font-medium">Rename</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleArchive(conv.id, !!conv.isArchived)} className="rounded-xl h-10 gap-3 cursor-pointer">
                          <Archive className="w-3.5 h-3.5" /> <span className="text-sm font-medium">{conv.isArchived ? 'Restore' : 'Archive'}</span>
                        </DropdownMenuItem>
                        <div className="h-px bg-white/5 my-1" />
                        <DropdownMenuItem onClick={() => handleDelete(conv.id)} className="rounded-xl h-10 gap-3 cursor-pointer text-danger hover:bg-danger/10">
                          <Trash2 className="w-3.5 h-3.5" /> <span className="text-sm font-medium">Purge Record</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </SidebarMenuItem>
              ))
            ) : (
              <div className="px-4 py-12 text-center space-y-2 opacity-20">
                <MessageSquare className="w-6 h-6 mx-auto mb-2" />
                <p className="text-[10px] italic uppercase tracking-[0.2em]">No intelligence found</p>
              </div>
            )}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-auto pb-4">
          <SidebarGroupLabel className="px-4 text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground/30">Systems</SidebarGroupLabel>
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
                    <item.icon className="w-4 h-4 mr-3" />
                    <span className="font-medium text-sm">{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-white/5 bg-black/10">
        <div className="flex items-center gap-3 px-3 py-2 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer group">
          <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10 group-hover:border-primary/50 transition-colors bg-muted/50">
            {user?.uid && mounted ? (
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
            <p className="text-xs font-bold text-white truncate">{user?.displayName || 'Operator Client'}</p>
            <p className="text-[9px] font-bold text-primary/60 uppercase tracking-widest truncate">Intelligence Active</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
