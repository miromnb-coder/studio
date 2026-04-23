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
  onFavorite?: () => void;
  onViewFiles?: () => void;
  onTaskDetails?: () => void;
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

function HeaderTextButton({
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
        'inline-flex items-center justify-center rounded-full transition-all duration-200 ease-out active:scale-[0.97]',
        active ? 'opacity-100' : 'opacity-100 hover:opacity-70',
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
      className="hidden items-center gap-2 text-[15px] font-medium tracking-[-0.025em] text-[#1C2431] transition-opacity duration-200 hover:opacity-70 active:scale-[0.98] sm:inline-flex"
      aria-label="Summarize chat"
    >
      <svg viewBox="0 0 24 24" className="h-[16px] w-[16px]" fill="none">
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

function IconAction({
  onClick,
  label,
  active = false,
  children,
}: {
  onClick?: () => void;
  label: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={[
        'inline-flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 ease-out active:scale-[0.96]',
        active ? 'bg-black/[0.055] text-[#1C2431]' : 'text-[#1C2431] hover:bg-black/[0.04]',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function PlainPlanIndicator({
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
      className="inline-flex items-center gap-1.5 text-[16px] font-medium tracking-[-0.025em] text-[#1C2431] transition-opacity duration-200 hover:opacity-70 active:scale-[0.98]"
      aria-label={isPlus ? 'Current plan Plus' : 'Current plan Free'}
    >
      <span className="inline-flex h-4 w-4 items-center justify-center text-[#4B5563]">
        {isPlus ? (
          <svg viewBox="0 0 20 20" className="h-[14px] w-[14px]" fill="none">
            <path
              d="M6 10C6 7.8 7.3 6.3 9 6.3C10.8 6.3 12 7.8 12 10C12 12.2 10.8 13.7 9 13.7C7.3 13.7 6 12.2 6 10ZM8.9 10C8.9 11 9.3 11.7 10 11.7C10.7 11.7 11.1 11 11.1 10C11.1 9 10.7 8.3 10 8.3C9.3 8.3 8.9 9 8.9 10ZM12.2 10C12.2 7.8 13.4 6.3 15.2 6.3C16.9 6.3 18.2 7.8 18.2 10C18.2 12.2 16.9 13.7 15.2 13.7C13.4 13.7 12.2 12.2 12.2 10ZM15.1 10C15.1 11 15.5 11.7 16.2 11.7C16.9 11.7 17.3 11 17.3 10C17.3 9 16.9 8.3 16.2 8.3C15.5 8.3 15.1 9 15.1 10Z"
              fill="currentColor"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 20 20" className="h-[14px] w-[14px]" fill="none">
            <path
              d="M11.1 2.8L5.6 10.1H9.5L8.8 17.2L14.4 9.9H10.5L11.1 2.8Z"
              fill="currentColor"
            />
          </svg>
        )}
      </span>
      <span>{isPlus ? 'Plus' : 'Free'}</span>
    </button>
  );
}

function FloatingPanel({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        'overflow-hidden rounded-[28px] border border-black/[0.07] bg-white/96 shadow-[0_28px_90px_rgba(15,23,42,0.18)] backdrop-blur-[18px]',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-black/[0.075]" />;
}

function ModeOptionRow({
  option,
  selected,
  onClick,
}: {
  option: ModeOption;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start gap-3 px-6 py-5 text-left transition-colors duration-150 hover:bg-black/[0.022]"
    >
      <div className="flex w-6 shrink-0 items-start justify-center pt-1.5">
        {selected ? (
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
        <div className="text-[17px] font-semibold tracking-[-0.035em] text-[#131A25]">
          {option.label}
        </div>
        <div className="mt-1 text-[15px] leading-[1.34] tracking-[-0.02em] text-[#6B7280]">
          {option.description}
        </div>
      </div>
    </button>
  );
}

function ActionRow({
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
        'flex w-full items-center justify-between px-7 py-5 text-left transition-colors duration-150',
        danger ? 'text-[#E14B4B] hover:bg-[#FEF2F2]' : 'text-[#131A25] hover:bg-black/[0.022]',
      ].join(' ')}
    >
      <span className="text-[16px] font-medium tracking-[-0.025em]">{label}</span>
      <span className={danger ? 'text-[#E14B4B]' : 'text-[#374151]'}>{icon}</span>
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
  onFavorite,
  onViewFiles,
  onTaskDetails,
  plan = 'free',
  mode = 'lite',
}: KivoChatHeaderProps) {
  const router = useRouter();

  const [modeOpen, setModeOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [currentMode, setCurrentMode] = useState<KivoMode>(mode);

  const modeRef = useRef<HTMLDivElement | null>(null);
  const moreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setCurrentMode(mode);
  }, [mode]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (modeOpen && modeRef.current && !modeRef.current.contains(target)) {
        setModeOpen(false);
      }
      if (moreOpen && moreRef.current && !moreRef.current.contains(target)) {
        setMoreOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setModeOpen(false);
        setMoreOpen(false);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [modeOpen, moreOpen]);

  const selectedMode = useMemo(
    () => MODE_OPTIONS.find((item) => item.id === currentMode) ?? MODE_OPTIONS[0],
    [currentMode]
  );

  const handleBack = () => {
    router.push('/home');
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
      <div className="mx-auto flex h-[78px] w-full max-w-[560px] items-center px-5">
        <div className="flex w-[44px] shrink-0 justify-start">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#1C2431] transition-all duration-200 ease-out hover:bg-black/[0.04] active:scale-[0.96]"
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

        <div className="flex min-w-0 flex-1 justify-center">
          <div ref={modeRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setModeOpen((v) => !v);
                setMoreOpen(false);
              }}
              aria-label="Open agent mode selector"
              className="inline-flex items-center gap-1.5 text-[18px] font-semibold tracking-[-0.04em] text-[#131A25] transition-opacity duration-200 hover:opacity-70 active:scale-[0.985]"
            >
              <span>{selectedMode.label.replace(' – Plus only', '')}</span>
              <svg viewBox="0 0 20 20" className="h-[16px] w-[16px]" fill="none">
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
              <div className="absolute left-1/2 top-[44px] z-[70] w-[min(88vw,470px)] -translate-x-1/2 px-2">
                <FloatingPanel>
                  {MODE_OPTIONS.map((option, index) => (
                    <div key={option.id}>
                      {index !== 0 ? <Divider /> : null}
                      <ModeOptionRow
                        option={option}
                        selected={option.id === currentMode}
                        onClick={() => handleModeSelect(option.id)}
                      />
                    </div>
                  ))}
                </FloatingPanel>
              </div>
            ) : null}
          </div>
        </div>

        <div
          ref={moreRef}
          className="flex min-w-[120px] shrink-0 items-center justify-end gap-3"
        >
          {hasMessages ? (
            <>
              <SummaryButton onClick={onSummarize} />

              <IconAction onClick={onCreateTask} label="Create task">
                <svg viewBox="0 0 24 24" className="h-[19px] w-[19px]" fill="none">
                  <path
                    d="M12 5V19M5 12H19"
                    stroke="currentColor"
                    strokeWidth="2.1"
                    strokeLinecap="round"
                  />
                </svg>
              </IconAction>

              <div className="relative">
                <IconAction
                  onClick={() => {
                    setMoreOpen((v) => !v);
                    setModeOpen(false);
                  }}
                  label="More actions"
                  active={moreOpen}
                >
                  <svg viewBox="0 0 24 24" className="h-[19px] w-[19px]" fill="none">
                    <circle cx="6" cy="12" r="1.7" fill="currentColor" />
                    <circle cx="12" cy="12" r="1.7" fill="currentColor" />
                    <circle cx="18" cy="12" r="1.7" fill="currentColor" />
                  </svg>
                </IconAction>

                {moreOpen ? (
                  <div className="absolute right-[-8px] top-[42px] z-[70] w-[min(84vw,320px)] px-2">
                    <FloatingPanel>
                      <ActionRow
                        label="Favorite"
                        onClick={() => {
                          setMoreOpen(false);
                          onFavorite?.();
                        }}
                        icon={
                          <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none">
                            <path
                              d="M12 4.8L14.3 9.3L19.2 10L15.6 13.5L16.5 18.4L12 16L7.5 18.4L8.4 13.5L4.8 10L9.7 9.3L12 4.8Z"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinejoin="round"
                            />
                          </svg>
                        }
                      />
                      <Divider />
                      <ActionRow
                        label="Rename"
                        onClick={() => {
                          setMoreOpen(false);
                          onRename?.();
                        }}
                        icon={
                          <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none">
                            <path
                              d="M4 20H8L18 10C18.5 9.5 18.5 8.7 18 8.2L15.8 6C15.3 5.5 14.5 5.5 14 6L4 16V20Z"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinejoin="round"
                            />
                          </svg>
                        }
                      />
                      <Divider />
                      <ActionRow
                        label="View all files"
                        onClick={() => {
                          setMoreOpen(false);
                          onViewFiles?.();
                        }}
                        icon={
                          <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none">
                            <path
                              d="M8 4H14L19 9V20H8C6.9 20 6 19.1 6 18V6C6 4.9 6.9 4 8 4Z"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M14 4V9H19"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M10 14H15"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                            />
                            <path
                              d="M10 17H13"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                            />
                          </svg>
                        }
                      />
                      <Divider />
                      <ActionRow
                        label="Task details"
                        onClick={() => {
                          setMoreOpen(false);
                          onTaskDetails?.();
                        }}
                        icon={
                          <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none">
                            <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
                            <path
                              d="M12 10.2V15.2"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                            />
                            <circle cx="12" cy="7.7" r="1" fill="currentColor" />
                          </svg>
                        }
                      />
                      <Divider />
                      <ActionRow
                        label="Delete"
                        danger
                        onClick={() => {
                          setMoreOpen(false);
                          onDelete?.();
                        }}
                        icon={
                          <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none">
                            <path
                              d="M5 7H19M9 7V5.8C9 5.35 9.35 5 9.8 5H14.2C14.65 5 15 5.35 15 5.8V7M9 11V17M15 11V17M7.8 7H16.2L15.6 19.2C15.57 19.66 15.19 20 14.73 20H9.27C8.81 20 8.43 19.66 8.4 19.2L7.8 7Z"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        }
                      />
                    </FloatingPanel>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <PlainPlanIndicator
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
