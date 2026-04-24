'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  BrainCircuit,
  ChevronRight,
  Grid2X2,
  Play,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';

import KivoChatHeader from '@/components/chat/kivo/KivoChatHeader';
import {
  KivoChatSidebarArea,
  KIVO_CHAT_SIDEBAR_RAIL_WIDTH,
} from '@/components/chat/kivo/KivoChatSidebarArea';

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
                <FeatureCard
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
        <WhatsNewModal
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

function FeatureCard({
  onPlay,
  onOpen,
}: {
  onPlay: () => void;
  onOpen: () => void;
}) {
  return (
    <div className="mb-4 grid grid-cols-[1.08fr_0.92fr] overflow-hidden rounded-[28px] border border-black/[0.045] bg-white shadow-[0_16px_40px_rgba(15,23,42,0.055)]">
      <div className="relative min-h-[250px] overflow-hidden bg-[#080914] p-6 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(154,117,255,0.48),transparent_34%),radial-gradient(circle_at_50%_100%,rgba(146,120,255,0.34),transparent_40%)]" />
        <div className="absolute left-1/2 top-[36px] h-32 w-32 -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_35%_28%,#B8A4FF,#3B2B74_55%,#090A15_100%)] shadow-[0_0_60px_rgba(152,117,255,0.45)]" />
        <div className="absolute bottom-8 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent" />

        <div className="relative z-10 flex items-center justify-between">
          <div className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/80">
            New update
          </div>
          <div className="text-[13px] text-white/55">08:12</div>
        </div>

        <div className="relative z-10 mt-14 text-center text-[30px] font-semibold tracking-[0.24em] text-white/80">
          KIVO
        </div>

        <button
          onClick={onPlay}
          className="absolute left-1/2 top-1/2 z-20 flex h-18 w-18 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/80 text-white shadow-[0_18px_44px_rgba(0,0,0,0.35)] ring-1 ring-white/20"
        >
          <Play className="h-8 w-8 fill-white" />
        </button>
      </div>

      <div className="p-7">
        <div className="inline-flex rounded-full bg-[#6D5DF6]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6D5DF6]">
          New update
        </div>

        <h3 className="mt-4 font-serif text-[31px] leading-[1.02] tracking-[-0.06em]">
          Kivo Operator just got smarter
        </h3>

        <p className="mt-5 text-[16px] leading-[1.45] text-black/55">
          Smarter reasoning, real-time results, and better tool execution.
        </p>

        <button
          onClick={onOpen}
          className="mt-6 inline-flex items-center gap-3 rounded-[15px] bg-white px-5 py-3 text-[14px] font-semibold shadow-[0_10px_24px_rgba(15,23,42,0.07)]"
        >
          See what’s new
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function WhatsNewModal({
  onClose,
  onTry,
}: {
  onClose: () => void;
  onTry: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-black/55 p-4 backdrop-blur-sm">
      <div className="mx-auto flex min-h-full max-w-xl items-center justify-center">
        <div className="w-full overflow-hidden rounded-[32px] bg-[#090A12] text-white shadow-[0_34px_90px_rgba(0,0,0,0.35)]">
          <div className="relative min-h-[310px] overflow-hidden p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(154,117,255,0.55),transparent_34%),radial-gradient(circle_at_50%_100%,rgba(146,120,255,0.38),transparent_40%)]" />
            <div className="absolute left-1/2 top-[72px] h-40 w-40 -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_35%_28%,#B8A4FF,#3B2B74_55%,#090A15_100%)] shadow-[0_0_70px_rgba(152,117,255,0.55)]" />

            <button
              onClick={onClose}
              className="absolute right-5 top-5 z-20 rounded-full bg-white/10 p-3 text-white hover:bg-white/15"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="relative z-10 flex justify-between">
              <IconBubble icon={<BrainCircuit className="h-6 w-6" />} />
              <IconBubble icon={<ShieldCheck className="h-6 w-6" />} />
            </div>

            <button className="absolute left-1/2 top-[145px] z-20 flex h-20 w-20 -translate-x-1/2 items-center justify-center rounded-full bg-black/80 shadow-[0_20px_50px_rgba(0,0,0,0.4)] ring-1 ring-white/20">
              <Play className="h-9 w-9 fill-white" />
            </button>
          </div>

          <div className="px-6 pb-6">
            <div className="inline-flex rounded-full bg-[#6D5DF6] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]">
              New update
            </div>

            <h2 className="mt-4 font-serif text-[40px] leading-[1.02] tracking-[-0.06em]">
              Kivo Operator just got smarter
            </h2>

            <p className="mt-4 text-[16px] leading-[1.55] text-white/68">
              Our biggest update yet. Smarter reasoning, deeper context, and real-time
              results built to handle more.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
              <Feature icon={<BrainCircuit />} title="Smarter reasoning" desc="Better multi-step understanding" />
              <Feature icon={<Zap />} title="Real-time results" desc="Faster answers with live data" />
              <Feature icon={<Grid2X2 />} title="More tools" desc="Seamless integrations" />
              <Feature icon={<ShieldCheck />} title="Better memory" desc="Remembers useful context" />
            </div>

            <button
              onClick={onTry}
              className="mt-7 flex w-full items-center justify-center gap-3 rounded-[17px] bg-white py-4 text-[15px] font-semibold text-[#111318]"
            >
              Try in chat
              <ChevronRight className="h-5 w-5" />
            </button>

            <button
              onClick={onClose}
              className="mt-3 w-full rounded-[17px] bg-white/10 py-4 text-[15px] font-semibold text-white"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function IconBubble({ icon }: { icon: ReactNode }) {
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-[18px] border border-white/15 bg-white/10 text-white shadow-[0_12px_32px_rgba(0,0,0,0.2)]">
      {icon}
    </div>
  );
}

function Feature({
  icon,
  title,
  desc,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div>
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-[14px] bg-white/10 text-white [&>svg]:h-5 [&>svg]:w-5">
        {icon}
      </div>
      <div className="text-[15px] font-semibold">{title}</div>
      <p className="mt-1 text-[13px] leading-[1.35] text-white/55">{desc}</p>
    </div>
  );
}
