'use client';

import { ChevronRight, Sparkles } from 'lucide-react';
import type { UserIdentity } from '@/app/profile/types';

type ProfileIdentityProps = {
  user: UserIdentity;
  onOpen: () => void;
};

export function ProfileIdentity({ user, onOpen }: ProfileIdentityProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-4 rounded-[28px] bg-transparent px-1 py-2 text-left transition active:scale-[0.995]"
    >
      <div className="relative">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[linear-gradient(145deg,#be988f,#a97f74)] text-[62px] font-medium text-white shadow-[0_12px_24px_rgba(80,40,30,0.2)]">
          {user.avatarLetter}
        </div>
        <span className="absolute -bottom-1 right-0 inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#f6f6f5] bg-[#111827] text-white shadow-[0_8px_20px_rgba(17,24,39,0.3)]">
          <Sparkles className="h-4 w-4" strokeWidth={2} />
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[20px] font-semibold tracking-[-0.03em] text-[#121212]">{user.fullName}</p>
        <p className="truncate text-[14px] tracking-[-0.01em] text-[#7b7b7a]">{user.email}</p>
        <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#efe8e3] px-3 py-1 text-xs font-medium text-[#6c4c3f]">
          <span aria-hidden>♕</span>
          {user.badge}
        </div>
      </div>

      <ChevronRight className="h-5 w-5 shrink-0 text-[#545454]" />
    </button>
  );
}
