'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  Filter,
  Image,
  Mail,
  MessageCircle,
  Search,
  SlidersHorizontal,
  Wrench,
} from 'lucide-react';

import KivoChatHeader from '@/components/chat/kivo/KivoChatHeader';
import {
  KivoChatSidebarArea,
  KIVO_CHAT_SIDEBAR_RAIL_WIDTH,
} from '@/components/chat/kivo/KivoChatSidebarArea';

const SIDEBAR_GAP = 12;

const tabs = ['All', 'Conversations', 'Tasks', 'Tools', 'Files', 'Agents'];

const stats = [
  { label: 'Conversations', value: '342', sub: 'Total', icon: MessageCircle },
  { label: 'Tasks', value: '128', sub: 'Completed', icon: CheckCircle2 },
  { label: 'Tools used', value: '56', sub: 'This month', icon: Wrench },
  { label: 'Time saved', value: '24h', sub: 'This month', icon: Clock3 },
];

const timeline = [
  {
    group: 'Today',
    items: [
      { time: '10:42 AM', title: 'Q4 Marketing Strategy', desc: 'Conversation with Research Agent', tag: 'Conversation', icon: MessageCircle },
      { time: '09:15 AM', title: 'Create campaign brief', desc: 'Completed task', tag: 'Task', icon: CheckCircle2 },
      { time: '08:30 AM', title: 'Market analysis Q1 2024.pdf', desc: 'Summarized with File Summarizer', tag: 'Tool', icon: FileText },
    ],
  },
  {
    group: 'Yesterday',
    items: [
      { time: '06:45 PM', title: 'Team stand-up meeting', desc: 'Added to Google Calendar', tag: 'Tool', icon: CalendarDays },
      { time: '03:20 PM', title: 'Draft client proposal', desc: 'Created with AI Writer', tag: 'Tool', icon: Mail },
      { time: '11:07 AM', title: 'Budget planning discussion', desc: 'Conversation with Money Agent', tag: 'Conversation', icon: MessageCircle },
    ],
  },
  {
    group: 'May 6, 2024',
    items: [
      { time: '07:40 PM', title: 'Automate weekly report', desc: 'Workflow created', tag: 'Task', icon: SlidersHorizontal },
      { time: '02:18 PM', title: 'Sales data analysis', desc: 'Analyzed with Data Analyzer', tag: 'Tool', icon: BarChart3 },
      { time: '09:30 AM', title: 'Product roadmap.png', desc: 'Analyzed with Vision Agent', tag: 'Tool', icon: Image },
    ],
  },
];

const jumpBack = [
  { title: 'Q4 Marketing Strategy', meta: 'Today • 10:42 AM', type: 'Conversation', icon: MessageCircle },
  { title: 'Create campaign brief', meta: 'Today • 09:15 AM', type: 'Task', icon: CheckCircle2 },
  { title: 'Market analysis Q1 2024.pdf', meta: 'Today • 08:30 AM', type: 'Tool', icon: FileText },
  { title: 'Team stand-up meeting', meta: 'Yesterday • 06:45 PM', type: 'Tool', icon: CalendarDays },
];

export default function HistoryPage() {
  const router = useRouter();
  const [showSidebarRail, setShowSidebarRail] = useState(false);

  const contentLeftOffset = showSidebarRail
    ? KIVO_CHAT_SIDEBAR_RAIL_WIDTH + SIDEBAR_GAP
    : 0;

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

        <section className="px-4 pb-14 pt-7 sm:px-5">
          <div className="origin-top-left w-[138%] max-w-[1120px] scale-[0.72]">
            <h1 className="font-serif text-[44px] leading-none tracking-[-0.06em]">
              History
            </h1>
            <p className="mt-2 text-[16px] text-black/50">
              Your past conversations, tasks, and activity.
            </p>

            <div className="mb-5 mt-8 flex items-center gap-3 rounded-[22px] border border-black/[0.055] bg-white px-5 py-4 shadow-[0_10px_26px_rgba(15,23,42,0.028)]">
              <Search className="h-5 w-5 text-black/45" />
              <input
                className="w-full bg-transparent text-[16px] outline-none placeholder:text-black/40"
                placeholder="Search history..."
              />
            </div>

            <div className="mb-8 flex flex-wrap items-center gap-3">
              {tabs.map((tab, index) => (
                <button
                  key={tab}
                  className={[
                    'rounded-full px-5 py-3 text-[14px] font-medium',
                    index === 0 ? 'bg-[#111318] text-white' : 'bg-white text-[#111318]',
                  ].join(' ')}
                >
                  {tab}
                </button>
              ))}

              <button className="ml-auto inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-[14px] font-medium text-[#111318]">
                <Filter className="h-4 w-4" />
                Filters
              </button>
            </div>

            <div className="mb-9 grid grid-cols-4 gap-5">
              {stats.map((item) => (
                <StatCard key={item.label} {...item} />
              ))}
            </div>

            {timeline.map((group) => (
              <TimelineGroup key={group.group} title={group.group}>
                {group.items.map((item) => (
                  <TimelineRow key={`${group.group}-${item.title}`} {...item} />
                ))}
              </TimelineGroup>
            ))}

            <div className="mx-auto mb-10 mt-2 flex justify-center">
              <button className="rounded-[16px] bg-black/[0.04] px-10 py-4 text-[14px] font-medium">
                Load more
              </button>
            </div>

            <div className="rounded-[28px] bg-black/[0.025] p-6">
              <h2 className="mb-5 text-[22px] font-semibold tracking-[-0.04em]">
                Jump back in
              </h2>

              <div className="grid grid-cols-4 gap-5">
                {jumpBack.map((item) => (
                  <JumpCard key={item.title} {...item} />
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
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
  icon: typeof MessageCircle;
}) {
  return (
    <div className="rounded-[22px] border border-black/[0.055] bg-white p-5 shadow-[0_8px_22px_rgba(15,23,42,0.025)]">
      <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-[15px] bg-black/[0.035]">
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-[14px] text-black/45">{label}</div>
      <div className="mt-1 font-serif text-[34px] leading-none tracking-[-0.06em]">
        {value}
      </div>
      <div className="mt-2 text-[13px] text-black/45">{sub}</div>
    </div>
  );
}

function TimelineGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-9">
      <h2 className="mb-4 text-[19px] font-semibold tracking-[-0.04em]">
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
  tag,
  icon: Icon,
}: {
  time: string;
  title: string;
  desc: string;
  tag: string;
  icon: typeof MessageCircle;
}) {
  return (
    <div className="grid grid-cols-[90px_1fr] gap-5">
      <div className="relative pt-5 text-right text-[13px] text-black/45">
        {time}
        <span className="absolute right-[-17px] top-[26px] h-2 w-2 rounded-full bg-black/[0.12]" />
      </div>

      <div className="grid grid-cols-[52px_1fr_auto] items-center gap-4 rounded-[18px] border border-black/[0.045] bg-white px-5 py-4 shadow-[0_8px_22px_rgba(15,23,42,0.02)]">
        <div className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-black/[0.035]">
          <Icon className="h-5 w-5" />
        </div>

        <div>
          <div className="text-[15px] font-semibold tracking-[-0.03em]">{title}</div>
          <p className="mt-1 text-[13px] text-black/45">{desc}</p>
        </div>

        <div className="flex items-center gap-5">
          <span className="rounded-[10px] bg-black/[0.04] px-3 py-1.5 text-[12px] font-medium text-black/55">
            {tag}
          </span>
          <ChevronRight className="h-5 w-5 text-black/25" />
        </div>
      </div>
    </div>
  );
}

function JumpCard({
  title,
  meta,
  type,
  icon: Icon,
}: {
  title: string;
  meta: string;
  type: string;
  icon: typeof MessageCircle;
}) {
  return (
    <div className="rounded-[18px] border border-black/[0.045] bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.02)]">
      <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-[14px] bg-black/[0.035]">
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-h-[42px] text-[14px] font-semibold leading-[1.25] tracking-[-0.03em]">
        {title}
      </div>
      <p className="mt-4 text-[12px] text-black/40">{meta}</p>
      <p className="mt-2 text-[12px] font-medium text-black/50">{type}</p>
    </div>
  );
}
