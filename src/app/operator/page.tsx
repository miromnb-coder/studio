'use client';

import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Bot,
  ChevronRight,
  CircleAlert,
  Clock3,
  PiggyBank,
  Sparkles,
  TriangleAlert,
  WandSparkles,
} from 'lucide-react';

export default function OperatorPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen overflow-hidden bg-[#f7f7f5] text-[#2d3440]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#fbfbf9_0%,#f7f7f5_36%,#f1f3f6_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_10%,rgba(255,255,255,0.96),transparent_28%),radial-gradient(circle_at_82%_14%,rgba(228,233,242,0.6),transparent_28%),radial-gradient(circle_at_58%_74%,rgba(236,230,243,0.52),transparent_34%)]" />
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
              Operator
            </h1>

            <div className="h-11 w-11" />
          </div>
        </header>

        <main className="flex flex-1 flex-col px-5 pb-12 pt-5">
          <section className="relative overflow-hidden rounded-[36px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(246,247,250,0.72))] p-5 shadow-[0_22px_48px_rgba(15,23,42,0.055)] backdrop-blur-2xl">
            <div className="pointer-events-none absolute right-[-38px] top-[-30px] h-[140px] w-[140px] rounded-full bg-[radial-gradient(circle,rgba(243,238,248,0.95)_0%,rgba(243,238,248,0.2)_58%,rgba(243,238,248,0)_100%)] blur-[8px]" />

            <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-[rgba(255,255,255,0.74)] px-3 py-1 text-[12px] font-medium tracking-[0.12em] text-[#8d97a6] shadow-[0_6px_14px_rgba(15,23,42,0.035)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#9aa7bb]" />
              KIVO
            </div>

            <h2 className="mt-4 text-[35px] font-medium tracking-[-0.065em] text-[#28303b]">
              What matters now
            </h2>

            <p className="mt-3 max-w-[440px] text-[15px] leading-7 text-[#7d8391]">
              Your operator surfaces priorities, hidden opportunities, and the
              best actions to take next.
            </p>

            <div className="mt-5 space-y-3">
              {[
                {
                  icon: PiggyBank,
                  chipBg: 'bg-[#edf4ef]',
                  chipText: 'text-[#7b9783]',
                  title: 'You can save €24 this week',
                  detail: 'Unused subscriptions and one lower-cost option were found.',
                },
                {
                  icon: Clock3,
                  chipBg: 'bg-[#eef3fb]',
                  chipText: 'text-[#6982a7]',
                  title: 'Your best focus window starts in 35 min',
                  detail: 'A high-value block is opening soon. Protect it now.',
                },
                {
                  icon: TriangleAlert,
                  chipBg: 'bg-[#f8eee5]',
                  chipText: 'text-[#af7b58]',
                  title: '1 important task needs action',
                  detail: 'A blocked step is slowing overall progress.',
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="flex items-start gap-4 rounded-[26px] border border-white/85 bg-[rgba(255,255,255,0.76)] px-4 py-4 shadow-[0_10px_22px_rgba(15,23,42,0.04)]"
                  >
                    <div
                      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${item.chipBg} ${item.chipText}`}
                    >
                      <Icon className="h-5 w-5" strokeWidth={2} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-[15px] font-semibold tracking-[-0.02em] text-[#2d3440]">
                        {item.title}
                      </div>
                      <div className="mt-1 text-[14px] leading-6 text-[#7b8391]">
                        {item.detail}
                      </div>
                    </div>

                    <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-[#a2a8b3]" strokeWidth={1.8} />
                  </div>
                );
              })}
            </div>
          </section>

          <section className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              className="rounded-[30px] border border-white/80 bg-[rgba(255,255,255,0.74)] p-4 text-left shadow-[0_16px_34px_rgba(15,23,42,0.045)] backdrop-blur-2xl transition-all duration-200 ease-out hover:bg-white active:scale-[0.99]"
            >
              <div className="flex items-center gap-2 text-[#8a73a6]">
                <WandSparkles className="h-5 w-5" strokeWidth={1.9} />
                <h3 className="text-[15px] font-semibold tracking-[-0.02em] text-[#313843]">
                  Suggested move
                </h3>
              </div>
              <p className="mt-4 text-[24px] font-medium leading-[1.15] tracking-[-0.05em] text-[#2d3440]">
                Cancel unused subscription
              </p>
              <p className="mt-2 text-[14px] leading-6 text-[#7d8391]">
                Estimated impact: €12/month
              </p>
            </button>

            <button
              type="button"
              className="rounded-[30px] border border-white/80 bg-[rgba(255,255,255,0.74)] p-4 text-left shadow-[0_16px_34px_rgba(15,23,42,0.045)] backdrop-blur-2xl transition-all duration-200 ease-out hover:bg-white active:scale-[0.99]"
            >
              <div className="flex items-center gap-2 text-[#7a86b1]">
                <Bot className="h-5 w-5" strokeWidth={1.9} />
                <h3 className="text-[15px] font-semibold tracking-[-0.02em] text-[#313843]">
                  AI pattern
                </h3>
              </div>
              <p className="mt-4 text-[24px] font-medium leading-[1.15] tracking-[-0.05em] text-[#2d3440]">
                Repeated priority detected
              </p>
              <p className="mt-2 text-[14px] leading-6 text-[#7d8391]">
                3 recent threads point to the same unfinished need.
              </p>
            </button>
          </section>

          <section className="mt-5 rounded-[32px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.8),rgba(246,247,250,0.72))] p-4 shadow-[0_18px_36px_rgba(15,23,42,0.05)] backdrop-blur-2xl">
            <div className="flex items-center gap-2 text-[#8e73ab]">
              <Sparkles className="h-5 w-5" strokeWidth={1.9} />
              <h3 className="text-[15px] font-semibold tracking-[-0.02em] text-[#313843]">
                Recommended actions
              </h3>
            </div>

            <div className="mt-4 space-y-3">
              {[
                'Review spending and remove one hidden leak',
                'Protect your next focus block before context switches begin',
                'Resolve the one blocked task slowing your momentum',
              ].map((item) => (
                <button
                  key={item}
                  type="button"
                  className="flex w-full items-center justify-between rounded-[24px] border border-white/85 bg-[rgba(255,255,255,0.76)] px-4 py-4 text-left shadow-[0_10px_22px_rgba(15,23,42,0.04)] transition-all duration-200 ease-out hover:bg-white active:scale-[0.99]"
                >
                  <span className="text-[15px] font-medium tracking-[-0.02em] text-[#313843]">
                    {item}
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-[#a2a8b3]" strokeWidth={1.8} />
                </button>
              ))}
            </div>
          </section>

          <section className="mt-5 rounded-[32px] border border-white/80 bg-[rgba(255,255,255,0.74)] p-4 shadow-[0_18px_36px_rgba(15,23,42,0.045)] backdrop-blur-2xl">
            <div className="flex items-center gap-2 text-[#6b82a5]">
              <CircleAlert className="h-5 w-5" strokeWidth={1.9} />
              <h3 className="text-[15px] font-semibold tracking-[-0.02em] text-[#313843]">
                Operator note
              </h3>
            </div>

            <p className="mt-4 text-[24px] font-medium leading-[1.14] tracking-[-0.05em] text-[#2d3440]">
              You do not need more options right now.
            </p>

            <p className="mt-2 max-w-[380px] text-[14px] leading-6 text-[#7d8391]">
              The biggest win is not adding more — it is finishing the already
              identified next step cleanly.
            </p>

            <button
              type="button"
              onClick={() => router.push('/flow')}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/85 bg-white px-4 py-2.5 text-sm font-medium text-[#374151] shadow-[0_10px_22px_rgba(15,23,42,0.04)] transition-all duration-200 ease-out hover:bg-white active:scale-[0.985]"
            >
              Open Flow
              <ChevronRight className="h-4 w-4" strokeWidth={2} />
            </button>
          </section>
        </main>
      </div>
    </div>
  );
}
