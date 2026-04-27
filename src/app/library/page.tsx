'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bot,
  Bookmark,
  CalendarDays,
  CheckSquare,
  ChevronRight,
  Library,
  MessageCirclePlus,
  Search,
  Sparkles,
  SunMedium,
  User,
} from 'lucide-react';

type Tab = 'Today' | 'Agents' | 'Work' | 'Time' | 'Saved';

const tabs: { id: Tab; icon: typeof SunMedium }[] = [
  { id: 'Today', icon: SunMedium },
  { id: 'Agents', icon: Bot },
  { id: 'Work', icon: CheckSquare },
  { id: 'Time', icon: CalendarDays },
  { id: 'Saved', icon: Bookmark },
];

export default function LibraryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('Today');

  return (
    <main className="min-h-[100dvh] overflow-x-hidden bg-[#F7F7F6] text-[#202226]">
      <div className="mx-auto min-h-[100dvh] w-full max-w-[430px] overflow-x-hidden pb-[124px]">
        <div
          className="sticky top-0 z-50 bg-[#F7F7F6]/94 px-[18px] pb-4 backdrop-blur-xl"
          style={{ paddingTop: 'env(safe-area-inset-top, 16px)' }}
        >
          <header className="grid h-[72px] grid-cols-[48px_1fr_96px] items-center">
            <button onClick={() => router.push('/settings')} className="flex h-11 w-11 items-center justify-center rounded-full text-[#17191D] active:scale-95">
              <User className="h-[26px] w-[26px]" strokeWidth={2.05} />
            </button>

            <h1 className="text-center font-serif text-[42px] font-bold leading-none tracking-[-0.06em] text-[#191B1F]">
              Kivo
            </h1>

            <div className="flex items-center justify-end gap-4">
              <button onClick={() => router.push('/history')} className="flex h-11 w-8 items-center justify-center text-[#17191D] active:scale-95">
                <Library className="h-[27px] w-[27px]" strokeWidth={2.05} />
              </button>
              <button onClick={() => router.push('/search')} className="flex h-11 w-9 items-center justify-center text-[#17191D] active:scale-95">
                <Search className="h-[30px] w-[30px]" strokeWidth={2.05} />
              </button>
            </div>
          </header>

          <section className="w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex w-max min-w-full gap-[10px] pb-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex shrink-0 items-center gap-2 rounded-full border px-[18px] py-[11px] text-[15px] font-semibold tracking-[-0.035em] active:scale-[0.97] ${
                      active
                        ? 'border-[#151515] bg-[#151515] text-white shadow-[0_10px_24px_rgba(0,0,0,0.16)]'
                        : 'border-black/[0.075] bg-white/42 text-[#5F6369] shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]'
                    }`}
                  >
                    <Icon className="h-[18px] w-[18px]" strokeWidth={2.1} />
                    {tab.id}
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <div className="px-[22px] pt-7">
          {activeTab === 'Today' ? <TodayView /> : <PlaceholderView tab={activeTab} />}
        </div>

        <button
          type="button"
          onClick={() => router.push('/chat')}
          className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+38px)] right-[26px] z-40 flex h-[68px] w-[68px] items-center justify-center rounded-full bg-[#171717] text-white shadow-[0_16px_34px_rgba(0,0,0,0.24)] active:scale-95"
        >
          <MessageCirclePlus className="h-[33px] w-[33px]" strokeWidth={2.25} />
        </button>
      </div>
    </main>
  );
}

function TodayView() {
  return (
    <>
      <section className="mb-8">
        <h2 className="text-[21px] font-semibold tracking-[-0.05em] text-[#101216]">
          Good morning, Miro
        </h2>
        <p className="mt-2 text-[17px] font-medium tracking-[-0.035em] text-[#777B82]">
          Here’s what’s important today.
        </p>
      </section>

      <section className="rounded-[24px] border border-black/[0.055] bg-white/58 p-5 shadow-[0_14px_36px_rgba(15,23,42,0.055),inset_0_1px_0_rgba(255,255,255,0.9)]">
        <h3 className="text-[20px] font-semibold tracking-[-0.045em]">Today’s focus</h3>
        <p className="mt-1 text-[15px] font-medium text-[#777B82]">3 tasks · 2 events</p>

        <div className="my-5 h-px bg-black/[0.055]" />

        <FocusRow kind="task" title="Viikkopalaveri tiimin kanssa" subtitle="11.00–12.00" badge="Now" />
        <FocusRow kind="calendar" title="Asiakasdemo" subtitle="14.00–15.00" badge="In 2h" />
        <FocusRow kind="task" title="Lähetä projektipäivitys" subtitle="Due today" badge="Today" />

        <button className="mt-4 flex w-full items-center justify-between border-t border-black/[0.055] pt-4 text-left text-[18px] font-medium tracking-[-0.04em]">
          See all tasks
          <ChevronRight className="h-6 w-6 text-[#777B82]" />
        </button>
      </section>

      <h3 className="mb-4 mt-8 text-[21px] font-semibold tracking-[-0.05em]">Suggested for you</h3>

      <button className="flex w-full items-center gap-4 rounded-[22px] border border-black/[0.055] bg-white/48 p-5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.86)]">
        <Sparkles className="h-7 w-7 shrink-0 text-[#3F444B]" strokeWidth={2.1} />
        <span className="flex-1 text-[17px] font-medium leading-snug tracking-[-0.035em]">
          Haluatko, että teen yhteenvedon eilisistä sähköposteista?
        </span>
        <ChevronRight className="h-6 w-6 text-[#777B82]" />
      </button>

      <h3 className="mb-4 mt-8 text-[21px] font-semibold tracking-[-0.05em]">Upcoming</h3>

      <section className="overflow-hidden rounded-[24px] border border-black/[0.055] bg-white/52 px-5 shadow-[0_12px_32px_rgba(15,23,42,0.045),inset_0_1px_0_rgba(255,255,255,0.9)]">
        <UpcomingRow title="Design review" time="Tomorrow 10.00" />
        <UpcomingRow title="Yoga" time="Tomorrow 18.30" last />
      </section>
    </>
  );
}

function FocusRow({ kind, title, subtitle, badge }: { kind: 'task' | 'calendar'; title: string; subtitle: string; badge: string }) {
  return (
    <div className="grid grid-cols-[44px_1fr_auto] items-center gap-3 py-3">
      <div className="flex h-9 w-9 items-center justify-center text-[#17191D]">
        {kind === 'task' ? (
          <span className="h-6 w-6 rounded-full border-2 border-[#30343A]" />
        ) : (
          <CalendarDays className="h-6 w-6" strokeWidth={2.1} />
        )}
      </div>
      <div>
        <p className="text-[17px] font-medium tracking-[-0.04em]">{title}</p>
        <p className="mt-1 text-[14px] font-medium text-[#777B82]">{subtitle}</p>
      </div>
      <span className="rounded-full bg-[#F0F0F0] px-3 py-2 text-[14px] font-medium text-[#6C7076]">
        {badge}
      </span>
    </div>
  );
}

function UpcomingRow({ title, time, last = false }: { title: string; time: string; last?: boolean }) {
  return (
    <button className={`grid w-full grid-cols-[42px_1fr_22px] items-center gap-3 py-4 text-left ${last ? '' : 'border-b border-black/[0.055]'}`}>
      <CalendarDays className="h-6 w-6 text-[#17191D]" strokeWidth={2.1} />
      <div>
        <p className="text-[17px] font-medium tracking-[-0.04em]">{title}</p>
        <p className="mt-1 text-[14px] font-medium text-[#777B82]">{time}</p>
      </div>
      <ChevronRight className="h-6 w-6 text-[#777B82]" />
    </button>
  );
}

function PlaceholderView({ tab }: { tab: Tab }) {
  return (
    <section className="flex min-h-[520px] flex-col items-center justify-center text-center">
      <div className="mb-5 flex h-[74px] w-[74px] items-center justify-center rounded-[24px] border border-dashed border-black/[0.16] bg-white/40 text-[#A7A7A7]">
        <Workflow className="h-8 w-8" strokeWidth={2.1} />
      </div>
      <h2 className="text-[24px] font-semibold tracking-[-0.055em]">{tab}</h2>
      <p className="mt-2 max-w-[280px] text-[16px] font-medium leading-[1.35] tracking-[-0.035em] text-[#858585]">
        This section will become a smart Kivo workspace.
      </p>
    </section>
  );
}
