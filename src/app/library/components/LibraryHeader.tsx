'use client';

import { useRouter } from 'next/navigation';
import { Library, Search, User } from 'lucide-react';

export function LibraryHeader() {
  const router = useRouter();

  return (
    <header className="grid h-[62px] grid-cols-[44px_1fr_88px] items-center">
      <button
        type="button"
        onClick={() => router.push('/settings')}
        aria-label="Profile"
        className="flex h-10 w-10 items-center justify-center rounded-full text-[#17191D] active:scale-95"
      >
        <User className="h-[23px] w-[23px]" strokeWidth={2.05} />
      </button>

      <h1 className="text-center font-serif text-[38px] font-bold leading-none tracking-[-0.055em] text-[#191B1F]">
        Kivo
      </h1>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push('/history')}
          aria-label="History"
          className="flex h-10 w-8 items-center justify-center text-[#17191D] active:scale-95"
        >
          <Library className="h-[24px] w-[24px]" strokeWidth={2.05} />
        </button>

        <button
          type="button"
          onClick={() => router.push('/search')}
          aria-label="Search"
          className="flex h-10 w-8 items-center justify-center text-[#17191D] active:scale-95"
        >
          <Search className="h-[26px] w-[26px]" strokeWidth={2.05} />
        </button>
      </div>
    </header>
  );
}
