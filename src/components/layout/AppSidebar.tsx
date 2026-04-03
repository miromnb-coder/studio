
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
  X
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
    return conversations.filter(conv => {
      const matchesSearch = conv.title?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesArchive = showArchived ? conv.isArchived : !conv.isArchived;
      return matchesSearch && matchesArchive;
    });
  }, [conversations, searchTerm, showArchived]);

  const coreItems = [
    { icon: LayoutDashboard, href: '/dashboard', label: 'Console' },
    { icon: History, href: '/history', label: 'Audit Ledger' },
    { icon: Zap, href: '/money-saver', label: 'Optimizer' },
    { icon: Settings, href: '/settings', label: 'Sync' },
  ];

  const handleRename = async (id: string, currentTitle: string) => {
    const newTitle = prompt("Rename Thread:", currentTitle);
    if (newTitle && newTitle !== currentTitle) {
      await updateDoc(doc(db!, 'users', user!.uid, 'conversations', id), {
        title: newTitle,
        updatedAt: serverTimestamp()
      });
      toast({ title: "Renamed", description: "Thread title updated." });
    }
  };

  const handleArchive = async (id: string, isArchived: boolean) => {
    await updateDoc(doc(db!, 'users', user!.uid, 'conversations', id), {
      isArchived: !isArchived,
      updatedAt: serverTimestamp()
    });
    toast({ 
      title: isArchived ? "Restored" : "Archived", 
      description: isArchived ? "Thread moved to active." : "Thread moved to archives." 
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Permanently delete this thread?")) {
      await deleteDoc(doc(db!, 'users', user!.uid, 'conversations', id));
      if (activeId === id) router.push('/');
      toast({ title: "Deleted", description: "Thread removed from ledger." });
    }
  };

  const isSyncing = !mounted || isLoading;

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

        <div className="px-4 mt-4 relative">
          <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/50" />
          <Input 
            placeholder="Search ledger..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 pl-9 bg-white/5 border-white/5 text-[11px] font-medium rounded-xl focus:ring-primary/20"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-7 top-1/2 -translate-y-1/2">
              <X className="w-3 h-3 text-muted-foreground/30 hover:text-white" />
            </button>
          )}
        </div>

        <SidebarGroup className="mt-4">
          <div className="flex items-center justify-between px-4 mb-2">
            <SidebarGroupLabel className="p-0 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
              {showArchived ? 'Archived Records' : 'Recent Intelligence'}
            </SidebarGroupLabel>
            <button 
              onClick={() => setShowArchived(!showArchived)}
              className="text-[8px] font-bold uppercase tracking-widest text-primary/50 hover:text-primary transition-colors"
            >
              {showArchived ? 'View Active' : 'View Archive'}
            </button>
          </div>
          <SidebarMenu className="px-2 space-y-1">
            {isSyncing ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-4 h-4 text-muted-foreground/10 animate-spin" />
              </div>
            ) : filteredConversations.length > 0 ? (
              filteredConversations.map((conv) => (
                <SidebarMenuItem key={conv.id} className="group/item">
                  <div className="flex items-center gap-1">
                    <SidebarMenuButton 
                      asChild 
                      isActive={activeId === conv.id}
                      className={cn(
                        "flex-1 rounded-xl h-11 transition-all px-4",
                        activeId === conv.id ? "bg-white/5 text-primary" : "text-muted-foreground hover:text-white hover:bg-white/[0.02]"
                      )}
                    >
                      <Link href={`/?c=${conv.id}`}>
                        <MessageSquare className="w-4 h-4 mr-2 shrink-0" />
                        <span className="truncate font-medium text-xs">{conv.title || 'Audit Session'}</span>
                      </Link>
                    </SidebarMenuButton>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="w-8 h-8 opacity-0 group-hover/item:opacity-100 transition-opacity">
                          <MoreVertical className="w-3 h-3 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-card border-white/10 rounded-xl p-1">
                        <DropdownMenuItem onClick={() => handleRename(conv.id, conv.title)} className="rounded-lg h-9 gap-2 cursor-pointer">
                          <Edit2 className="w-3 h-3" /> <span className="text-xs">Rename</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleArchive(conv.id, !!conv.isArchived)} className="rounded-lg h-9 gap-2 cursor-pointer">
                          <Archive className="w-3 h-3" /> <span className="text-xs">{conv.isArchived ? 'Restore' : 'Archive'}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(conv.id)} className="rounded-lg h-9 gap-2 cursor-pointer text-danger hover:text-danger">
                          <Trash2 className="w-3 h-3" /> <span className="text-xs">Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </SidebarMenuItem>
              ))
            ) : (
              <div className="px-4 py-6 text-center">
                <p className="text-[10px] text-muted-foreground/30 italic uppercase tracking-widest">No matching records</p>
              </div>
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
            <p className="text-xs font-bold text-white truncate">{user?.displayName || 'Operator User'}</p>
            <p className="text-[10px] font-medium text-muted-foreground truncate">V1.5 Intelligence Active</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
