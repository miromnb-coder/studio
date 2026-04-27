'use client';

import { useRouter } from 'next/navigation';
import { Library, Search, User } from 'lucide-react';

export function LibraryHeader() {
  const router = useRouter();

  return (
    <header className="grid h-[62px] grid-cols-[42px_1fr_78px] items-center">
      <button
        type="button"
        onClick={() => router.push('/settings')}
        aria-label="Profile"
        className="flex h-10 w-10 items-center justify-center rounded-full text-[#17191D] active:scale-95"
      >
        <User className="h-[21px] w-[21px]" strokeWidth={2} />
      </button>

      <h1 className="text-center font-serif text-[42px] font-bold leading-none tracking-[-0.06em] text-[#191B1F]">
        Kivo
      </h1>

      <div className="flex items-center justify-end gap-1">
        <button
          type="button"
          onClick={() => router.push('/history')}
          aria-label="History"
          className="flex h-10 w-9 items-center justify-center text-[#17191D] active:scale-95"
        >
          <Library className="h-[21px] w-[21px]" strokeWidth={2} />
        </button>

        <button
          type="button"
          onClick={() => router.push('/search')}
          aria-label="Search"
          className="flex h-10 w-9 items-center justify-center text-[#17191D] active:scale-95"
        >
          <Search className="h-[22px] w-[22px]" strokeWidth={2} />
        </button>
      </div>
    </header>
  );
}
