'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type KivoChatHeaderProps = {
  title?: string;
  hasMessages?: boolean;
  onSummarize?: () => void;
  onCreateTask?: () => void;
};

function KivoLogoMark() {
  return (
    <svg
      viewBox="0 0 120 120"
      className="h-7 w-7 shrink-0"
      aria-hidden="true"
      fill="none"
    >
      <path
        d="M18 78C25 89 44 96 67 94C89 92 107 77 112 58C114 48 112 40 106 34"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M42 62L72 36"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <circle cx="38" cy="66" r="11" fill="currentColor" />
      <circle cx="79" cy="30" r="18" fill="currentColor" />
    </svg>
  );
}

function IconButton({
  onClick,
  children,
  label,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-black/6 bg-white/85 text-black shadow-[0_8px_24px_rgba(0,0,0,0.06)] backdrop-blur-md transition active:scale-95"
    >
      {children}
    </button>
  );
}

export default function KivoChatHeader({
  title = 'Kivo',
  hasMessages = false,
  onSummarize,
  onCreateTask,
}: KivoChatHeaderProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const showActions = useMemo(() => hasMessages, [hasMessages]);

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-[#f5f5f3]/88 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4">
        {/* Left */}
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-black/6 bg-white/85 text-black shadow-[0_8px_24px_rgba(0,0,0,0.05)] transition active:scale-95"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
            <path
              d="M14.5 5L7.5 12L14.5 19"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Center */}
        <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
          <div className="text-black">
            <KivoLogoMark />
          </div>

          <span className="truncate text-[28px] font-semibold tracking-[-0.04em] text-black">
            {title}
          </span>
        </div>

        {/* Right */}
        <div className="relative flex items-center gap-2">
          {showActions ? (
            <>
              <button
                type="button"
                onClick={onSummarize}
                className="hidden h-10 rounded-full border border-black/6 bg-white/85 px-4 text-[14px] font-medium text-black shadow-[0_8px_24px_rgba(0,0,0,0.06)] backdrop-blur-md transition active:scale-95 sm:inline-flex"
              >
                Summary
              </button>

              <IconButton
                onClick={onCreateTask}
                label="Create task"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                  <path
                    d="M12 5V19M5 12H19"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                </svg>
              </IconButton>

              <IconButton
                onClick={() => setMenuOpen((v) => !v)}
                label="More actions"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                  <circle cx="6" cy="12" r="1.8" fill="currentColor" />
                  <circle cx="12" cy="12" r="1.8" fill="currentColor" />
                  <circle cx="18" cy="12" r="1.8" fill="currentColor" />
                </svg>
              </IconButton>

              {menuOpen && (
                <div className="absolute right-0 top-12 w-44 overflow-hidden rounded-2xl border border-black/6 bg-white shadow-[0_18px_48px_rgba(0,0,0,0.10)]">
                  <button className="w-full px-4 py-3 text-left text-sm hover:bg-black/[0.03]">
                    Rename
                  </button>
                  <button className="w-full px-4 py-3 text-left text-sm hover:bg-black/[0.03]">
                    Pin chat
                  </button>
                  <button className="w-full px-4 py-3 text-left text-sm hover:bg-black/[0.03]">
                    Export
                  </button>
                  <button className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50">
                    Delete
                  </button>
                </div>
              )}
            </>
          ) : (
            <button
              type="button"
              className="inline-flex h-10 items-center rounded-full bg-black px-4 text-sm font-medium text-white shadow-[0_12px_30px_rgba(0,0,0,0.14)] transition active:scale-95"
            >
              Kivo Plus
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
