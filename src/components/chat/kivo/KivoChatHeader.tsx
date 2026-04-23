'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type KivoMode = 'lite' | 'smart' | 'operator';
type KivoPlan = 'free' | 'plus';

type KivoChatHeaderProps = {
  hasMessages?: boolean;
  onSummarize?: () => void;
  onCreateTask?: () => void;
  onRename?: () => void;
  onPinChat?: () => void;
  onExport?: () => void;
  onDelete?: () => void;
  onModeChange?: (mode: KivoMode) => void;
  onUpgradeClick?: () => void;
  plan?: KivoPlan;
  mode?: KivoMode;
};

type ModeOption = {
  id: KivoMode;
  label: string;
  description: string;
  requiresPlus?: boolean;
};

const MODE_OPTIONS: ModeOption[] = [
  {
    id: 'operator',
    label: 'Kivo Operator – Plus only',
    description: 'Advanced autonomous workflows designed for complex tasks.',
    requiresPlus: true,
  },
  {
    id: 'smart',
    label: 'Kivo Smart',
    description: 'Versatile AI for planning, reasoning, and most daily tasks.',
  },
  {
    id: 'lite',
    label: 'Kivo Lite',
    description: 'A lightweight mode for fast everyday tasks.',
  },
];

function KivoLogoMark() {
  return (
    <svg
      viewBox="0 0 120 120"
      className="h-6 w-6 shrink-0"
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

function HeaderIconButton({
  onClick,
  children,
  label,
  active = false,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={[
        'inline-flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-200 ease-out active:scale-[0.96]',
        active
          ? 'border-black/8 bg-[#F1F3F7] text-[#1F2632] shadow-[0_6px_18px_rgba(15,23,42,0.06)]'
          : 'border-transparent bg-transparent text-[#202734] hover:bg-black/[0.04]',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function SummaryButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="hidden h-10 items-center gap-2 rounded-full border border-black/[0.08] bg-white px-3.5 text-[13px] font-semibold tracking-[-0.02em] text-[#202734] shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition-all duration-200 ease-out hover:bg-black/[0.02] active:scale-[0.98] sm:inline-flex"
      aria-label="Summarize chat"
    >
      <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="none">
        <path
          d="M6 8H18M6 12H14M6 16H12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <span>Summary</span>
    </button>
  );
}

function PlanBadge({
  plan,
  onClick,
}: {
  plan: KivoPlan;
  onClick?: () => void;
}) {
  const isPlus = plan === 'plus';

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-10 items-center gap-2 rounded-full border border-black/[0.08] bg-white px-4 text-[14px] font-semibold tracking-[-0.02em] text-[#202734] shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition-all duration-200 ease-out hover:bg-black/[0.02] active:scale-[0.98]"
      aria-label={isPlus ? 'Current plan: Plus' : 'Current plan: Free'}
    >
      <span className="text-[15px] leading-none">{isPlus ? '∞' : '⚡'}</span>
      <span>{isPlus ? 'Plus' : 'Free'}</span>
    </button>
  );
}

function MenuRow({
  label,
  icon,
  onClick,
  danger = false,
}: {
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors duration-150',
        danger
          ? 'text-[#DC2626] hover:bg-[#FEF2F2]'
          : 'text-[#202734] hover:bg-black/[0.03]',
      ].join(' ')}
    >
      <span className="text-[15px] font-medium tracking-[-0.02em]">{label}</span>
      <span className={danger ? 'text-[#DC2626]' : 'text-[#4B5563]'}>{icon}</span>
    </button>
  );
}

export function KivoChatHeader({
  hasMessages = false,
  onSummarize,
  onCreateTask,
  onRename,
  onPinChat,
  onExport,
  onDelete,
  onModeChange,
  onUpgradeClick,
  plan = 'free',
  mode = 'lite',
}: KivoChatHeaderProps) {
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);
  const [currentMode, setCurrentMode] = useState<KivoMode>(mode);

  const rightMenuRef = useRef<HTMLDivElement | null>(null);
  const modeMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setCurrentMode(mode);
  }, [mode]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (menuOpen && rightMenuRef.current && !rightMenuRef.current.contains(target)) {
        setMenuOpen(false);
      }

      if (modeOpen && modeMenuRef.current && !modeMenuRef.current.contains(target)) {
        setModeOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        setModeOpen(false);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [menuOpen, modeOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [hasMessages]);

  const selectedMode = useMemo(
    () => MODE_OPTIONS.find((item) => item.id === currentMode) ?? MODE_OPTIONS[0],
    [currentMode]
  );

  const handleBack = () => {
    router.push('/home');
  };

  const closeMoreMenu = () => {
    setMenuOpen(false);
  };

  const handleModeSelect = (nextMode: KivoMode) => {
    const option = MODE_OPTIONS.find((item) => item.id === nextMode);
    if (!option) return;

    if (option.requiresPlus && plan !== 'plus') {
      setModeOpen(false);
      onUpgradeClick?.();
      if (!onUpgradeClick) {
        router.push('/upgrade');
      }
      return;
    }

    setCurrentMode(nextMode);
    setModeOpen(false);
    onModeChange?.(nextMode);
  };

  return (
    <header
      className="relative z-30 border-b border-black/[0.035] bg-white/82 backdrop-blur-2xl"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="mx-auto flex h-[78px] w-full max-w-[560px] items-center gap-2 px-4 sm:px-5">
        <div className="flex w-[42px] shrink-0 justify-start">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#2B313D] transition-all duration-200 ease-out hover:bg-black/[0.04] active:scale-[0.96]"
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

        <div ref={modeMenuRef} className="relative flex min-w-0 flex-1 justify-center">
          <button
            type="button"
            onClick={() => {
              setModeOpen((value) => !value);
              setMenuOpen(false);
            }}
            aria-label="Open agent mode selector"
            className={[
              'inline-flex min-w-0 max-w-full items-center gap-2 rounded-full border px-3 py-2 text-[#202734] shadow-[0_10px_28px_rgba(15,23,42,0.05)] transition-all duration-200 ease-out active:scale-[0.985]',
              modeOpen
                ? 'border-black/[0.09] bg-[#EEF1F6]'
                : 'border-black/[0.07] bg-[#F5F6F8]/90 hover:bg-[#EFF1F5]',
            ].join(' ')}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/90 text-[#202734] shadow-[0_6px_16px_rgba(15,23,42,0.06)]">
              <KivoLogoMark />
            </span>

            <span className="truncate text-[18px] font-semibold tracking-[-0.04em]">
              {selectedMode.label.replace(' – Plus only', '')}
            </span>

            <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" fill="none">
              <path
                d="M5 7.5L10 12.5L15 7.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {modeOpen ? (
            <div className="absolute left-1/2 top-[52px] z-[60] w-[min(92vw,460px)] -translate-x-1/2 overflow-hidden rounded-[26px] border border-black/[0.07] bg-white/95 shadow-[0_24px_70px_rgba(15,23,42,0.18)] backdrop-blur-2xl">
              {MODE_OPTIONS.map((option, index) => {
                const isSelected = option.id === currentMode;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleModeSelect(option.id)}
                    className={[
                      'relative flex w-full items-start gap-3 px-5 py-4 text-left transition-colors duration-150 hover:bg-black/[0.03]',
                      index !== 0 ? 'border-t border-black/[0.06]' : '',
                    ].join(' ')}
                  >
                    <div className="flex w-6 shrink-0 items-center justify-center pt-1">
                      {isSelected ? (
                        <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none">
                          <path
                            d="M4 10.5L8 14.5L16 5.5"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : (
                        <span className="block h-[18px] w-[18px]" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-[17px] font-semibold tracking-[-0.035em] text-[#151B26]">
                        {option.label}
                      </div>
                      <p className="mt-1 text-[15px] leading-[1.35] tracking-[-0.02em] text-[#6B7280]">
                        {option.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        <div
          ref={rightMenuRef}
          className="relative flex min-w-[120px] shrink-0 items-center justify-end gap-1"
        >
          {hasMessages ? (
            <>
              <SummaryButton onClick={onSummarize} />

              <HeaderIconButton onClick={onCreateTask} label="Create task">
                <svg viewBox="0 0 24 24" className="h-[19px] w-[19px]" fill="none">
                  <circle
                    cx="12"
                    cy="12"
                    r="8.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    opacity="0.28"
                  />
                  <path
                    d="M12 8V16M8 12H16"
                    stroke="currentColor"
                    strokeWidth="2.1"
                    strokeLinecap="round"
                  />
                </svg>
              </HeaderIconButton>

              <HeaderIconButton
                onClick={() => {
                  setMenuOpen((value) => !value);
                  setModeOpen(false);
                }}
                label="More actions"
                active={menuOpen}
              >
                <svg viewBox="0 0 24 24" className="h-[19px] w-[19px]" fill="none">
                  <circle cx="6" cy="12" r="1.7" fill="currentColor" />
                  <circle cx="12" cy="12" r="1.7" fill="currentColor" />
                  <circle cx="18" cy="12" r="1.7" fill="currentColor" />
                </svg>
              </HeaderIconButton>

              {menuOpen ? (
                <div className="absolute right-0 top-[52px] z-50 w-[248px] overflow-hidden rounded-[24px] border border-black/[0.07] bg-white/95 shadow-[0_22px_60px_rgba(15,23,42,0.18)] backdrop-blur-2xl">
                  <div className="border-b border-black/[0.05] px-4 py-3">
                    <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#8A93A3]">
                      Smart actions
                    </div>
                  </div>

                  <MenuRow
                    label="Summarize"
                    onClick={() => {
                      closeMoreMenu();
                      onSummarize?.();
                    }}
                    icon={
                      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none">
                        <path
                          d="M6 8H18M6 12H14M6 16H12"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    }
                  />

                  <MenuRow
                    label="Create task"
                    onClick={() => {
                      closeMoreMenu();
                      onCreateTask?.();
                    }}
                    icon={
                      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none">
                        <path
                          d="M12 5V19M5 12H19"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    }
                  />

                  <div className="border-t border-black/[0.05] px-4 py-3">
                    <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#8A93A3]">
                      Organize
                    </div>
                  </div>

                  <MenuRow
                    label="Rename"
                    onClick={() => {
                      closeMoreMenu();
                      onRename?.();
                    }}
                    icon={
                      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none">
                        <path
                          d="M4 20H8L18 10C18.5 9.5 18.5 8.7 18 8.2L15.8 6C15.3 5.5 14.5 5.5 14 6L4 16V20Z"
                          stroke="currentColor"
                          strokeWidth="1.9"
                          strokeLinejoin="round"
                        />
                      </svg>
                    }
                  />

                  <MenuRow
                    label="Pin chat"
                    onClick={() => {
                      closeMoreMenu();
                      onPinChat?.();
                    }}
                    icon={
                      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none">
                        <path
                          d="M9 4H15L14 9L18 13L13 14L12 20L11 14L6 13L10 9L9 4Z"
                          stroke="currentColor"
                          strokeWidth="1.9"
                          strokeLinejoin="round"
                        />
                      </svg>
                    }
                  />

                  <MenuRow
                    label="Export"
                    onClick={() => {
                      closeMoreMenu();
                      onExport?.();
                    }}
                    icon={
                      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none">
                        <path
                          d="M12 16V5M12 5L8.5 8.5M12 5L15.5 8.5M5 15.5V17C5 18.1 5.9 19 7 19H17C18.1 19 19 18.1 19 17V15.5"
                          stroke="currentColor"
                          strokeWidth="1.9"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    }
                  />

                  <div className="border-t border-black/[0.05]">
                    <MenuRow
                      label="Delete"
                      danger
                      onClick={() => {
                        closeMoreMenu();
                        onDelete?.();
                      }}
                      icon={
                        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none">
                          <path
                            d="M5 7H19M9 7V5.8C9 5.35 9.35 5 9.8 5H14.2C14.65 5 15 5.35 15 5.8V7M9 11V17M15 11V17M7.8 7H16.2L15.6 19.2C15.57 19.66 15.19 20 14.73 20H9.27C8.81 20 8.43 19.66 8.4 19.2L7.8 7Z"
                            stroke="currentColor"
                            strokeWidth="1.9"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      }
                    />
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <PlanBadge
              plan={plan}
              onClick={() => {
                if (plan === 'free') {
                  onUpgradeClick?.();
                  if (!onUpgradeClick) {
                    router.push('/upgrade');
                  }
                }
              }}
            />
          )}
        </div>
      </div>
    </header>
  );
}

export default KivoChatHeader;
