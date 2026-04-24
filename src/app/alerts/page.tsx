'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';

import KivoChatHeader from '@/components/chat/kivo/KivoChatHeader';
import {
  KivoChatSidebarArea,
  KIVO_CHAT_SIDEBAR_RAIL_WIDTH,
} from '@/components/chat/kivo/KivoChatSidebarArea';
import {
  KivoWhatsNewCard,
  KivoWhatsNewModal,
} from '@/components/chat/kivo/KivoWhatsNewCard';

const SIDEBAR_GAP = 12;

type AlertTab = 'All' | 'Updates' | 'Messages';

type RealNotification = {
  id: string;
  type: 'update' | 'message';
  title: string;
  description: string;
  time: string;
  icon: ReactNode;
  path?: string;
};

const realNotifications: RealNotification[] = [];

export default function AlertsPage() {
  const router = useRouter();
  const [showSidebarRail, setShowSidebarRail] = useState(false);
  const [activeTab, setActiveTab] = useState<AlertTab>('All');
  const [readIds, setReadIds] = useState<string[]>([]);
  const [showWhatsNew, setShowWhatsNew] = useState(false);

  const contentLeftOffset = showSidebarRail
    ? KIVO_CHAT_SIDEBAR_RAIL_WIDTH + SIDEBAR_GAP
    : 0;

  const visibleNotifications = useMemo(() => {
    if (activeTab === 'All') return realNotifications;
    if (activeTab === 'Updates') {
      return realNotifications.filter((item) => item.type === 'update');
    }
    return realNotifications.filter((item) => item.type === 'message');
  }, [activeTab]);

  const markRead = (id: string) => {
    setReadIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const handleOpen = (notification: RealNotification) => {
    markRead(notification.id);
    if (notification.path) router.push(notification.path);
  };

  const showUpdateCard = activeTab === 'All' || activeTab === 'Updates';
  const showEmptyState = visibleNotifications.length === 0;

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

        <section className="px-4 pb-[180px] pt-7 sm:px-5">
          <div className="origin-top-left w-[138%] max-w-[1120px] scale-[0.72]">
            <h1 className="font-serif text-[44px] leading-none tracking-[-0.06em]">
              Notifications
            </h1>

            <div className="mt-7 grid grid-cols-3 rounded-[18px] bg-black/[0.035] p-1.5">
              {(['All', 'Updates', 'Messages'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={[
                    'rounded-[14px] py-3 text-[15px] font-semibold transition-all',
                    activeTab === tab
                      ? 'bg-white shadow-[0_8px_18px_rgba(15,23,42,0.06)]'
                      : 'text-black/70',
                  ].join(' ')}
                >
                  {tab}
                </button>
              ))}
            </div>

            {showUpdateCard ? (
              <>
                <SectionTitle>Latest update</SectionTitle>
                <KivoWhatsNewCard
                  onPlay={() => setShowWhatsNew(true)}
                  onOpen={() => setShowWhatsNew(true)}
                />
              </>
            ) : null}

            {visibleNotifications.length > 0 ? (
              <>
                <SectionTitle>Today</SectionTitle>
                {visibleNotifications.map((notification) => (
                  <NotificationRow
                    key={notification.id}
                    icon={notification.icon}
                    title={notification.title}
                    description={notification.description}
                    time={notification.time}
                    unread={!readIds.includes(notification.id)}
                    onClick={() => handleOpen(notification)}
                  />
                ))}
              </>
            ) : showEmptyState ? (
              <EmptyState />
            ) : null}
          </div>
        </section>
      </div>

      {showWhatsNew ? (
        <KivoWhatsNewModal
          onClose={() => setShowWhatsNew(false)}
          onTry={() => {
            setShowWhatsNew(false);
            router.push('/chat');
          }}
        />
      ) : null}
    </main>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-4 mt-9 text-[15px] font-semibold tracking-[-0.03em] text-black/55">
      {children}
    </h2>
  );
}

function EmptyState() {
  return (
    <div className="mt-8 rounded-[26px] border border-black/[0.045] bg-white px-6 py-8 text-center shadow-[0_10px_26px_rgba(15,23,42,0.025)]">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] bg-black/[0.035]">
        <Sparkles className="h-6 w-6 text-black/70" />
      </div>
      <div className="mt-4 text-[18px] font-semibold tracking-[-0.04em]">
        No notifications yet
      </div>
      <p className="mx-auto mt-2 max-w-[420px] text-[15px] leading-[1.45] text-black/50">
        Kivo will show important updates here when something needs your attention.
      </p>
    </div>
  );
}

function NotificationRow({
  icon,
  title,
  description,
  time,
  unread = false,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  time: string;
  unread?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="mb-4 grid w-full grid-cols-[64px_1fr_auto] items-center gap-4 rounded-[24px] border border-black/[0.045] bg-white px-5 py-5 text-left shadow-[0_10px_26px_rgba(15,23,42,0.025)]"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-[17px] bg-black/[0.035]">
        {icon}
      </div>

      <div>
        <div className="text-[17px] font-semibold tracking-[-0.03em]">{title}</div>
        <p className="mt-1 max-w-[520px] text-[15px] leading-[1.45] text-black/50">
          {description}
        </p>
      </div>

      <div className="flex min-w-[44px] flex-col items-end gap-4 text-[13px] text-black/45">
        {time}
        {unread ? <span className="h-2.5 w-2.5 rounded-full bg-black/40" /> : null}
      </div>
    </button>
  );
}
