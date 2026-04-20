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

function GhostIconButton({
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
      className="inline-flex h-10 items-center justify-center px-1 text-[#202734] transition-opacity duration-200 hover:opacity-65 active:scale-[0.97]"
    >
      {children}
    </button>
  );
}

export function KivoChatHeader({
  title = 'Kivo',
  hasMessages = false,
  onSummarize,
  onCreateTask,
}: KivoChatHeaderProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const showActions = useMemo(() => hasMessages, [hasMessages]);

  const handleBack = () => {
    router.push('/home');
  };

  return (
    <header
      className="relative z-30 border-b border-black/[0.035] bg-white/82 backdrop-blur-2xl"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="mx-auto flex h-[78px] w-full max-w-[560px] items-center px-5">
        <div className="flex w-[52px] shrink-0 justify-start">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            className="inline-flex h-10 items-center justify-center text-[#2B313D] transition-all duration-200 ease-out hover:opacity-65 active:scale-[0.96]"
          >
            <svg viewBox="0 0 24 24" className="h-[21px] w-[21px]" fill="none">
              <path
                d="M14.5 5L7.5 12L14.5 19"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div className="flex min-w-0 flex-1 justify-center px-3">
          <div className="inline-flex min-w-0 items-center gap-2.5">
            <KivoLogoMark />
            <span className="truncate text-[21px] font-semibold tracking-[-0.045em] text-[#202734]">
              {title}
            </span>
          </div>
        </div>

        <div className="relative flex min-w-[108px] shrink-0 items-center justify-end gap-2">
          {showActions ? (
            <>
              <button
                type="button"
                onClick={onSummarize}
                className="hidden text-[14px] font-medium tracking-[-0.02em] text-[#202734] transition-opacity duration-200 hover:opacity-65 active:scale-[0.98] sm:inline-flex"
              >
                Summary
              </button>

              <GhostIconButton onClick={onCreateTask} label="Create task">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                  <path
                    d="M12 5V19M5 12H19"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                </svg>
              </GhostIconButton>

              <GhostIconButton
                onClick={() => setMenuOpen((v) => !v)}
                label="More actions"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                  <circle cx="6" cy="12" r="1.8" fill="currentColor" />
                  <circle cx="12" cy="12" r="1.8" fill="currentColor" />
                  <circle cx="18" cy="12" r="1.8" fill="currentColor" />
                </svg>
              </GhostIconButton>

              {menuOpen ? (
                <div className="absolute right-0 top-12 z-50 w-44 overflow-hidden rounded-2xl border border-black/6 bg-white shadow-[0_18px_48px_rgba(0,0,0,0.10)]">
                  <button
                    type="button"
                    className="w-full px-4 py-3 text-left text-sm hover:bg-black/[0.03]"
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    className="w-full px-4 py-3 text-left text-sm hover:bg-black/[0.03]"
                  >
                    Pin chat
                  </button>
                  <button
                    type="button"
                    className="w-full px-4 py-3 text-left text-sm hover:bg-black/[0.03]"
                  >
                    Export
                  </button>
                  <button
                    type="button"
                    className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <button
              type="button"
              className="inline-flex h-10 items-center rounded-full bg-[linear-gradient(180deg,#111318_0%,#050608_100%)] px-5 text-[13px] font-semibold tracking-[-0.015em] text-white shadow-[0_10px_24px_rgba(0,0,0,0.14)] transition-all duration-200 ease-out hover:-translate-y-[1px] hover:shadow-[0_14px_28px_rgba(0,0,0,0.18)] active:translate-y-0 active:scale-[0.985]"
            >
              Kivo Plus
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default KivoChatHeader;
