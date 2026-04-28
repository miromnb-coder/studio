'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AnimatePresence,
  motion,
  type PanInfo,
  useDragControls,
} from 'framer-motion';
import {
  Calendar,
  CircleSlash,
  Diamond,
  Gift,
  Info,
  Sparkles,
  X,
} from 'lucide-react';
import { haptic } from '@/lib/haptics';

type UsageMetric = {
  credits: number;
  dailyUsed: number;
  dailyLimit: number;
  dailyResetsIn: string;
  monthlyUsed: number;
  monthlyLimit: number;
  monthlyResetsIn: string;
  bonusCredits: number;
};

type CreditHistoryEntry = {
  label: string;
  amount: number;
};

type CreditHistoryDay = {
  date: string;
  entries: CreditHistoryEntry[];
};

type KivoUsageSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
  planName?: string;
  planBadge?: string;
  planSubtitle?: string;
  timezoneLabel?: string;
  usage?: Partial<UsageMetric>;
  history?: CreditHistoryDay[];
};

const DEFAULT_USAGE: UsageMetric = {
  credits: 25,
  dailyUsed: 25,
  dailyLimit: 25,
  dailyResetsIn: '14h 18m',
  monthlyUsed: 25,
  monthlyLimit: 200,
  monthlyResetsIn: '12 days',
  bonusCredits: 0,
};

const DEFAULT_HISTORY: CreditHistoryDay[] = [
  {
    date: '26. Apr 2026',
    entries: [
      { label: 'Asked Kivo', amount: -4 },
      { label: 'Used Research Agent', amount: -12 },
      { label: 'Daily credits', amount: 25 },
    ],
  },
  {
    date: '25. Apr 2026',
    entries: [
      { label: 'Asked Kivo', amount: -3 },
      { label: 'Used Calendar Agent', amount: -8 },
    ],
  },
];

export function KivoUsageSheet({
  isOpen,
  onClose,
  onUpgrade,
  planName = 'Kivo Free',
  planBadge = 'Free',
  planSubtitle = 'Upgrade anytime to Kivo Pro',
  timezoneLabel = 'UTC+3',
  usage,
  history = DEFAULT_HISTORY,
}: KivoUsageSheetProps) {
  const dragControls = useDragControls();
  const [mounted, setMounted] = useState(false);
  const metric = { ...DEFAULT_USAGE, ...usage };
  const closeWithHaptic = useCallback(() => {
    haptic.selection();
    onClose();
  }, [onClose]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    haptic.light();

    const previousOverflow = document.body.style.overflow;
    const previousTouchAction = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeWithHaptic();
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.touchAction = previousTouchAction;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [closeWithHaptic, isOpen]);

  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    if (info.offset.y > 90 || info.velocity.y > 560) {
      closeWithHaptic();
    } else {
      haptic.light();
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        <div className="fixed inset-0 z-[99999]">
          <motion.button
            type="button"
            aria-label="Close usage sheet"
            className="absolute inset-0 bg-black/10 backdrop-blur-[1px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            onClick={closeWithHaptic}
          />

          <motion.aside
            className="fixed inset-x-0 bottom-0 z-[100000] mx-auto flex max-h-[82dvh] w-full max-w-[560px] flex-col overflow-hidden rounded-t-[34px] border border-black/[0.05] bg-[rgba(250,250,250,0.98)] shadow-[0_-24px_70px_rgba(0,0,0,0.18)] backdrop-blur-2xl"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 500, damping: 40, mass: 0.78 }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.16 }}
            onDragEnd={handleDragEnd}
          >
            <button
              type="button"
              aria-label="Drag to dismiss"
              onPointerDown={(event) => dragControls.start(event)}
              className="touch-none cursor-grab px-4 pb-3 pt-3 active:cursor-grabbing"
            >
              <span className="mx-auto block h-[6px] w-[74px] rounded-full bg-black/[0.12]" />
            </button>

            <div className="shrink-0 px-6 pb-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[40px] font-semibold tracking-[-0.048em] text-[#121212]">Usage</h2>

                <button
                  type="button"
                  onClick={closeWithHaptic}
                  aria-label="Close"
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-black/[0.06] bg-[#f3f3f3] text-black/85 transition active:scale-[0.95]"
                >
                  <X className="h-[26px] w-[26px]" strokeWidth={2.2} />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] [-webkit-overflow-scrolling:touch]">
              <section className="rounded-[28px] border border-black/[0.07] bg-white/90 p-4 shadow-[0_12px_28px_rgba(0,0,0,0.04)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[16px] font-semibold tracking-[-0.04em] text-[#111111]">{planName}</h3>
                      <span className="rounded-full bg-black/[0.06] px-3 py-1 text-[14px] font-medium tracking-[-0.03em] text-black/75">
                        {planBadge}
                      </span>
                    </div>
                    <p className="mt-1 text-[14px] tracking-[-0.02em] text-black/55">{planSubtitle}</p>
                  </div>

                  <button
                  type="button"
                  onClick={() => {
                    haptic.heavy();
                    onUpgrade?.();
                  }}
                    className="mt-1 inline-flex h-12 items-center justify-center rounded-full bg-black/[0.10] px-6 text-[16px] font-semibold tracking-[-0.02em] text-[#101010] transition active:scale-[0.97]"
                  >
                    Upgrade
                  </button>
                </div>

                <div className="my-4 h-px bg-black/[0.08]" />

                <MetricRow icon={Sparkles} label="Credits" value={String(metric.credits)} />
                <MetricRow
                  icon={Calendar}
                  label="Daily credits"
                  value={`${metric.dailyUsed} / ${metric.dailyLimit}`}
                  subValue={`Resets in ${metric.dailyResetsIn}`}
                />
                <MetricRow
                  icon={CircleSlash}
                  label="Monthly credits"
                  value={`${metric.monthlyUsed} / ${metric.monthlyLimit}`}
                  subValue={`Resets in ${metric.monthlyResetsIn}`}
                />
                <MetricRow icon={Gift} label="Bonus credits" value={String(metric.bonusCredits)} />
              </section>

              <section className="rounded-[28px] border border-black/[0.07] bg-white/90 p-4 shadow-[0_12px_28px_rgba(0,0,0,0.04)]">
                <div className="flex items-center justify-between gap-3 border-b border-black/[0.08] pb-3">
                  <h3 className="text-[17px] font-semibold tracking-[-0.03em] text-[#111111]">Credits history</h3>
                  <span className="inline-flex items-center gap-1 text-[17px] text-black/60">
                    {timezoneLabel}
                    <Info className="h-[20px] w-[20px]" strokeWidth={2.1} />
                  </span>
                </div>

                <div className="space-y-4 pt-4">
                  {history.map((day, dayIndex) => (
                    <div key={day.date}>
                      {dayIndex > 0 ? <div className="mb-4 h-px bg-black/[0.08]" /> : null}

                      <p className="mb-2 text-[14px] tracking-[-0.01em] text-black/55">{day.date}</p>

                      <div className="space-y-1.5">
                        {day.entries.map((entry) => (
                          <HistoryRow
                            key={`${day.date}-${entry.label}-${entry.amount}`}
                            label={entry.label}
                            amount={entry.amount}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-[22px] bg-black/[0.03] p-4">
                  <div className="flex gap-3">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center text-black/80">
                      <Diamond className="h-8 w-8" strokeWidth={1.9} />
                    </span>

                    <div>
                      <p className="text-[18px] font-semibold tracking-[-0.02em] text-[#101010]">
                        Credits power everything
                      </p>
                      <p className="mt-1 text-[14px] leading-[1.45] tracking-[-0.01em] text-black/62">
                        Each question, agent run and automation uses credits.
                        <br />
                        Upgrade to get more every month.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

function MetricRow({
  icon: Icon,
  label,
  value,
  subValue,
}: {
  icon: typeof Sparkles;
  label: string;
  value: string;
  subValue?: string;
}) {
  return (
    <div className="flex min-h-12 items-start justify-between py-1.5">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 text-black/90">
          <Icon className="h-6 w-6" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 text-[17px] tracking-[-0.03em] text-[#151515]">
            {label}
            <Info className="h-[18px] w-[18px] text-black/45" strokeWidth={2} />
          </span>
          {subValue ? (
            <p className="mt-0.5 text-[14px] tracking-[-0.01em] text-black/52">{subValue}</p>
          ) : null}
        </div>
      </div>

      <div className="min-w-[110px] text-right">
        <p className="text-[17px] font-medium tracking-[-0.03em] text-[#111111]">{value}</p>
      </div>
    </div>
  );
}

function HistoryRow({ label, amount }: { label: string; amount: number }) {
  const amountLabel = `${amount > 0 ? '+' : ''}${amount}`;

  return (
    <div className="flex items-center justify-between gap-2">
      <p className="text-[17px] tracking-[-0.03em] text-[#181818]">{label}</p>
      <p
        className={`text-[17px] font-medium tracking-[-0.03em] ${amount > 0 ? 'text-[#202020]' : 'text-[#1a1a1a]'}`}
      >
        {amountLabel}
      </p>
    </div>
  );
}
