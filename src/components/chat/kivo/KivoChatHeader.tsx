'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, HelpCircle, Search, Sparkles, X } from 'lucide-react';

type Props = {
  hasMessages?: boolean;
  onSidebarToggle?: () => void;
  isSidebarOpen?: boolean;
  onSummarize?: () => void;
  onCreateTask?: () => void;
};

type CreditHistoryItem = {
  id: string;
  title: string;
  amount: number;
  reason?: string;
  created_at: string;
  status?: string;
};

type CreditSnapshot = {
  plan?: 'free' | 'plus' | 'pro';
  credits?: number;
  monthlyCredits?: number;
  freeCredits?: number;
  monthlyUsed?: number;
  history?: CreditHistoryItem[];
};

function useAnimatedNumber(value: number) {
  const [displayValue, setDisplayValue] = useState(value);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (frameRef.current) window.cancelAnimationFrame(frameRef.current);

    setDisplayValue((currentValue) => {
      const startValue = currentValue;
      const diff = value - startValue;
      if (diff === 0) return currentValue;

      const startedAt = performance.now();
      const duration = 620;

      const tick = (now: number) => {
        const progress = Math.min(1, (now - startedAt) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayValue(Math.round(startValue + diff * eased));

        if (progress < 1) frameRef.current = window.requestAnimationFrame(tick);
      };

      frameRef.current = window.requestAnimationFrame(tick);
      return currentValue;
    });

    return () => {
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    };
  }, [value]);

  return displayValue;
}

function formatPlan(plan?: string) {
  if (plan === 'pro') return 'Kivo Pro';
  if (plan === 'plus') return 'Kivo Plus';
  return 'Kivo Free';
}

function formatDateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recent';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function groupHistory(history: CreditHistoryItem[]) {
  return history.reduce<Record<string, CreditHistoryItem[]>>((groups, item) => {
    const label = formatDateLabel(item.created_at);
    groups[label] = groups[label] || [];
    groups[label].push(item);
    return groups;
  }, {});
}

function buildChart(history: CreditHistoryItem[]) {
  const lastItems = history.slice(0, 7).reverse();
  const max = Math.max(1, ...lastItems.map((item) => Math.abs(item.amount)));

  return lastItems.map((item) => ({
    id: item.id,
    label: new Date(item.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
    amount: item.amount,
    height: Math.max(18, Math.round((Math.abs(item.amount) / max) * 86)),
  }));
}

export default function KivoChatHeader({ hasMessages = false, onSidebarToggle }: Props) {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<CreditSnapshot | null>(null);
  const [credits, setCredits] = useState<number>(0);
  const [creditPulse, setCreditPulse] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartYRef = useRef(0);
  const previousCreditsRef = useRef<number | null>(null);
  const animatedCredits = useAnimatedNumber(credits);

  const monthlyCredits = Number(snapshot?.monthlyCredits ?? 0);
  const monthlyUsed = Number(snapshot?.monthlyUsed ?? 0);
  const monthlyRemaining = Math.max(0, monthlyCredits - monthlyUsed);
  const freeCredits = Number(snapshot?.freeCredits ?? 0);
  const dailyRefreshCredits = snapshot?.plan === 'free' ? freeCredits : 0;
  const history = snapshot?.history ?? [];
  const filteredHistory = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return history;
    return history.filter((item) => `${item.title} ${item.reason ?? ''} ${item.amount}`.toLowerCase().includes(query));
  }, [history, searchQuery]);
  const groupedHistory = useMemo(() => groupHistory(filteredHistory), [filteredHistory]);
  const chartItems = useMemo(() => buildChart(history), [history]);
  const spentTotal = history.filter((item) => item.amount < 0).reduce((sum, item) => sum + Math.abs(item.amount), 0);
  const earnedTotal = history.filter((item) => item.amount > 0).reduce((sum, item) => sum + item.amount, 0);

  const glowClass = useMemo(() => {
    if (credits >= 1000) return 'shadow-[0_0_0_1px_rgba(0,0,0,0.035),0_8px_24px_rgba(124,58,237,0.18)]';
    if (credits >= 500) return 'shadow-[0_0_0_1px_rgba(0,0,0,0.035),0_6px_18px_rgba(59,130,246,0.13)]';
    return 'shadow-[0_0_0_1px_rgba(0,0,0,0.035),inset_0_1px_0_rgba(255,255,255,0.84)]';
  }, [credits]);

  useEffect(() => {
    let mounted = true;
    let pulseTimer: ReturnType<typeof window.setTimeout> | undefined;

    const loadCredits = async () => {
      try {
        const response = await fetch('/api/credits', { cache: 'no-store' });
        if (!response.ok) return;
        const data: CreditSnapshot = await response.json();
        const nextCredits = Number(data?.credits ?? 0);
        if (!mounted) return;

        setSnapshot(data);
        setCredits(nextCredits);

        if (previousCreditsRef.current !== null && previousCreditsRef.current !== nextCredits) {
          setCreditPulse(true);
          if (pulseTimer) window.clearTimeout(pulseTimer);
          pulseTimer = window.setTimeout(() => setCreditPulse(false), 560);
        }

        previousCreditsRef.current = nextCredits;
      } catch {
        // Keep the header quiet if credits are unavailable.
      }
    };

    loadCredits();
    const intervalId = window.setInterval(loadCredits, 15000);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
      if (pulseTimer) window.clearTimeout(pulseTimer);
    };
  }, []);

  const closeSheet = () => {
    setDragY(0);
    setIsDragging(false);
    setSheetOpen(false);
    setSearchQuery('');
  };

  const openCreditSheet = () => {
    window.navigator.vibrate?.(8);
    setSheetOpen(true);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLElement>) => {
    dragStartYRef.current = event.clientY;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (!isDragging) return;
    setDragY(Math.max(0, event.clientY - dragStartYRef.current));
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    if (dragY > 110) closeSheet();
    else setDragY(0);
    setIsDragging(false);
  };

  return (
    <>
      <style>{`
        @keyframes kivoSheetSpringIn {
          0% { transform: translateY(108%) scale(.985); opacity: .76; }
          62% { transform: translateY(-10px) scale(1.002); opacity: 1; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>
      <header className="relative z-30 border-b border-black/[0.035] bg-white/82 backdrop-blur-2xl" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="mx-auto flex h-[74px] w-full max-w-[560px] items-center px-4">
          <button type="button" onClick={onSidebarToggle ?? (() => router.push('/home'))} aria-label="Open menu" className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#1C2431] active:scale-[0.96]">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none"><path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
          <div className="flex-1 text-center text-[17px] font-semibold tracking-[-0.04em] text-[#131A25]">{hasMessages ? 'Kivo 1.6' : 'Kivo Lite'}</div>
          <button
            type="button"
            onClick={openCreditSheet}
            aria-label={`Credits balance ${credits}`}
            className={`inline-flex h-[39px] min-w-[78px] items-center justify-center gap-[7px] rounded-full border border-[#DCDCDC] bg-[#F5F5F3]/82 px-[12px] text-[18px] font-semibold leading-none tracking-[-0.055em] text-[#343434] backdrop-blur-2xl transition-[transform,background-color,border-color,box-shadow] duration-300 ease-out active:scale-[0.94] ${glowClass} ${creditPulse ? 'scale-[1.045] border-[#CFCFCF] bg-white/92' : ''}`}
          >
            <Sparkles className={`h-[24px] w-[24px] shrink-0 text-[#111111] transition-transform duration-500 ease-out ${creditPulse ? 'rotate-[-12deg] scale-110' : ''}`} strokeWidth={2.08} />
            <span className="relative inline-flex h-[22px] min-w-[28px] items-center justify-center overflow-hidden tabular-nums">
              <span key={animatedCredits} className={`block transition-[transform,opacity,filter] duration-300 ease-out ${creditPulse ? 'translate-y-0 scale-105 opacity-100' : 'translate-y-0 scale-100 opacity-100'}`}>
                {animatedCredits}
              </span>
            </span>
          </button>
        </div>
      </header>

      {sheetOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#101827]/26 px-0 backdrop-blur-[2px]" onClick={closeSheet}>
          <section
            className="relative max-h-[calc(100dvh-68px)] w-full max-w-[560px] overflow-hidden rounded-t-[34px] border border-white/60 bg-[#F7F8FB]/96 text-[#131A25] shadow-[0_-24px_90px_rgba(15,23,42,0.20)] backdrop-blur-2xl"
            onClick={(event) => event.stopPropagation()}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{
              paddingBottom: 'env(safe-area-inset-bottom, 12px)',
              transform: `translateY(${dragY}px)`,
              transition: isDragging ? 'none' : 'transform 520ms cubic-bezier(.18,1.18,.22,1)',
              animation: 'kivoSheetSpringIn 520ms cubic-bezier(.18,1.18,.22,1)',
            }}
          >
            <div className="absolute inset-x-8 top-[-18px] h-[26px] rounded-t-[26px] bg-white/50 blur-[1px]" />
            <div className="sticky top-0 z-10 border-b border-black/[0.035] bg-[#F7F8FB]/90 px-5 pb-4 pt-3 backdrop-blur-2xl">
              <div className="mx-auto mb-3 h-1.5 w-11 rounded-full bg-black/14" />
              <div className="grid grid-cols-[44px_1fr_44px] items-center">
                <button type="button" onClick={closeSheet} className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[#202833] active:scale-95">
                  <X className="h-7 w-7" strokeWidth={2.15} />
                </button>
                <h2 className="text-center text-[22px] font-semibold tracking-[-0.045em]">Usage</h2>
                <div />
              </div>
            </div>

            <div className="max-h-[calc(100dvh-146px)] overflow-y-auto px-4 pb-8 pt-5">
              <div className="rounded-[29px] border border-black/[0.055] bg-gradient-to-br from-[#EEF3FA] via-[#F4F6FA] to-[#ECEFF5] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_18px_50px_rgba(31,41,55,0.06)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-serif text-[28px] font-bold tracking-[-0.045em] text-[#20242C]">{formatPlan(snapshot?.plan)}</h3>
                    <p className="mt-1 text-[15px] font-medium text-[#6D7480]">Next refresh&nbsp;&nbsp;<span className="text-[#343B46]">Auto monthly</span></p>
                  </div>
                  <button type="button" onClick={() => router.push('/upgrade')} className="rounded-full bg-black/[0.075] px-5 py-2.5 text-[16px] font-semibold tracking-[-0.03em] text-[#2E3440] active:scale-[0.97]">
                    Upgrade
                  </button>
                </div>

                <div className="my-5 border-t border-dashed border-black/[0.09]" />

                <div className="space-y-3.5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5 text-[20px] font-semibold tracking-[-0.045em]">
                      <Sparkles className="h-7 w-7 text-[#151A22]" strokeWidth={2.08} />
                      <span>Credits</span>
                      <HelpCircle className="h-5 w-5 text-[#8A919C]" strokeWidth={2.1} />
                    </div>
                    <span className="text-[20px] font-semibold tabular-nums tracking-[-0.035em]">{credits}</span>
                  </div>

                  <div className="flex items-center justify-between text-[18px] tracking-[-0.04em] text-[#727985]"><span>Free credits</span><span className="tabular-nums">{freeCredits}</span></div>
                  <div className="flex items-center justify-between text-[18px] tracking-[-0.04em] text-[#727985]"><span>Monthly credits</span><span className="tabular-nums">{monthlyRemaining} / {monthlyCredits}</span></div>

                  <div className="flex items-center justify-between gap-4 pt-1">
                    <div className="flex items-center gap-2.5 text-[19px] font-semibold tracking-[-0.045em]">
                      <CalendarDays className="h-7 w-7 text-[#1D2530]" strokeWidth={2.05} />
                      <span>Daily refresh credits</span>
                      <HelpCircle className="h-5 w-5 text-[#8A919C]" strokeWidth={2.1} />
                    </div>
                    <span className="text-[20px] font-semibold tabular-nums tracking-[-0.035em]">{dailyRefreshCredits}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-[26px] border border-black/[0.055] bg-white/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-medium text-[#8A919C]">Recent flow</p>
                    <p className="mt-1 text-[18px] font-semibold tracking-[-0.045em]">Spent {spentTotal} · Earned {earnedTotal}</p>
                  </div>
                  <Sparkles className="h-6 w-6 text-[#6274A2]" strokeWidth={2.05} />
                </div>
                <div className="mt-4 flex h-[104px] items-end gap-2 rounded-[22px] bg-gradient-to-b from-[#F5F7FB] to-[#EEF2F8] px-3 pb-3 pt-4">
                  {chartItems.length ? chartItems.map((item) => (
                    <div key={item.id} className="flex flex-1 flex-col items-center gap-2">
                      <div
                        className={`w-full max-w-[24px] rounded-full ${item.amount > 0 ? 'bg-[#9CE4C1]' : 'bg-[#B9C7EA]'}`}
                        style={{ height: `${item.height}px` }}
                        title={`${item.label}: ${item.amount}`}
                      />
                    </div>
                  )) : <div className="flex h-full w-full items-center justify-center text-[14px] font-medium text-[#8A919C]">No chart data yet</div>}
                </div>
              </div>

              <div className="mt-7 flex items-center justify-between px-1">
                <h3 className="text-[26px] font-semibold tracking-[-0.055em]">Credits history</h3>
                <div className="flex items-center gap-1.5 text-[16px] font-medium text-[#8A919C]"><span>UTC+3</span><HelpCircle className="h-5 w-5" strokeWidth={2.1} /></div>
              </div>

              <label className="mt-4 flex h-12 items-center gap-2 rounded-full border border-black/[0.055] bg-white/72 px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                <Search className="h-5 w-5 text-[#8A919C]" strokeWidth={2.05} />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search credit history"
                  className="h-full flex-1 bg-transparent text-[16px] font-medium tracking-[-0.03em] text-[#252B35] outline-none placeholder:text-[#9AA1AB]"
                />
              </label>

              <div className="mt-4 space-y-5 px-1">
                {Object.entries(groupedHistory).length ? (
                  Object.entries(groupedHistory).map(([date, items]) => (
                    <section key={date} className="border-b border-black/[0.06] pb-4 last:border-b-0">
                      <p className="mb-3 text-[16px] font-medium tracking-[-0.02em] text-[#8A919C]">{date}</p>
                      <div className="space-y-3">
                        {items.map((item) => (
                          <div key={item.id} className="grid grid-cols-[1fr_auto] items-center gap-4">
                            <p className="truncate text-[19px] font-medium tracking-[-0.045em] text-[#242A33]">{item.title || item.reason || 'Credit event'}</p>
                            <p className={`text-[19px] font-semibold tabular-nums tracking-[-0.035em] ${item.amount > 0 ? 'text-[#167A4A]' : 'text-[#242A33]'}`}>{item.amount > 0 ? `+${item.amount}` : item.amount}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  ))
                ) : (
                  <div className="rounded-[24px] border border-black/[0.055] bg-white/65 p-5 text-center text-[15px] font-medium text-[#7B8491]">
                    {searchQuery ? 'No matching credit history.' : 'No credit history yet.'}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
