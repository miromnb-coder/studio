'use client';

import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bot,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  Filter,
  MessageCircle,
  Search,
  Sparkles,
  Wrench,
} from 'lucide-react';

import KivoChatHeader from '@/components/chat/kivo/KivoChatHeader';
import {
  KivoChatSidebarArea,
  KIVO_CHAT_SIDEBAR_RAIL_WIDTH,
} from '@/components/chat/kivo/KivoChatSidebarArea';

const SIDEBAR_GAP = 12;

type HistoryType = 'Conversation' | 'Task' | 'Tool' | 'File' | 'Agent' | 'Memory';

type HistoryItem = {
  id: string;
  type: HistoryType;
  title: string;
  desc: string;
  time: string;
  date: string;
  href: string;
  impact?: string;
};

const tabs = ['All', 'Conversations', 'Tasks', 'Tools', 'Files', 'Agents'] as const;

const iconMap: Record<HistoryType, ComponentType<{ className?: string }>> = {
  Conversation: MessageCircle,
  Task: CheckCircle2,
  Tool: Wrench,
  File: FileText,
  Agent: Bot,
  Memory: Sparkles,
};

export default function HistoryPage() {
  const router = useRouter();
  const [showSidebarRail, setShowSidebarRail] = useState(false);
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('All');
  const [showFilters, setShowFilters] = useState(false);
  const [visibleCount, setVisibleCount] = useState(8);

  const contentLeftOffset = showSidebarRail
    ? KIVO_CHAT_SIDEBAR_RAIL_WIDTH + SIDEBAR_GAP
    : 0;

  useEffect(() => {
    const loaded = loadUserHistory();
    setItems(loaded);
  }, []);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return items.filter((item) => {
      const matchesQuery =
        !normalizedQuery ||
        item.title.toLowerCase().includes(normalizedQuery) ||
        item.desc.toLowerCase().includes(normalizedQuery) ||
        item.type.toLowerCase().includes(normalizedQuery);

      const matchesTab =
        activeTab === 'All' ||
        (activeTab === 'Conversations' && item.type === 'Conversation') ||
        (activeTab === 'Tasks' && item.type === 'Task') ||
        (activeTab === 'Tools' && item.type === 'Tool') ||
        (activeTab === 'Files' && item.type === 'File') ||
        (activeTab === 'Agents' && item.type === 'Agent');

      return matchesQuery && matchesTab;
    });
  }, [items, query, activeTab]);

  const visibleItems = filteredItems.slice(0, visibleCount);
  const groupedItems = groupHistoryItems(visibleItems);

  const stats = [
    {
      label: 'Conversations',
      value: String(items.filter((item) => item.type === 'Conversation').length),
      sub: 'Total',
      icon: MessageCircle,
    },
    {
      label: 'Tasks',
      value: String(items.filter((item) => item.type === 'Task').length),
      sub: 'Completed',
      icon: CheckCircle2,
    },
    {
      label: 'Tools used',
      value: String(items.filter((item) => item.type === 'Tool' || item.type === 'File').length),
      sub: 'Total',
      icon: Wrench,
    },
    {
      label: 'Time saved',
      value: estimateTimeSaved(items),
      sub: 'Estimated',
      icon: Clock3,
    },
  ];

  const continueItems = items.slice(0, 4);
  const hasHistory = items.length > 0;

  return (
    <main className="relative min-h-[100dvh] overflow-x-hidden bg-[#F8F8F7] text-[#111318]">
      {showSidebarRail ? (
        <KivoChatSidebarArea
          hasMessages={false}
          userName="Miro"
          plan="free"
          recentChats={[]}
          onNewChat={() => router.push('/chat')}
          onSearch={() => router.push('/search')}
          onOpenAgents={() => router.push('/agents')}
          onOpenTools={() => router.push('/tools')}
          onOpenAlerts={() => router.push('/alerts')}
          onOpenSettings={() => router.push('/settings')}
          onQuickTask={() => router.push('/chat')}
          onAnalyzeFile={() => router.push('/analyze')}
          onPlanMyDay={() => router.push('/actions?type=planner')}
          onOpenGmail={() => router.push('/actions?tool=gmail')}
          onOpenCalendar={() => router.push('/actions?tool=google-calendar')}
          onOpenDrive={() => router.push('/tools?source=drive')}
          onOpenWeb={() => router.push('/tools?tool=browser-search')}
          onUpgrade={() => router.push('/upgrade')}
        />
      ) : null}

      <div
        className="min-h-[100dvh] transition-[padding-left] duration-300 ease-out"
        style={{ paddingLeft: contentLeftOffset }}
      >
        <div className="sticky top-0 z-40 border-b border-black/[0.035] bg-white/82 backdrop-blur-2xl">
          <KivoChatHeader
            hasMessages={false}
            isSidebarOpen={showSidebarRail}
            onSidebarToggle={() => setShowSidebarRail((open) => !open)}
          />
        </div>

        <section className="px-4 pb-24 pt-7 sm:px-5">
          <div className="mx-auto max-w-[720px]">
            <h1 className="font-serif text-[44px] leading-none tracking-[-0.06em]">
              History
            </h1>
            <p className="mt-2 text-[16px] text-black/50">
              Your personal Kivo activity timeline.
            </p>

            <div className="mt-6 rounded-[28px] border border-black/[0.055] bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.035)]">
              <div className="flex items-center gap-2 text-[13px] font-medium text-black/55">
                <Sparkles className="h-4 w-4" />
                Personal summary
              </div>
              <p className="mt-3 text-[20px] font-semibold leading-[1.2] tracking-[-0.04em]">
                {hasHistory
                  ? `Kivo has recorded ${items.length} real activity items for you.`
                  : 'No real activity yet. Start using Kivo to build your timeline.'}
              </p>
            </div>

            <div className="mb-5 mt-6 flex items-center gap-3 rounded-[22px] border border-black/[0.055] bg-white px-5 py-4 shadow-[0_10px_26px_rgba(15,23,42,0.028)]">
              <Search className="h-5 w-5 text-black/45" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full bg-transparent text-[16px] outline-none placeholder:text-black/40"
                placeholder="Search history..."
              />
            </div>

            <div className="mb-6 flex flex-wrap items-center gap-3">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={[
                    'rounded-full px-5 py-3 text-[14px] font-medium',
                    activeTab === tab ? 'bg-[#111318] text-white' : 'bg-white text-[#111318]',
                  ].join(' ')}
                >
                  {tab}
                </button>
              ))}

              <button
                onClick={() => setShowFilters((open) => !open)}
                className="ml-auto inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-[14px] font-medium text-[#111318]"
              >
                <Filter className="h-4 w-4" />
                Filters
              </button>
            </div>

            {showFilters ? (
              <div className="mb-6 rounded-[24px] border border-black/[0.055] bg-white p-4 shadow-[0_10px_26px_rgba(15,23,42,0.028)]">
                <div className="text-[15px] font-semibold tracking-[-0.03em]">
                  Filters
                </div>
                <p className="mt-1 text-[13px] text-black/50">
                  Use the category chips and search field to filter your real history.
                </p>
              </div>
            ) : null}

            <div className="mb-8 grid grid-cols-2 gap-3">
              {stats.map((item) => (
                <StatCard key={item.label} {...item} />
              ))}
            </div>

            {!hasHistory ? (
              <EmptyState
                onStartChat={() => router.push('/chat')}
                onOpenTools={() => router.push('/tools')}
              />
            ) : null}

            {hasHistory && groupedItems.length === 0 ? (
              <div className="rounded-[26px] border border-black/[0.055] bg-white p-6 text-center shadow-[0_10px_26px_rgba(15,23,42,0.028)]">
                <div className="text-[17px] font-semibold">No matching history</div>
                <p className="mt-2 text-[14px] text-black/50">
                  Try another search or switch back to All.
                </p>
              </div>
            ) : null}

            {groupedItems.map((group) => (
              <TimelineGroup key={group.group} title={group.group}>
                {group.items.map((item) => (
                  <TimelineRow
                    key={item.id}
                    {...item}
                    onOpen={() => router.push(item.href)}
                  />
                ))}
              </TimelineGroup>
            ))}

            {filteredItems.length > visibleCount ? (
              <div className="mx-auto mb-10 mt-2 flex justify-center">
                <button
                  onClick={() => setVisibleCount((count) => count + 8)}
                  className="rounded-[16px] bg-black/[0.04] px-10 py-4 text-[14px] font-medium"
                >
                  Load more
                </button>
              </div>
            ) : null}

            {continueItems.length > 0 ? (
              <div className="rounded-[28px] bg-black/[0.025] p-5">
                <h2 className="mb-5 text-[22px] font-semibold tracking-[-0.04em]">
                  Continue where you left off
                </h2>

                <div className="grid grid-cols-2 gap-3">
                  {continueItems.map((item) => (
                    <JumpCard
                      key={item.id}
                      {...item}
                      onOpen={() => router.push(item.href)}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

function loadUserHistory(): HistoryItem[] {
  if (typeof window === 'undefined') return [];

  const keys = [
    'kivo.history',
    'kivo:history',
    'history',
    'kivo_activity',
    'kivo.activity',
  ];

  for (const key of keys) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;

      const parsed = JSON.parse(raw);
      const list = Array.isArray(parsed) ? parsed : parsed?.items;

      if (!Array.isArray(list)) continue;

      return list
        .map(normalizeHistoryItem)
        .filter(Boolean)
        .sort((a, b) => Number(new Date(b.date)) - Number(new Date(a.date))) as HistoryItem[];
    } catch {
      continue;
    }
  }

  return [];
}

function normalizeHistoryItem(item: any): HistoryItem | null {
  if (!item) return null;

  const date = item.date || item.createdAt || item.created_at || item.updatedAt || item.updated_at;
  const title = item.title || item.name || item.summary || item.prompt || 'Untitled activity';

  if (!date || !title) return null;

  const type = normalizeType(item.type || item.kind || item.category);

  return {
    id: String(item.id || `${type}-${date}-${title}`),
    type,
    title: String(title),
    desc: String(item.desc || item.description || item.subtitle || item.agent || 'Kivo activity'),
    time: formatTime(date),
    date: String(date),
    href: String(item.href || item.url || getDefaultHref(type, item.id)),
    impact: item.impact ? String(item.impact) : undefined,
  };
}

function normalizeType(value: unknown): HistoryType {
  const type = String(value || '').toLowerCase();

  if (type.includes('task')) return 'Task';
  if (type.includes('tool')) return 'Tool';
  if (type.includes('file')) return 'File';
  if (type.includes('agent')) return 'Agent';
  if (type.includes('memory')) return 'Memory';

  return 'Conversation';
}

function getDefaultHref(type: HistoryType, id?: string) {
  const safeId = id ? String(id) : '';

  if (type === 'Conversation') return safeId ? `/chat?id=${safeId}` : '/chat';
  if (type === 'File') return safeId ? `/analyze?id=${safeId}` : '/analyze';
  if (type === 'Agent') return '/agents';
  if (type === 'Tool') return '/tools';

  return '/chat';
}

function groupHistoryItems(items: HistoryItem[]) {
  const groups = new Map<string, HistoryItem[]>();

  for (const item of items) {
    const label = getDateGroup(item.date);
    groups.set(label, [...(groups.get(label) || []), item]);
  }

  return Array.from(groups.entries()).map(([group, groupItems]) => ({
    group,
    items: groupItems,
  }));
}

function getDateGroup(date: string) {
  const itemDate = new Date(date);
  const today = new Date();

  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfItem = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
  const diffDays = Math.round((Number(startOfToday) - Number(startOfItem)) / 86400000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';

  return itemDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function estimateTimeSaved(items: HistoryItem[]) {
  const usefulItems = items.filter((item) => item.type !== 'Conversation').length;
  const minutes = usefulItems * 8;

  if (minutes < 60) return `${minutes}m`;

  return `${Math.round(minutes / 60)}h`;
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-[22px] border border-black/[0.055] bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.025)]">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-[15px] bg-black/[0.035]">
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-[13px] text-black/45">{label}</div>
      <div className="mt-1 font-serif text-[32px] leading-none tracking-[-0.06em]">
        {value}
      </div>
      <div className="mt-2 text-[12px] text-black/45">{sub}</div>
    </div>
  );
}

function TimelineGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-4 text-[20px] font-semibold tracking-[-0.04em]">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function TimelineRow({
  time,
  title,
  desc,
  type,
  impact,
  onOpen,
}: HistoryItem & {
  onOpen: () => void;
}) {
  const Icon = iconMap[type];

  return (
    <button onClick={onOpen} className="grid w-full grid-cols-[68px_1fr] gap-3 text-left">
      <div className="relative pt-5 text-right text-[12px] text-black/42">
        {time}
        <span className="absolute right-[-11px] top-[25px] h-2 w-2 rounded-full bg-black/[0.12]" />
      </div>

      <div className="grid grid-cols-[46px_1fr_auto] items-center gap-3 rounded-[20px] border border-black/[0.045] bg-white px-4 py-4 shadow-[0_8px_22px_rgba(15,23,42,0.02)]">
        <div className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-black/[0.035]">
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <div className="text-[15px] font-semibold tracking-[-0.03em]">{title}</div>
          <p className="mt-1 text-[13px] leading-[1.35] text-black/45">{desc}</p>
          {impact ? (
            <p className="mt-1 text-[12px] font-medium text-black/55">{impact}</p>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden rounded-[10px] bg-black/[0.04] px-3 py-1.5 text-[12px] font-medium text-black/55 sm:inline-flex">
            {type}
          </span>
          <ChevronRight className="h-5 w-5 text-black/25" />
        </div>
      </div>
    </button>
  );
}

function JumpCard({
  title,
  date,
  type,
  onOpen,
}: HistoryItem & {
  onOpen: () => void;
}) {
  const Icon = iconMap[type];

  return (
    <button
      onClick={onOpen}
      className="rounded-[20px] border border-black/[0.045] bg-white p-4 text-left shadow-[0_8px_22px_rgba(15,23,42,0.02)]"
    >
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[14px] bg-black/[0.035]">
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-h-[40px] text-[14px] font-semibold leading-[1.25] tracking-[-0.03em]">
        {title}
      </div>
      <p className="mt-4 text-[12px] text-black/40">{getDateGroup(date)} • {formatTime(date)}</p>
      <p className="mt-2 text-[12px] font-medium text-black/50">{type}</p>
    </button>
  );
}

function EmptyState({
  onStartChat,
  onOpenTools,
}: {
  onStartChat: () => void;
  onOpenTools: () => void;
}) {
  return (
    <div className="rounded-[30px] border border-black/[0.055] bg-white p-7 text-center shadow-[0_14px_34px_rgba(15,23,42,0.035)]">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] bg-black/[0.035]">
        <Clock3 className="h-6 w-6" />
      </div>

      <h2 className="mt-5 text-[24px] font-semibold tracking-[-0.05em]">
        No history yet
      </h2>
      <p className="mx-auto mt-2 max-w-[360px] text-[14px] leading-[1.45] text-black/50">
        Start a chat, run an agent, or connect tools to build your personal Kivo activity timeline.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          onClick={onStartChat}
          className="rounded-[16px] bg-[#111318] px-4 py-3 text-[14px] font-medium text-white"
        >
          Start chat
        </button>
        <button
          onClick={onOpenTools}
          className="rounded-[16px] bg-black/[0.045] px-4 py-3 text-[14px] font-medium"
        >
          Connect tools
        </button>
      </div>
    </div>
  );
}
