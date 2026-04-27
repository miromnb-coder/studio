'use client';

import {
  BotMessageSquare,
  CalendarDays,
  ChevronRight,
  Library,
  Mail,
  MessageCirclePlus,
  Search,
  Sparkles,
  User,
  Workflow,
} from 'lucide-react';

const filters = ['All', 'Agent', 'Manual', 'Scheduled', 'Favorites'];

const items = [
  {
    icon: BotMessageSquare,
    title: 'Kuinka rakentaa älykäs ja nopea...',
    preview: 'Hei! Olen nyt suorittanut kattavan analyys...',
    date: 'Sun',
  },
  {
    icon: CalendarDays,
    title: 'Tarkista kalenterini',
    preview: 'Tarkistin Google-kalenterisi, mutta sieltä...',
    date: 'Tue',
  },
  {
    icon: Mail,
    title: 'Tarkista sähköposti',
    preview: 'Olen tarkistanut sähköpostisi. Tässä on y...',
    date: 'Tue',
  },
  {
    icon: Sparkles,
    title: 'Mitä voin tehdä?',
    preview: 'Olen Manus, autonominen tekoälyagentti....',
    date: '4/19',
  },
  {
    icon: BotMessageSquare,
    title: 'Miten parantaa AI-agentin vasta...',
    preview: 'Selvä juttu! Autan sinua mielelläni kehittä...',
    date: '4/12',
  },
  {
    icon: MessageCirclePlus,
    title: 'Mitä kuuluu',
    preview: 'Olen nyt analysoinut `miromnb-coder/stu...',
    date: '4/12',
  },
];

export default function LibraryPage() {
  return (
    <main className="min-h-screen bg-[#F7F7F6] text-[#22252A]">
      <div
        className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col px-[18px] pb-8"
        style={{ paddingTop: 'env(safe-area-inset-top, 18px)' }}
      >
        <header className="grid h-[74px] grid-cols-[48px_1fr_96px] items-center">
          <button
            type="button"
            aria-label="Profile"
            className="flex h-11 w-11 items-center justify-center rounded-full text-[#17191D] active:scale-95"
          >
            <User className="h-[26px] w-[26px]" strokeWidth={2.05} />
          </button>

          <h1 className="text-center font-serif text-[40px] font-bold leading-none tracking-[-0.055em] text-[#191B1F]">
            Kivo
          </h1>

          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              aria-label="Library"
              className="flex h-11 w-8 items-center justify-center text-[#17191D] active:scale-95"
            >
              <Library className="h-[27px] w-[27px]" strokeWidth={2.05} />
            </button>
            <button
              type="button"
              aria-label="Search"
              className="flex h-11 w-9 items-center justify-center text-[#17191D] active:scale-95"
            >
              <Search className="h-[30px] w-[30px]" strokeWidth={2.05} />
            </button>
          </div>
        </header>

        <section className="-mx-[2px] mt-1 flex gap-[9px] overflow-x-auto pb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {filters.map((filter, index) => (
            <button
              key={filter}
              type="button"
              className={`shrink-0 rounded-full border px-[22px] py-[12px] text-[16px] font-semibold tracking-[-0.035em] active:scale-[0.98] ${
                index === 0
                  ? 'border-[#151515] bg-[#151515] text-white shadow-[0_8px_18px_rgba(0,0,0,0.12)]'
                  : 'border-black/[0.075] bg-white/45 text-[#777B82] shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]'
              }`}
            >
              {filter}
            </button>
          ))}
        </section>

        <section className="rounded-[24px] border border-black/[0.045] bg-white/45 p-[14px] shadow-[0_12px_32px_rgba(15,23,42,0.045),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-xl">
          <div className="grid grid-cols-[58px_1fr_22px] items-center gap-4">
            <div className="flex h-[58px] w-[58px] items-center justify-center rounded-[16px] bg-[#ECEDED] text-[#17191D]">
              <Workflow className="h-[29px] w-[29px]" strokeWidth={2.05} />
            </div>
            <div className="min-w-0">
              <h2 className="text-[20px] font-semibold leading-tight tracking-[-0.045em] text-[#202226]">
                Agent
              </h2>
              <p className="mt-1 truncate text-[16px] font-medium tracking-[-0.03em] text-[#777B82]">
                Claim your personalized agent
              </p>
            </div>
            <ChevronRight className="h-[22px] w-[22px] text-[#777B82]" strokeWidth={2.2} />
          </div>
        </section>

        <section className="mt-6 space-y-[2px]">
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.title}
                type="button"
                className="grid w-full grid-cols-[62px_1fr_46px] items-center gap-3 py-[12px] text-left active:scale-[0.995]"
              >
                <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#ECEDED] text-[#17191D]">
                  <Icon className="h-[27px] w-[27px]" strokeWidth={2.05} />
                </div>

                <div className="min-w-0 border-b border-black/[0.055] pb-[13px]">
                  <h3 className="truncate text-[18px] font-semibold leading-tight tracking-[-0.045em] text-[#202226]">
                    {item.title}
                  </h3>
                  <p className="mt-[6px] truncate text-[16px] font-medium tracking-[-0.035em] text-[#828282]">
                    {item.preview}
                  </p>
                </div>

                <div className="self-start pt-[4px] text-right text-[15px] font-medium text-[#8A8A8A]">
                  {item.date}
                </div>
              </button>
            );
          })}
        </section>

        <button
          type="button"
          aria-label="New chat"
          className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+50px)] right-[28px] flex h-[68px] w-[68px] items-center justify-center rounded-full bg-[#171717] text-white shadow-[0_14px_30px_rgba(0,0,0,0.22)] active:scale-95"
        >
          <MessageCirclePlus className="h-[33px] w-[33px]" strokeWidth={2.25} />
        </button>
      </div>
    </main>
  );
}
