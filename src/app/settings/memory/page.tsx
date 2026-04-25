'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Database,
  Download,
  Folder,
  Goal,
  Lightbulb,
  Lock,
  MoreHorizontal,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  User,
  Zap,
} from 'lucide-react';

import KivoChatHeader from '@/components/chat/kivo/KivoChatHeader';
import {
  KivoChatSidebarArea,
  KIVO_CHAT_SIDEBAR_RAIL_WIDTH,
} from '@/components/chat/kivo/KivoChatSidebarArea';

const SIDEBAR_GAP = 12;

type MemoryItem = {
  id: string;
  text: string;
  category?: string;
  createdAt?: string;
};

type MemoryCategory = {
  key: string;
  title: string;
  subtitle: string;
  icon: ReactNode;
};

const categories: MemoryCategory[] = [
  {
    key: 'goals',
    title: 'Goals',
    subtitle: 'Your goals and ambitions',
    icon: <Goal />,
  },
  {
    key: 'preferences',
    title: 'Preferences',
    subtitle: 'Your preferences and settings',
    icon: <SlidersHorizontal />,
  },
  {
    key: 'projects',
    title: 'Projects',
    subtitle: 'Your projects and work',
    icon: <Folder />,
  },
  {
    key: 'facts',
    title: 'Important facts',
    subtitle: 'Useful things Kivo should remember',
    icon: <Lightbulb />,
  },
  {
    key: 'ignored',
    title: 'Ignored suggestions',
    subtitle: 'Things you do not want to see',
    icon: <Bookmark />,
  },
];

export default function MemoryPage() {
  const router = useRouter();

  const [showSidebarRail, setShowSidebarRail] = useState(false);
  const [memoryEnabled, setMemoryEnabled] = useState(false);
  const [personalization, setPersonalization] = useState(false);
  const [autoSave, setAutoSave] = useState(false);
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [confirmClear, setConfirmClear] = useState(false);

  const contentLeftOffset = showSidebarRail
    ? KIVO_CHAT_SIDEBAR_RAIL_WIDTH + SIDEBAR_GAP
    : 0;

  useEffect(() => {
    try {
      setMemoryEnabled(localStorage.getItem('kivo.settings.memoryEnabled') === 'true');
      setPersonalization(localStorage.getItem('kivo.settings.personalization') === 'true');
      setAutoSave(localStorage.getItem('kivo.settings.autoSaveMemory') === 'true');

      const raw = localStorage.getItem('kivo.memories');
      const parsed = raw ? JSON.parse(raw) : [];

      if (Array.isArray(parsed)) {
        setMemories(parsed.map(normalizeMemory).filter(Boolean) as MemoryItem[]);
      }
    } catch {
      setMemories([]);
    }
  }, []);

  const memoryStatus = memoryEnabled ? 'Enabled' : 'Limited';

  const categoryCounts = useMemo(() => {
    return categories.reduce<Record<string, number>>((acc, category) => {
      acc[category.key] = memories.filter((memory) => memory.category === category.key).length;
      return acc;
    }, {});
  }, [memories]);

  function updateMemorySetting(key: 'memoryEnabled' | 'personalization' | 'autoSaveMemory', value: boolean) {
    localStorage.setItem(`kivo.settings.${key}`, String(value));

    if (key === 'memoryEnabled') setMemoryEnabled(value);
    if (key === 'personalization') setPersonalization(value);
    if (key === 'autoSaveMemory') setAutoSave(value);
  }

  function exportMemories() {
    const data = {
      settings: {
        memoryEnabled,
        personalization,
        autoSaveMemory: autoSave,
      },
      memories,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'kivo-memories-export.json';
    link.click();

    URL.revokeObjectURL(url);
  }

  function clearMemories() {
    localStorage.removeItem('kivo.memories');
    setMemories([]);
    setConfirmClear(false);
  }

  function deleteMemory(id: string) {
    const next = memories.filter((memory) => memory.id !== id);
    setMemories(next);
    localStorage.setItem('kivo.memories', JSON.stringify(next));
  }

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

        <section className="px-4 pb-28 pt-7 sm:px-5">
          <div className="mx-auto max-w-[980px]">
            <button
              onClick={() => router.push('/settings')}
              className="mb-6 inline-flex items-center gap-2 rounded-[14px] border border-black/[0.055] bg-white px-4 py-2.5 text-[13px] font-medium shadow-[0_8px_22px_rgba(15,23,42,0.025)]"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Settings
            </button>

            <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="font-serif text-[44px] leading-none tracking-[-0.06em]">
                  Memory
                </h1>
                <p className="mt-2 text-[16px] text-black/50">
                  Control what Kivo remembers about you.
                </p>
              </div>

              <div className="rounded-[20px] border border-black/[0.055] bg-white px-5 py-4 shadow-[0_10px_26px_rgba(15,23,42,0.025)]">
                <div className="flex items-center gap-2 text-[13px] font-medium">
                  <span
                    className={[
                      'h-2 w-2 rounded-full',
                      memoryEnabled ? 'bg-emerald-500' : 'bg-black/25',
                    ].join(' ')}
                  />
                  Memory status
                </div>
                <div className="mt-1 text-[18px] font-semibold tracking-[-0.04em]">
                  {memoryStatus}
                </div>
                <div className="mt-1 text-[12px] text-black/45">
                  {memoryEnabled ? 'Kivo can personalize responses.' : 'Turn on memory to personalize Kivo.'}
                </div>
              </div>
            </div>

            <Card>
              <SectionHeader
                title="Memory controls"
                subtitle="Manage how Kivo remembers and personalizes your experience."
              />

              <ToggleRow
                icon={<Database />}
                title="Enable memory"
                subtitle="Allow Kivo to remember useful information across chats."
                checked={memoryEnabled}
                onClick={() => updateMemorySetting('memoryEnabled', !memoryEnabled)}
              />
              <ToggleRow
                icon={<User />}
                title="Personalization"
                subtitle="Use memory to personalize responses for you."
                checked={personalization}
                onClick={() => updateMemorySetting('personalization', !personalization)}
              />
              <ToggleRow
                icon={<Bookmark />}
                title="Auto-save useful details"
                subtitle="Automatically save helpful information as you chat."
                checked={autoSave}
                onClick={() => updateMemorySetting('autoSaveMemory', !autoSave)}
                last
              />
            </Card>

            <Card>
              <SectionHeader
                title="Memory categories"
                subtitle="Choose what Kivo is allowed to remember."
              />

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => (
                  <button
                    key={category.key}
                    onClick={() => router.push(`/settings/memory?category=${category.key}`)}
                    className="flex items-center gap-3 rounded-[20px] border border-black/[0.055] bg-white px-4 py-4 text-left shadow-[0_8px_22px_rgba(15,23,42,0.018)]"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-black/[0.035] [&>svg]:h-5 [&>svg]:w-5">
                      {category.icon}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] font-semibold tracking-[-0.03em]">
                        {category.title}
                      </div>
                      <div className="mt-1 text-[12px] leading-[1.25] text-black/45">
                        {category.subtitle}
                      </div>
                      <div className="mt-2 text-[12px] text-black/45">
                        {categoryCounts[category.key] || 0} saved
                      </div>
                    </div>

                    <ChevronRight className="h-5 w-5 text-black/30" />
                  </button>
                ))}
              </div>
            </Card>

            <Card>
              <div className="mb-5 flex items-start justify-between gap-4">
                <SectionHeader
                  title="Recent memories"
                  subtitle="The latest things Kivo has remembered."
                  noMargin
                />

                <span className="rounded-full bg-black/[0.045] px-3 py-1.5 text-[12px] font-medium">
                  {memories.length}
                </span>
              </div>

              {memories.length > 0 ? (
                <div className="overflow-hidden rounded-[22px] border border-black/[0.055] bg-white">
                  {memories.map((memory, index) => (
                    <MemoryRow
                      key={memory.id}
                      memory={memory}
                      last={index === memories.length - 1}
                      onDelete={() => deleteMemory(memory.id)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyMemoryState
                  onStartChat={() => router.push('/chat')}
                  onOpenDataSources={() => router.push('/settings/data-sources')}
                />
              )}
            </Card>

            <Card>
              <SectionHeader
                title="Memory actions"
                subtitle="Manage and export your memory data."
              />

              <div className="grid gap-3 sm:grid-cols-3">
                <ActionButton
                  icon={<Download />}
                  label="Export memories"
                  onClick={exportMemories}
                />
                <ActionButton
                  danger
                  icon={<Trash2 />}
                  label="Clear memories"
                  onClick={() => setConfirmClear(true)}
                />
                <ActionButton
                  icon={<Folder />}
                  label="Open data sources"
                  onClick={() => router.push('/settings/data-sources')}
                />
              </div>
            </Card>

            <div className="mt-5 flex items-center gap-4 rounded-[28px] border border-black/[0.055] bg-white/90 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.04)]">
              <div className="flex h-13 w-13 items-center justify-center rounded-full border border-black/[0.055] bg-white">
                <ShieldCheck className="h-6 w-6" />
              </div>

              <div>
                <div className="text-[15px] font-semibold tracking-[-0.03em]">
                  Your data is private and secure.
                </div>
                <p className="mt-1 text-[13px] text-black/45">
                  Kivo only uses memory to personalize your experience.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {confirmClear ? (
        <ConfirmModal
          title="Clear memories?"
          desc="This removes all saved memories from this device. This cannot be undone."
          actionLabel="Clear memories"
          onCancel={() => setConfirmClear(false)}
          onConfirm={clearMemories}
        />
      ) : null}
    </main>
  );
}

function normalizeMemory(item: any): MemoryItem | null {
  if (!item) return null;

  const text = item.text || item.content || item.memory || item.summary || item.title;
  if (!text) return null;

  return {
    id: String(item.id || `${Date.now()}-${text}`),
    text: String(text),
    category: item.category ? String(item.category) : undefined,
    createdAt: item.createdAt || item.created_at || item.date || undefined,
  };
}

function formatMemoryDate(date?: string) {
  if (!date) return 'Saved memory';

  const parsed = new Date(date);
  if (Number.isNaN(Number(parsed))) return 'Saved memory';

  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function Card({ children }: { children: ReactNode }) {
  return (
    <div className="mb-5 rounded-[28px] border border-black/[0.055] bg-white/90 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.04)]">
      {children}
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  noMargin = false,
}: {
  title: string;
  subtitle: string;
  noMargin?: boolean;
}) {
  return (
    <div className={noMargin ? '' : 'mb-5'}>
      <h2 className="text-[18px] font-semibold tracking-[-0.035em]">{title}</h2>
      <p className="mt-1 text-[13px] text-black/45">{subtitle}</p>
    </div>
  );
}

function ToggleRow({
  icon,
  title,
  subtitle,
  checked,
  onClick,
  last = false,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  checked: boolean;
  onClick: () => void;
  last?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'flex w-full items-center gap-4 py-4 text-left',
        last ? '' : 'border-b border-black/[0.045]',
      ].join(' ')}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-black/[0.035] [&>svg]:h-5 [&>svg]:w-5">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-semibold tracking-[-0.03em]">{title}</div>
        <p className="mt-1 text-[13px] leading-[1.35] text-black/45">{subtitle}</p>
      </div>

      <span
        className={[
          'relative h-7 w-12 rounded-full transition',
          checked ? 'bg-[#111318]' : 'bg-black/10',
        ].join(' ')}
      >
        <span
          className={[
            'absolute top-1 h-5 w-5 rounded-full bg-white transition',
            checked ? 'left-6' : 'left-1',
          ].join(' ')}
        />
      </span>
    </button>
  );
}

function MemoryRow({
  memory,
  last,
  onDelete,
}: {
  memory: MemoryItem;
  last: boolean;
  onDelete: () => void;
}) {
  return (
    <div
      className={[
        'flex items-center gap-4 px-4 py-4',
        last ? '' : 'border-b border-black/[0.045]',
      ].join(' ')}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-black/[0.035]">
        <Bookmark className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-medium leading-[1.35]">{memory.text}</div>
        <div className="mt-1 text-[12px] text-black/42">
          {formatMemoryDate(memory.createdAt)}
        </div>
      </div>

      <button
        onClick={onDelete}
        className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/[0.04]"
        aria-label="Delete memory"
      >
        <MoreHorizontal className="h-5 w-5 text-black/45" />
      </button>
    </div>
  );
}

function EmptyMemoryState({
  onStartChat,
  onOpenDataSources,
}: {
  onStartChat: () => void;
  onOpenDataSources: () => void;
}) {
  return (
    <div className="rounded-[24px] border border-black/[0.055] bg-white px-5 py-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] bg-black/[0.035]">
        <Database className="h-6 w-6" />
      </div>

      <h3 className="mt-5 text-[20px] font-semibold tracking-[-0.04em]">
        No memories yet
      </h3>
      <p className="mx-auto mt-2 max-w-[360px] text-[14px] leading-[1.45] text-black/50">
        Memories will appear here when Kivo learns useful details from your chats and connected tools.
      </p>

      <div className="mx-auto mt-6 grid max-w-[360px] grid-cols-2 gap-3">
        <button
          onClick={onStartChat}
          className="rounded-[16px] bg-[#111318] px-4 py-3 text-[14px] font-medium text-white"
        >
          Start chat
        </button>
        <button
          onClick={onOpenDataSources}
          className="rounded-[16px] bg-black/[0.045] px-4 py-3 text-[14px] font-medium"
        >
          Data sources
        </button>
      </div>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  danger = false,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'inline-flex items-center justify-center gap-3 rounded-[17px] border border-black/[0.055] bg-white px-5 py-4 text-[14px] font-medium shadow-[0_8px_22px_rgba(15,23,42,0.018)]',
        danger ? 'text-red-500' : '',
      ].join(' ')}
    >
      <span className="[&>svg]:h-5 [&>svg]:w-5">{icon}</span>
      {label}
    </button>
  );
}

function ConfirmModal({
  title,
  desc,
  actionLabel,
  onCancel,
  onConfirm,
}: {
  title: string;
  desc: string;
  actionLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-end bg-black/25 p-4 backdrop-blur-sm sm:items-center sm:justify-center">
      <div className="w-full rounded-[28px] bg-white p-5 shadow-[0_24px_80px_rgba(0,0,0,0.18)] sm:max-w-[420px]">
        <div className="text-[20px] font-semibold tracking-[-0.04em]">{title}</div>
        <p className="mt-2 text-[14px] leading-[1.45] text-black/50">{desc}</p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            onClick={onCancel}
            className="rounded-[16px] bg-black/[0.045] px-4 py-3 text-[14px] font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-[16px] bg-[#111318] px-4 py-3 text-[14px] font-medium text-white"
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
