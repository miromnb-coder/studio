'use client';

import { useRouter } from 'next/navigation';
import { MessageCirclePlus } from 'lucide-react';

export function LibraryFab() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push('/chat')}
      aria-label="New chat"
      className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+28px)] right-[20px] z-[9999] flex h-[56px] w-[56px] items-center justify-center rounded-full bg-[#121212] text-white shadow-[0_20px_42px_rgba(0,0,0,0.28)]"
    >
      <MessageCirclePlus className="h-[26px] w-[26px]" />
    </button>
  );
}
