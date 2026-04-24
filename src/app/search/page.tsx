'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarDays,
  ChevronRight,
  Clock3,
  FileText,
  MoreHorizontal,
  Search,
  X,
  MessageCircle,
  Circle,
} from 'lucide-react';

import KivoChatHeader from '@/components/chat/kivo/KivoChatHeader';
import {
  KivoChatSidebarArea,
  KIVO_CHAT_SIDEBAR_RAIL_WIDTH,
} from '@/components/chat/kivo/KivoChatSidebarArea';

const SIDEBAR_GAP = 12;

const tabs = ['All', 'Conversations', 'Files', 'Emails', 'Events', 'Tasks'];
const filters = ['Today', 'This week', 'This month', 'Unread'];

const recentSearches = ['Q4 marketing plan', 'invoice from acme', 'project roadmap'];

const conversations = [
  {
    title: 'Q4 Marketing Strategy',
    preview: 'You: Can you create a plan for Q4?',
    meta: 'Today • Kivo Operator',
  },
  {
    title: 'Website Redesign Project',
    preview: 'Kivo: Here are some ideas for the new layout',
    meta: 'Yesterday • Kivo Operator',
  },
  {
    title: 'Travel Planning',
    preview: 'You: Best places to visit in Japan in April?',
    meta: '2 days ago • Kivo Operator',
  },
];

const files = [
  { title: 'Q4_Marketing_Plan.pdf', meta: 'Google Drive • Modified 2h ago' },
  { title: 'Product_Requirements.docx', meta: 'Google Docs • Modified yesterday' },
  { title: 'Budget_Overview.xlsx', meta: 'Google Sheets • Modified 2 days ago' },
];

const emails = [
  { title: 'Invoice from Acme Inc.', preview: 'Hi, attached you’ll find the invoice for...', date: 'Mar 30' },
  { title: 'Partnership Opportunities', preview: 'Let’s explore ways we can work together...', date: 'Mar 29' },
  { title: 'Q4 Campaign Brief', preview: 'Here’s the brief for our Q4 campaign...', date: 'Mar 28' },
];

export default function SearchPage() {
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
            <h1 className="mb-7 font-serif text-[44px] leading-none tracking-[-0.06em]">
              Search
            </h1>

            <div className="mb-5 flex items-center gap-3 rounded-[22px] border border-black/[0.055] bg-white px-5 py-4 shadow-[0_10px_26px_rgba(15,23,42,0.028)]">
              <Search className="h-5 w-5 text-black/45" />
              <input
                className="w-full bg-transparent text-[16px] outline-none placeholder:text-black/40"
                placeholder="Search anything in Kivo..."
              />
            </div>

            <div className="mb-8 flex flex-wrap gap-3">
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
            </div>

            <SectionTitle>Quick filters</SectionTitle>
            <div className="mb-8 flex flex-wrap gap-4">
              {filters.map((filter) => (
                <Pill key={filter} icon={<CalendarDays className="h-4 w-4" />}>
                  {filter}
                </Pill>
              ))}
            </div>

            <div className="mb-4 flex items-center justify-between">
              <SectionTitle noMargin>Recent searches</SectionTitle>
              <button className="text-[14px] font-medium text-black/45">Clear</button>
            </div>

            <div className="mb-8 flex flex-wrap gap-4">
              {recentSearches.map((item) => (
                <Pill key={item} icon={<Clock3 className="h-4 w-4" />} right={<X className="h-4 w-4" />}>
                  {item}
                </Pill>
              ))}
            </div>

            <SearchSection title="Conversations">
              {conversations.map((item) => (
                <ResultRow
                  key={item.title}
                  icon={<MessageCircle className="h-5 w-5" />}
                  title={item.title}
                  preview={item.preview}
                  meta={item.meta}
                />
              ))}
            </SearchSection>

            <SearchSection title="Files">
              {files.map((item) => (
                <FileRow key={item.title} title={item.title} meta={item.meta} />
              ))}
            </SearchSection>

            <SearchSection title="Emails">
              {emails.map((item) => (
                <EmailRow key={item.title} {...item} />
              ))}
            </SearchSection>

            <SearchSection title="Events">
              <ResultRow
                icon={<GoogleCalendarIcon />}
                title="Team Stand-up"
                preview="Today • 10:00 – 10:30 AM"
                meta="In 20 min"
              />
            </SearchSection>
          </div>
        </section>
      </div>
    </main>
  );
}

function SectionTitle({ children, noMargin = false }: { children: ReactNode; noMargin?: boolean }) {
  return (
    <h2 className={`${noMargin ? '' : 'mb-4'} text-[17px] font-semibold tracking-[-0.04em] text-black/60`}>
      {children}
    </h2>
  );
}

function Pill({ children, icon, right }: { children: ReactNode; icon?: ReactNode; right?: ReactNode }) {
  return (
    <button className="inline-flex items-center gap-3 rounded-[16px] bg-white px-5 py-3 text-[14px] font-medium shadow-[0_8px_22px_rgba(15,23,42,0.025)]">
      {icon}
      {children}
      {right}
    </button>
  );
}

function SearchSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <SectionTitle noMargin>{title}</SectionTitle>
        <button className="inline-flex items-center gap-1 text-[14px] font-medium text-black/50">
          See all
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-black/[0.045] bg-white shadow-[0_10px_26px_rgba(15,23,42,0.025)]">
        {children}
      </div>
    </section>
  );
}

function ResultRow({
  icon,
  title,
  preview,
  meta,
}: {
  icon: ReactNode;
  title: string;
  preview: string;
  meta: string;
}) {
  return (
    <div className="grid grid-cols-[52px_1fr_auto] items-center gap-4 border-b border-black/[0.045] px-5 py-4 last:border-b-0">
      <div className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-black/[0.035]">
        {icon}
      </div>

      <div>
        <div className="text-[15px] font-semibold tracking-[-0.03em]">{title}</div>
        <p className="mt-1 text-[13px] text-black/50">{preview}</p>
        <p className="mt-1 text-[12px] text-black/40">{meta}</p>
      </div>

      <ChevronRight className="h-5 w-5 text-black/25" />
    </div>
  );
}

function FileRow({ title, meta }: { title: string; meta: string }) {
  const Icon = title.endsWith('.pdf')
    ? GoogleDriveIcon
    : title.endsWith('.docx')
      ? GoogleDocsIcon
      : title.endsWith('.xlsx')
        ? GoogleSheetsIcon
        : FileText;

  return (
    <div className="grid grid-cols-[52px_1fr_auto] items-center gap-4 border-b border-black/[0.045] px-5 py-4 last:border-b-0">
      <div className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-black/[0.035]">
        <Icon />
      </div>

      <div>
        <div className="text-[15px] font-semibold tracking-[-0.03em]">{title}</div>
        <p className="mt-1 text-[13px] text-black/45">{meta}</p>
      </div>

      <MoreHorizontal className="h-5 w-5 text-black/35" />
    </div>
  );
}

function EmailRow({
  title,
  preview,
  date,
}: {
  title: string;
  preview: string;
  date: string;
}) {
  return (
    <div className="grid grid-cols-[52px_1fr_auto] items-center gap-4 border-b border-black/[0.045] px-5 py-4 last:border-b-0">
      <div className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-black/[0.035]">
        <GmailIcon />
      </div>

      <div>
        <div className="text-[15px] font-semibold tracking-[-0.03em]">{title}</div>
        <p className="mt-1 text-[13px] text-black/50">{preview}</p>
      </div>

      <div className="flex flex-col items-end gap-2 text-[12px] text-black/45">
        {date}
        <Circle className="h-2 w-2 fill-black/40 text-black/40" />
      </div>
    </div>
  );
}

function GmailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6">
      <path fill="#EA4335" d="M4 6.5 12 12.5 20 6.5v11A1.5 1.5 0 0 1 18.5 19H17V9.75l-5 3.75-5-3.75V19H5.5A1.5 1.5 0 0 1 4 17.5v-11Z" />
      <path fill="#FBBC04" d="M4 6.5A1.5 1.5 0 0 1 5.5 5H6l6 4.5L18 5h.5A1.5 1.5 0 0 1 20 6.5l-8 6-8-6Z" />
      <path fill="#34A853" d="M17 9.75V19h1.5A1.5 1.5 0 0 0 20 17.5v-11l-3 3.25Z" />
      <path fill="#4285F4" d="M4 6.5v11A1.5 1.5 0 0 0 5.5 19H7V9.75L4 6.5Z" />
    </svg>
  );
}

function GoogleDriveIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6">
      <path fill="#0F9D58" d="M8.2 4h4.3l5.4 9.3h-4.3L8.2 4Z" />
      <path fill="#4285F4" d="M7.2 5.4 2.5 13.6 4.7 17.5 9.4 9.3 7.2 5.4Z" />
      <path fill="#F4B400" d="M10.6 13.3h10.9l-2.2 4.2H8.4l2.2-4.2Z" />
      <path fill="#0F9D58" d="M8.4 17.5h10.9l2.2 3.8H10.6l-2.2-3.8Z" opacity=".9" />
      <path fill="#4285F4" d="M2.5 13.6h10.9l-2.2 3.9H4.7l-2.2-3.9Z" />
    </svg>
  );
}

function GoogleDocsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6">
      <path fill="#4285F4" d="M6 2.8h8.2L19 7.6v13.6H6V2.8Z" />
      <path fill="#AECBFA" d="M14.2 2.8v4.8H19l-4.8-4.8Z" />
      <path stroke="#fff" strokeWidth="1.2" strokeLinecap="round" d="M8.7 11h6.6M8.7 14h6.6M8.7 17h4.8" />
    </svg>
  );
}

function GoogleSheetsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6">
      <path fill="#0F9D58" d="M6 2.8h8.2L19 7.6v13.6H6V2.8Z" />
      <path fill="#A8DAB5" d="M14.2 2.8v4.8H19l-4.8-4.8Z" />
      <path stroke="#fff" strokeWidth="1.1" d="M8.5 11h7M8.5 14h7M8.5 17h7M10.8 9.5v9M13.2 9.5v9" />
    </svg>
  );
}

function GoogleCalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6">
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
