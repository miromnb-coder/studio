'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CalendarDays,
  CheckSquare,
  ChevronRight,
  Gift,
  Play,
} from 'lucide-react';

import KivoChatHeader from '@/components/chat/kivo/KivoChatHeader';
import {
  KivoChatSidebarArea,
  KIVO_CHAT_SIDEBAR_RAIL_WIDTH,
} from '@/components/chat/kivo/KivoChatSidebarArea';

const SIDEBAR_GAP = 12;

export default function AlertsPage() {
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
              Notifications
            </h1>

            <div className="mt-7 grid grid-cols-3 rounded-[18px] bg-black/[0.035] p-1.5">
              {['All', 'Updates', 'Messages'].map((tab, index) => (
                <button
                  key={tab}
                  className={[
                    'rounded-[14px] py-3 text-[15px] font-semibold',
                    index === 0 ? 'bg-white shadow-[0_8px_18px_rgba(15,23,42,0.06)]' : 'text-black/70',
                  ].join(' ')}
                >
                  {tab}
                </button>
              ))}
            </div>

            <SectionTitle>Today</SectionTitle>

            <NotificationRow
              icon={<Gift className="h-6 w-6" />}
              title="You earned 300 bonus runs"
              description="Thanks for inviting your friend to Kivo!"
              time="09:30"
              unread
            />

            <FeatureCard />

            <SectionTitle>Yesterday</SectionTitle>

            <NotificationRow
              icon={<CalendarDays className="h-6 w-6" />}
              title="Your day is planned"
              description="Kivo created a schedule to help you focus."
              time="18:05"
              unread
            />

            <NotificationRow
              icon={<GmailIcon />}
              title="Important email summary"
              description="We found 4 important emails in your inbox."
              time="17:20"
              unread
            />

            <NotificationRow
              icon={<GoogleCalendarIcon />}
              title="Upcoming event"
              description="Team stand-up in 10 minutes at 10:00 AM."
              time="16:45"
              unread
            />

            <NotificationRow
              icon={<GoogleDriveIcon />}
              title="Files organized"
              description="Kivo organized 28 files in your Drive."
              time="15:11"
              unread
            />

            <SectionTitle>This week</SectionTitle>

            <NotificationRow
              icon={<CheckSquare className="h-6 w-6" />}
              title="Task completed"
              description="“Weekly report” has been completed successfully."
              time="Mon"
              chevron
            />
          </div>
        </section>
      </div>
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

function NotificationRow({
  icon,
  title,
  description,
  time,
  unread = false,
  chevron = false,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  time: string;
  unread?: boolean;
  chevron?: boolean;
}) {
  return (
    <div className="mb-4 grid grid-cols-[64px_1fr_auto] items-center gap-4 rounded-[24px] border border-black/[0.045] bg-white px-5 py-5 shadow-[0_10px_26px_rgba(15,23,42,0.025)]">
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
        {chevron ? (
          <ChevronRight className="h-5 w-5 text-black/35" />
        ) : unread ? (
          <span className="h-2.5 w-2.5 rounded-full bg-black/40" />
        ) : null}
      </div>
    </div>
  );
}

function FeatureCard() {
  return (
    <div className="mb-4 grid grid-cols-[1.08fr_0.92fr] overflow-hidden rounded-[24px] border border-black/[0.045] bg-white shadow-[0_10px_26px_rgba(15,23,42,0.025)]">
      <div className="relative min-h-[230px] bg-black/[0.025] p-6">
        <div className="rounded-[18px] bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
          <div className="mb-4 text-[13px] font-semibold">Kivo Operator</div>
          {['Researching', 'Collecting data', 'Summarizing'].map((item) => (
            <div key={item} className="mb-3 flex items-center gap-2 text-[12px] text-black/55">
              <span className="h-4 w-4 rounded-full bg-[#22C55E]/15 text-center text-[10px] text-[#16A34A]">✓</span>
              {item}
            </div>
          ))}
          <div className="mt-5 h-2 rounded-full bg-black/[0.08]">
            <div className="h-2 w-[58%] rounded-full bg-black/35" />
          </div>
          <div className="mt-3 flex justify-between text-[11px] text-black/45">
            <span>Estimated time</span>
            <span>2 min left</span>
          </div>
        </div>

        <div className="absolute left-1/2 top-1/2 flex h-18 w-18 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#111318] text-white shadow-[0_14px_34px_rgba(0,0,0,0.24)]">
          <Play className="h-8 w-8 fill-white" />
        </div>
      </div>

      <div className="p-7">
        <div className="flex justify-end text-[13px] text-black/45">08:12</div>
        <h3 className="mt-3 font-serif text-[29px] leading-[1.04] tracking-[-0.055em]">
          Kivo Operator just got smarter
        </h3>
        <p className="mt-5 text-[16px] leading-[1.45] text-black/55">
          Multi-step reasoning, real-time results, better than ever.
        </p>
        <button className="mt-6 rounded-[14px] bg-white px-5 py-3 text-[14px] font-semibold shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
          See what’s new
        </button>
      </div>
    </div>
  );
}

function GmailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7">
      <path fill="#EA4335" d="M4 6.5 12 12.5 20 6.5v11A1.5 1.5 0 0 1 18.5 19H17V9.75l-5 3.75-5-3.75V19H5.5A1.5 1.5 0 0 1 4 17.5v-11Z" />
      <path fill="#FBBC04" d="M4 6.5A1.5 1.5 0 0 1 5.5 5H6l6 4.5L18 5h.5A1.5 1.5 0 0 1 20 6.5l-8 6-8-6Z" />
      <path fill="#34A853" d="M17 9.75V19h1.5A1.5 1.5 0 0 0 20 17.5v-11l-3 3.25Z" />
      <path fill="#4285F4" d="M4 6.5v11A1.5 1.5 0 0 0 5.5 19H7V9.75L4 6.5Z" />
    </svg>
  );
}

function GoogleDriveIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7">
      <path fill="#0F9D58" d="M8.2 4h4.3l5.4 9.3h-4.3L8.2 4Z" />
      <path fill="#4285F4" d="M7.2 5.4 2.5 13.6 4.7 17.5 9.4 9.3 7.2 5.4Z" />
      <path fill="#F4B400" d="M10.6 13.3h10.9l-2.2 4.2H8.4l2.2-4.2Z" />
      <path fill="#0F9D58" d="M8.4 17.5h10.9l2.2 3.8H10.6l-2.2-3.8Z" opacity=".9" />
      <path fill="#4285F4" d="M2.5 13.6h10.9l-2.2 3.9H4.7l-2.2-3.9Z" />
    </svg>
  );
}

function GoogleCalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7">
      <rect x="4" y="4" width="16" height="16" rx="3" fill="#fff" />
      <path fill="#4285F4" d="M4 8a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2H4V8Z" />
      <path fill="#34A853" d="M4 10h16v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-6Z" opacity=".18" />
      <path fill="#EA4335" d="M4 9h16v1.3H4z" />
      <text x="12" y="17" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#4285F4">
        31
      </text>
    </svg>
  );
}
