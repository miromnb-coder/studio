'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BotMessageSquare,
  CalendarDays,
  ChevronRight,
  Library,
  Mail,
  MessageCirclePlus,
  Search,
  Sparkles,
  Star,
  Trash2,
  User,
  Workflow,
} from 'lucide-react';

type Filter = 'All' | 'Agent' | 'Manual' | 'Scheduled' | 'Favorites';

type LibraryItem = {
  id: string;
  type: Exclude<Filter, 'All' | 'Favorites'>;
  icon: typeof BotMessageSquare;
  title: string;
  preview: string;
  date: string;
  favorite?: boolean;
};

const filters: Filter[] = ['All', 'Agent', 'Manual', 'Scheduled', 'Favorites'];

const initialItems: LibraryItem[] = [
  {
    id: 'agent-build',
    type: 'Agent',
    icon: BotMessageSquare,
    title: 'Kuinka rakentaa älykäs ja nopea...',
    preview: 'Hei! Olen nyt suorittanut kattavan analyys...',
    date: 'Sun',
    favorite: true,
  },
  {
    id: 'calendar-check',
    type: 'Scheduled',
    icon: CalendarDays,
    title: 'Tarkista kalenterini',
    preview: 'Tarkistin Google-kalenterisi, mutta sieltä...',
    date: 'Tue',
  },
  {
    id: 'email-check',
    type: 'Agent',
    icon: Mail,
    title: 'Tarkista sähköposti',
    preview: 'Olen tarkistanut sähköpostisi. Tässä on y...',
    date: 'Tue',
  },
  {
    id: 'what-can-do',
    type: 'Manual',
    icon: Sparkles,
    title: 'Mitä voin tehdä?',
    preview: 'Olen Kivo, autonominen tekoälyagentti....',
    date: '4/19',
  },
  {
    id: 'improve-agent',
    type: 'Agent',
    icon: BotMessageSquare,
    title: 'Miten parantaa AI-agentin vasta...',
    preview: 'Selvä juttu! Autan sinua mielelläni kehittä...',
    date: '4/12',
  },
  {
    id: 'hello',
    type: 'Manual',
    icon: MessageCirclePlus,
    title: 'Mitä kuuluu',
    preview: 'Olen nyt analysoinut `miromnb-coder/stu...',
    date: '4/12',
  },
];

export default function LibraryPage() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<Filter>('All');
  const [items, setItems] = useState<LibraryItem[]>(initialItems);
  const [openSwipeId, setOpenSwipeId] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    if (activeFilter === 'All') return items;
    if (activeFilter === 'Favorites') return items.filter((item) => item.favorite);
    return items.filter((item) => item.type === activeFilter);
  }, [activeFilter, items]);

  const hasItems = filteredItems.length > 0;

  const toggleFavorite = (id: string) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, favorite: !item.favorite } : item,
      ),
    );
    setOpenSwipeId(null);
  };

  const deleteItem = (id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
    setOpenSwipeId(null);
  };

  return (
    <main className="min-h-[100dvh] w-full overflow-x-hidden bg-[#F7F7F6] text-[#202226]">
      <div className="mx-auto min-h-[100dvh] w-full max-w-[430px] overflow-x-hidden pb-[128px]">
        <div
          className="sticky top-0 z-50 bg-[#F7F7F6]/94 px-[18px] pb-[16px] backdrop-blur-xl"
          style={{ paddingTop: 'env(safe-area-inset-top, 16px)' }}
        >
          <header className="grid h-[72px] grid-cols-[48px_1fr_96px] items-center">
            <button
              type="button"
              aria-label="Profile"
              onClick={() => router.push('/settings')}
              className="flex h-11 w-11 items-center justify-center rounded-full text-[#17191D] transition-transform active:scale-95"
            >
              <User className="h-[26px] w-[26px]" strokeWidth={2.05} />
            </button>

            <h1 className="text-center font-serif text-[42px] font-bold leading-none tracking-[-0.06em] text-[#191B1F]">
              Kivo
            </h1>

            <div className="flex items-center justify-end gap-4">
              <button
                type="button"
                aria-label="Library"
                className="flex h-11 w-8 items-center justify-center text-[#17191D] transition-transform active:scale-95"
              >
                <Library className="h-[27px] w-[27px]" strokeWidth={2.05} />
              </button>

              <button
                type="button"
                aria-label="Search"
                onClick={() => router.push('/search')}
                className="flex h-11 w-9 items-center justify-center text-[#17191D] transition-transform active:scale-95"
              >
                <Search className="h-[30px] w-[30px]" strokeWidth={2.05} />
              </button>
            </div>
          </header>

          <section className="w-full overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex w-max min-w-full gap-[10px] pb-1">
              {filters.map((filter) => {
                const active = activeFilter === filter;

                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => {
                      setActiveFilter(filter);
                      setOpenSwipeId(null);
                    }}
                    className={`shrink-0 rounded-full border px-[25px] py-[13px] text-[17px] font-semibold tracking-[-0.04em] transition-transform active:scale-[0.97] ${
                      active
                        ? 'border-[#151515] bg-[#151515] text-white shadow-[0_10px_24px_rgba(0,0,0,0.16)]'
                        : 'border-black/[0.075] bg-white/42 text-[#777B82] shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]'
                    }`}
                  >
                    {filter}
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <div className="px-[18px] pt-[28px]">
          <AgentCard onClick={() => router.push('/agents')} />

          {hasItems ? (
            <section className="mt-6 overflow-hidden">
              {filteredItems.map((item) => (
                <LibraryRow
                  key={item.id}
                  item={item}
                  open={openSwipeId === item.id}
                  onOpen={() => setOpenSwipeId(item.id)}
                  onClose={() => setOpenSwipeId(null)}
                  onClick={() => router.push(`/chat?conversation=${item.id}`)}
                  onFavorite={() => toggleFavorite(item.id)}
                  onDelete={() => deleteItem(item.id)}
                />
              ))}
            </section>
          ) : (
            <EmptyLibraryState
              filter={activeFilter}
              onNewChat={() => router.push('/chat')}
              onPlanDay={() => router.push('/chat?prompt=Plan%20my%20day')}
              onConnectGmail={() => router.push('/settings/data-sources')}
            />
          )}
        </div>

        <button
          type="button"
          aria-label="New chat"
          onClick={() => router.push('/chat')}
          className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+38px)] right-[26px] z-40 flex h-[68px] w-[68px] items-center justify-center rounded-full bg-[#171717] text-white shadow-[0_16px_34px_rgba(0,0,0,0.24)] transition-transform active:scale-95"
        >
          <MessageCirclePlus className="h-[33px] w-[33px]" strokeWidth={2.25} />
        </button>
      </div>
    </main>
  );
}

function AgentCard({ onClick }: { onClick: () => void }) {
  return (
    <section
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter') onClick();
      }}
      className="w-full rounded-[24px] border border-black/[0.045] bg-white/52 p-[14px] shadow-[0_14px_36px_rgba(15,23,42,0.055),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl transition-transform active:scale-[0.992]"
    >
      <div className="grid grid-cols-[60px_1fr_24px] items-center gap-4">
        <div className="flex h-[60px] w-[60px] items-center justify-center rounded-[17px] bg-[#ECEDED] text-[#17191D]">
          <Workflow className="h-[30px] w-[30px]" strokeWidth={2.08} />
        </div>

        <div className="min-w-0">
          <h2 className="text-[21px] font-semibold leading-tight tracking-[-0.05em] text-[#202226]">
            Agent
          </h2>
          <p className="mt-1 truncate text-[17px] font-medium tracking-[-0.035em] text-[#777B82]">
            Claim your personalized agent
          </p>
        </div>

        <ChevronRight className="h-[24px] w-[24px] text-[#777B82]" strokeWidth={2.25} />
      </div>
    </section>
  );
}

function LibraryRow({
  item,
  open,
  onOpen,
  onClose,
  onClick,
  onFavorite,
  onDelete,
}: {
  item: LibraryItem;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onClick: () => void;
  onFavorite: () => void;
  onDelete: () => void;
}) {
  const Icon = item.icon;
  const startXRef = useRef<number | null>(null);
  const draggingRef = useRef(false);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    startXRef.current = event.clientX;
    draggingRef.current = false;
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (startXRef.current === null) return;
    const deltaX = event.clientX - startXRef.current;

    if (Math.abs(deltaX) > 12) draggingRef.current = true;
    if (deltaX < -36) onOpen();
    if (deltaX > 28) onClose();
  };

  const handlePointerUp = () => {
    startXRef.current = null;
  };

  return (
    <div className="relative -mx-[18px] overflow-hidden px-[18px]">
      <div className="absolute inset-y-0 right-[18px] flex w-[152px] items-center justify-end">
        <button
          type="button"
          onClick={onFavorite}
          className="flex h-[74px] w-[76px] flex-col items-center justify-center bg-[#148BEA] text-white"
        >
          <Star className="mb-1 h-7 w-7" strokeWidth={2.1} />
          <span className="text-[14px] font-semibold tracking-[-0.03em]">
            {item.favorite ? 'Saved' : 'Favorite'}
          </span>
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="flex h-[74px] w-[76px] flex-col items-center justify-center bg-[#FF3B30] text-white"
        >
          <Trash2 className="mb-1 h-7 w-7" strokeWidth={2.1} />
          <span className="text-[14px] font-semibold tracking-[-0.03em]">
            Delete
          </span>
        </button>
      </div>

      <div
        role="button"
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={() => {
          if (draggingRef.current) {
            draggingRef.current = false;
            return;
          }

          if (open) {
            onClose();
            return;
          }

          onClick();
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') onClick();
        }}
        className="relative z-10 grid w-full grid-cols-[62px_1fr_46px] items-center gap-3 bg-[#F7F7F6] py-[13px] text-left transition-transform duration-200 ease-out active:scale-[0.992]"
        style={{ transform: open ? 'translateX(-152px)' : 'translateX(0)' }}
      >
        <div className="flex h-[54px] w-[54px] items-center justify-center rounded-full bg-[#ECEDED] text-[#17191D]">
          <Icon className="h-[27px] w-[27px]" strokeWidth={2.08} />
        </div>

        <div className="min-w-0 border-b border-black/[0.055] pb-[14px]">
          <h3 className="truncate text-[19px] font-semibold leading-tight tracking-[-0.052em] text-[#202226]">
            {item.title}
          </h3>
          <p className="mt-[7px] truncate text-[16.5px] font-medium leading-tight tracking-[-0.038em] text-[#818181]">
            {item.preview}
          </p>
        </div>

        <div className="self-start pt-[5px] text-right text-[15px] font-medium tracking-[-0.025em] text-[#8A8A8A]">
          {item.date}
        </div>
      </div>
    </div>
  );
}

function EmptyLibraryState({
  filter,
  onNewChat,
  onPlanDay,
  onConnectGmail,
}: {
  filter: Filter;
  onNewChat: () => void;
  onPlanDay: () => void;
  onConnectGmail: () => void;
}) {
  const isAll = filter === 'All';

  return (
    <section className="flex min-h-[430px] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-[74px] w-[74px] items-center justify-center rounded-[24px] border border-dashed border-black/[0.18] bg-white/35 text-[#A7A7A7]">
        <Workflow className="h-[34px] w-[34px]" strokeWidth={2.15} />
      </div>

      <h2 className="text-[24px] font-semibold tracking-[-0.055em] text-[#2B2D31]">
        {isAll ? 'No conversations yet' : `No ${filter.toLowerCase()} tasks`}
      </h2>

      <p className="mt-2 max-w-[280px] text-[16px] font-medium leading-[1.35] tracking-[-0.035em] text-[#858585]">
        {isAll
          ? 'Start with Kivo, plan your day, or connect your tools.'
          : 'This section will fill up when Kivo starts helping you here.'}
      </p>

      <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
        <button
          type="button"
          onClick={onNewChat}
          className="rounded-full bg-[#171717] px-5 py-3 text-[15px] font-semibold tracking-[-0.035em] text-white shadow-[0_10px_24px_rgba(0,0,0,0.14)] transition-transform active:scale-[0.97]"
        >
          New chat
        </button>

        <button
          type="button"
          onClick={onPlanDay}
          className="rounded-full border border-black/[0.075] bg-white/55 px-5 py-3 text-[15px] font-semibold tracking-[-0.035em] text-[#575B62] transition-transform active:scale-[0.97]"
        >
          Plan my day
        </button>

        <button
          type="button"
          onClick={onConnectGmail}
          className="rounded-full border border-black/[0.075] bg-white/55 px-5 py-3 text-[15px] font-semibold tracking-[-0.035em] text-[#575B62] transition-transform active:scale-[0.97]"
        >
          Connect Gmail
        </button>
      </div>
    </section>
  );
}
