"use client";

import { StatusDot } from '@/components/ui/StatusDot';
import { ValueStrip } from '@/components/systems/ValueStrip';
import { Bell, User } from 'lucide-react';
import { useUser } from '@/firebase';

export function TopBar() {
  const { user } = useUser();

  return (
    <header className="h-20 px-8 flex items-center justify-between sticky top-0 z-50 backdrop-blur-md bg-white/10">
      <div className="flex items-center gap-8">
        <div className="flex flex-col">
          <span className="text-xs font-bold tracking-tighter text-slate-900 leading-none">OPERATOR</span>
          <span className="text-[9px] font-bold text-primary uppercase tracking-[0.3em] mt-0.5">Intelligence v5.2</span>
        </div>
        <div className="h-6 w-px bg-slate-200/60" />
        <StatusDot status="active" />
      </div>

      <div className="hidden md:block">
        <ValueStrip items={[
          { label: 'Reclaimed', value: '$1,420', tone: 'positive' },
          { label: 'Time Gain', value: '14.2h', tone: 'neutral' }
        ]} />
      </div>

      <div className="flex items-center gap-4">
        <button className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-white/60 transition-all relative">
          <Bell className="w-4 h-4" />
          <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-primary rounded-full border border-white" />
        </button>
        <div className="w-10 h-10 rounded-full overflow-hidden border border-white shadow-sm">
          <img src={`https://picsum.photos/seed/${user?.uid || '1'}/40/40`} alt="User" />
        </div>
      </div>
    </header>
  );
}