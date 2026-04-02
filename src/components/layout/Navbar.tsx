
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  LayoutDashboard, 
  History, 
  Settings, 
  PlusCircle,
  LogOut,
  ChevronDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser } from '@/firebase';

export function Navbar() {
  const { user } = useUser();

  return (
    <nav className="sticky top-0 z-50 w-full glass px-6 md:px-12 py-5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-background font-bold shadow-2xl shadow-primary/30 transition-transform group-hover:scale-110">
            O
          </div>
          <span className="font-headline text-2xl font-bold tracking-tight hidden sm:block">
            AI Life <span className="text-primary">Operator</span>
          </span>
        </Link>

        <div className="flex items-center gap-4 md:gap-10">
          <div className="hidden md:flex items-center gap-8">
            <Link href="/dashboard" className="text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
              Dashboard
            </Link>
            <Link href="/history" className="text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
              History
            </Link>
          </div>

          <Button asChild className="hidden sm:flex rounded-full px-6 h-11 gap-2 shadow-2xl shadow-primary/20 font-bold">
            <Link href="/analyze">
              <PlusCircle className="w-4 h-4" />
              Analyze
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-12 flex items-center gap-3 rounded-full px-2 pl-4 pr-3 border border-white/5 hover:bg-white/5">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold leading-none mb-1">{user?.displayName || 'Jane Doe'}</p>
                  <p className="text-[10px] leading-none text-muted-foreground opacity-60">Verified</p>
                </div>
                <Avatar className="h-9 w-9 border border-white/10">
                  <AvatarImage src={`https://picsum.photos/seed/${user?.uid || 'user123'}/100/100`} />
                  <AvatarFallback className="bg-primary/10 text-primary">JD</AvatarFallback>
                </Avatar>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 mt-4 premium-card !p-2 bg-[#232327]">
              <DropdownMenuLabel className="p-4">
                <div className="flex flex-col space-y-2">
                  <p className="text-sm font-bold leading-none">{user?.displayName || 'Jane Doe'}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email || 'jane@example.com'}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/5" />
              <DropdownMenuItem asChild className="p-3 cursor-pointer rounded-xl hover:bg-white/5">
                <Link href="/dashboard">
                  <LayoutDashboard className="mr-3 h-4 w-4" />
                  Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="p-3 cursor-pointer rounded-xl hover:bg-white/5">
                <Link href="/settings">
                  <Settings className="mr-3 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/5" />
              <DropdownMenuItem className="p-3 text-danger focus:text-danger cursor-pointer rounded-xl hover:bg-danger/10">
                <LogOut className="mr-3 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
