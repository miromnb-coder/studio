'use client';

import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Flame,
  PiggyBank,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';

export default function MomentumPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen overflow-hidden bg-[#f7f7f5] text-[#2d3440]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#fbfbf9_0%,#f7f7f5_36%,#f1f3f6_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_10%,rgba(255,255,255,0.96),transparent_28%),radial-gradient(circle_at_82%_14%,rgba(219,227,241,0.6),transparent_28%),radial-gradient(circle_at_58%_74%,rgba(228,233,242,0.56),transparent_34%)]" />
        <div
          className="absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              'radial-gradient(rgba(124,136,158,0.24) 0.7px, transparent 0.7px)',
            backgroundSize: '16px 16px',
            backgroundPosition: 'center top',
          }}
        />
        <div className="absolute left-1/2 top-[6%] h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.95)_0%,rgba(255,255,255,0.26)_58%,rgba(255,255,255,0)_100%)] blur-[32px]" />
        <div className="absolute -left-[6%] top-[28%] h-[260px] w-[60%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(240,244,251,0.78)_0%,rgba(240,244,251,0.18)_62%,rgba(240,244,251,0)_100%)] blur-[34px]" />
        <div className="absolute bottom-[-120px] left-[-10%] h-[320px] w-[130%] rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(221,228,239,0.72)_0%,rgba(221,228,239,0.28)_46%,rgba(221,228,239,0)_100%)] blur-[36px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-[560px] flex-col">
        <header className="sticky top-0 z-30 border-b border-white/60 bg-[rgba(247,247,245,0.7)] px-5 pb-3 pt-4 backdrop-blur-2xl">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.push('/')}
              aria-label="Go back"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/80 bg-[rgba(255,255,255,0.74)] text-[#3b434f] shadow-[0_8px_18px_rgba(15,23,42,0.045)] transition-all duration-200 ease-out hover:bg-white active:scale-[0.985]"
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={1.9} />
            </button>

            <h1 className="text-[21px] font-medium tracking-[-0.04em] text-[#2d3440]">
              Momentum
            </h1>

            <div className="h-11 w-11" />
          </div>
        </header>

        <main className="flex flex-1 flex-col px-5 pb-12 pt-5">
          <section className="relative overflow-hidden rounded-[36px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(246,247,250,0.72))] p-5 shadow-[0_22px_48px_rgba(15,23,42,0.055)] backdrop-blur-2xl">
            <div className="pointer-events-none absolute right-[-40px] top-[-34px] h-[150px] w-[150px] rounded-full bg-[radial-gradient(circle,rgba(237,241,248,0.95)_0%,rgba(237,241,248,0.2)_58%,rgba(237,241,248,0)_100%)] blur-[8px]" />

            <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-[rgba(255,255,255,0.74)] px-3 py-1 text-[12px] font-medium tracking-[0.12em] text-[#8d97a6] shadow-[0_6px_14px_rgba(15,23,42,0.035)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#9aa7bb]" />
              KIVO
            </div>

            <h2 className="mt-4 text-[35px] font-medium tracking-[-0.065em] text-[#28303b]">
              Your momentum
            </h2>

            <p className="mt-3 max-w-[440px] text-[15px] leading-7 text-[#7d8391]">
              Track consistency, completed wins, and the real progress your life
              operator is creating.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-[28px] border border-white/80 bg-[rgba(255,255,255,0.76)] p-4 shadow-[0_14px_30px_rgba(15,23,42,0.05)]">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#eef3fb] text-[#6982a7]">
                  <Flame className="h-4.5 w-4.5" strokeWidth={2} />
                </div>
                <div className="mt-4 text-[13px] text-[#7d8594]">Current streak</div>
                <div className="mt-1 text-[30px] font-medium tracking-[-0.05em] text-[#2d3440]">
                  5 days
                </div>
                <div className="mt-1 text-[12px] text-[#8c94a2]">Consistency is building</div>
              </div>

              <div className="rounded-[28px] border border-white/80 bg-[rgba(255,255,255,0.76)] p-4 shadow-[0_14px_30px_rgba(15,23,42,0.05)]">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#edf4ef] text-[#7b9783]">
                  <PiggyBank className="h-4.5 w-4.5" strokeWidth={2} />
                </div>
                <div className="mt-4 text-[13px] text-[#7d8594]">Saved this month</div>
                <div className="mt-1 text-[30px] font-medium tracking-[-0.05em] text-[#2d3440]">
                  €164
                </div>
                <div className="mt-1 text-[12px] text-[#8c94a2]">+€24 available this week</div>
              </div>
            </div>
          </section>

          <section className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-[30px] border border-white/80 bg-[rgba(255,255,255,0.74)] p-4 shadow-[0_16px_34px_rgba(15,23,42,0.045)] backdrop-blur-2xl">
              <div className="flex items-center gap-2 text-[#6b82a5]">
                <CheckCircle2 className="h-5 w-5" strokeWidth={1.9} />
                <h3 className="text-[15px] font-semibold tracking-[-0.02em] text-[#313843]">
                  Wins today
                </h3>
              </div>

              <div className="mt-4 space-y-2 text-[14px] text-[#606a78]">
                <div className="flex items-center justify-between">
                  <span>Completed</span>
                  <span className="font-medium text-[#2d3440]">3</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Deep work</span>
                  <span className="font-medium text-[#2d3440]">2h</span>
                </div>
                <div className="pt-1 text-[13px] text-[#8c94a2]">
                  Strong start and clean follow-through
                </div>
              </div>
            </div>

            <div className="rounded-[30px] border border-white/80 bg-[rgba(255,255,255,0.74)] p-4 shadow-[0_16px_34px_rgba(15,23,42,0.045)] backdrop-blur-2xl">
              <div className="flex items-center gap-2 text-[#7a86b1]">
                <Target className="h-5 w-5" strokeWidth={1.9} />
                <h3 className="text-[15px] font-semibold tracking-[-0.02em] text-[#313843]">
                  Focus score
                </h3>
              </div>

              <div className="mt-4 space-y-2 text-[14px] text-[#606a78]">
                <div className="flex items-center justify-between">
                  <span>This week</span>
                  <span className="font-medium text-[#2d3440]">82%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Trend</span>
                  <span className="font-medium text-[#2d3440]">Upward</span>
                </div>
                <div className="pt-1 text-[13px] text-[#8c94a2]">
                  Best window: 14:00–16:00
                </div>
              </div>
            </div>
          </section>

          <section className="mt-5 rounded-[32px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.8),rgba(246,247,250,0.72))] p-4 shadow-[0_18px_36px_rgba(15,23,42,0.05)] backdrop-blur-2xl">
            <div className="flex items-center gap-2 text-[#8e73ab]">
              <BarChart3 className="h-5 w-5" strokeWidth={1.9} />
              <h3 className="text-[15px] font-semibold tracking-[-0.02em] text-[#313843]">
                Weekly movement
              </h3>
            </div>

            <div className="mt-4 grid grid-cols-7 gap-2">
              {[48, 62, 54, 74, 88, 76, 69].map((value, index) => (
                <div key={index} className="flex flex-col items-center gap-2">
                  <div className="flex h-28 w-full items-end justify-center rounded-[20px] bg-[rgba(247,248,251,0.9)] px-2 py-2">
                    <div
                      className="w-full rounded-full bg-[linear-gradient(180deg,#dfe8f6_0%,#9fbfcc_100%)]"
                      style={{ height: `${value}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-[#98a0ad]">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}
                  </span>
                </div>
              ))}
            </div>

            <p className="mt-4 text-[14px] leading-6 text-[#7d8391]">
              Your strongest day was Friday. Momentum stayed steady even with a
              lighter weekend pace.
            </p>
          </section>

          <section className="mt-5 rounded-[32px] border border-white/80 bg-[rgba(255,255,255,0.74)] p-4 shadow-[0_18px_36px_rgba(15,23,42,0.045)] backdrop-blur-2xl">
            <div className="flex items-center gap-2 text-[#8e73ab]">
              <Sparkles className="h-5 w-5" strokeWidth={1.9} />
              <h3 className="text-[15px] font-semibold tracking-[-0.02em] text-[#313843]">
                What is moving forward
              </h3>
            </div>

            <div className="mt-4 space-y-3">
              {[
                {
                  title: 'Design system is getting more consistent',
                  detail: 'Home and page structure now feel like one product.',
                },
                {
                  title: 'Money awareness is improving',
                  detail: 'Savings opportunities are becoming visible, not hidden.',
                },
                {
                  title: 'Execution rhythm is stabilizing',
                  detail: 'You are finishing more before switching context.',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex items-start justify-between gap-3 rounded-[24px] border border-white/85 bg-[rgba(255,255,255,0.76)] px-4 py-4 shadow-[0_10px_22px_rgba(15,23,42,0.04)]"
                >
                  <div>
                    <div className="text-[15px] font-medium tracking-[-0.02em] text-[#313843]">
                      {item.title}
                    </div>
                    <div className="mt-1 text-[14px] leading-6 text-[#7b8391]">
                      {item.detail}
                    </div>
                  </div>
                  <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-[#a2a8b3]" strokeWidth={1.8} />
                </div>
              ))}
            </div>
          </section>

          <button
            type="button"
            onClick={() => router.push('/flow')}
            className="mt-5 inline-flex items-center justify-between rounded-[28px] border border-white/80 bg-[rgba(255,255,255,0.76)] px-4 py-4 text-left shadow-[0_14px_30px_rgba(15,23,42,0.05)] transition-all duration-200 ease-out hover:bg-white active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#eef3fb] text-[#6982a7]">
                <TrendingUp className="h-5 w-5" strokeWidth={2} />
              </div>
              <div>
                <div className="text-[15px] font-semibold tracking-[-0.02em] text-[#2d3440]">
                  Open Flow
                </div>
                <div className="mt-1 text-[13px] text-[#7d8594]">
                  Turn momentum into your next best move
                </div>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-[#a2a8b3]" strokeWidth={1.8} />
          </button>
        </main>
      </div>
    </div>
  );
}
