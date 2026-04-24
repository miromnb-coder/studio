'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  CalendarDays,
  ChevronRight,
  Code2,
  FileText,
  Globe,
  Image,
  Mail,
  MoreHorizontal,
  Plus,
  Search,
  Sparkles,
  Wand2,
} from 'lucide-react';

import KivoChatHeader from '@/components/chat/kivo/KivoChatHeader';
import {
  KivoChatSidebarArea,
  KIVO_CHAT_SIDEBAR_RAIL_WIDTH,
} from '@/components/chat/kivo/KivoChatSidebarArea';

const SIDEBAR_GAP = 12;

const categories = ['All tools', 'Productivity', 'Communication', 'Data & Research', 'Automation', 'Utilities'];

const featuredTools = [
  { name: 'AI Writer', desc: 'Write, rewrite, and summarize anything.', icon: FileText },
  { name: 'Data Analyzer', desc: 'Analyze data and create powerful insights.', icon: BarChart3 },
  { name: 'Smart Automations', desc: 'Automate tasks and workflows in seconds.', icon: Wand2 },
];

const tools = [
  { name: 'AI Writer', desc: 'Write, rewrite, and summarize content.', icon: FileText },
  { name: 'Data Analyzer', desc: 'Analyze data and generate insights.', icon: BarChart3 },
  { name: 'Web Search', desc: 'Search the web with AI-powered results.', icon: Globe },
  { name: 'File Summarizer', desc: 'Summarize files, PDFs, and documents.', icon: FileText },
  { name: 'Image Analyzer', desc: 'Understand images and extract information.', icon: Image },
  { name: 'Code Assistant', desc: 'Write and debug code with AI.', icon: Code2 },
  { name: 'Email Assistant', desc: 'Draft, reply, and manage emails smarter.', icon: Mail },
  { name: 'Calendar Assistant', desc: 'Manage events, schedules, and reminders.', icon: CalendarDays },
];

const customTools = ['Create custom tool', 'Expense Tracker', 'Meeting Notes', 'Content Planner', 'Travel Planner'];

const activity = [
  'Data Analyzer generated “Q1 Sales Report”',
  'Email Assistant drafted 3 replies',
  'File Summarizer summarized “Project Brief.pdf”',
];

export default function ToolsPage() {
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
              Tools
            </h1>
            <p className="mt-2 text-[16px] text-black/50">
              Powerful tools to help you get more done.
            </p>

            <div className="mb-5 mt-8 flex items-center gap-3 rounded-[22px] border border-black/[0.055] bg-white px-5 py-4 shadow-[0_10px_26px_rgba(15,23,42,0.028)]">
              <Search className="h-5 w-5 text-black/45" />
              <input
                className="w-full bg-transparent text-[16px] outline-none placeholder:text-black/40"
                placeholder="Search tools..."
              />
            </div>

            <div className="mb-8 flex flex-wrap gap-3">
              {categories.map((item, index) => (
                <button
                  key={item}
                  className={[
                    'rounded-full px-5 py-3 text-[14px] font-medium',
                    index === 0 ? 'bg-[#111318] text-white' : 'bg-white text-[#111318]',
                  ].join(' ')}
                >
                  {item}
                </button>
              ))}
            </div>

            <SectionHeader title="Featured tools" />
            <div className="mb-9 grid grid-cols-3 gap-5">
              {featuredTools.map((tool) => (
                <FeaturedCard key={tool.name} {...tool} />
              ))}
            </div>

            <SectionTitle>All tools</SectionTitle>
            <div className="mb-9 overflow-hidden rounded-[24px] border border-black/[0.045] bg-white shadow-[0_10px_26px_rgba(15,23,42,0.025)]">
              {tools.map((tool) => (
                <ToolRow key={tool.name} {...tool} />
              ))}
            </div>

            <SectionHeader title="Your tools" />
            <div className="mb-9 grid grid-cols-5 gap-5">
              {customTools.map((tool, index) => (
                <CustomToolCard key={tool} title={tool} create={index === 0} />
              ))}
            </div>

            <SectionHeader title="Recent activity" />
            <div className="overflow-hidden rounded-[24px] border border-black/[0.045] bg-white shadow-[0_10px_26px_rgba(15,23,42,0.025)]">
              {activity.map((item, index) => (
                <ActivityRow key={item} text={item} time={`${index + 2}h ago`} />
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-4 text-[22px] font-semibold tracking-[-0.04em]">{children}</h2>;
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <SectionTitle>{title}</SectionTitle>
      <button className="inline-flex items-center gap-1 text-[14px] font-medium text-black/50">
        See all
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function FeaturedCard({ name, desc, icon: Icon }: { name: string; desc: string; icon: typeof FileText }) {
  return (
    <div className="rounded-[22px] border border-black/[0.055] bg-white p-5 shadow-[0_8px_22px_rgba(15,23,42,0.025)]">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[15px] bg-black/[0.035]">
        <Icon className="h-6 w-6" />
      </div>
      <div className="text-[17px] font-semibold tracking-[-0.03em]">{name}</div>
      <p className="mt-2 min-h-[48px] text-[14px] leading-[1.4] text-black/50">{desc}</p>
      <ChevronRight className="mt-5 h-5 w-5 rotate-180 text-black" />
    </div>
  );
}

function ToolRow({ name, desc, icon: Icon }: { name: string; desc: string; icon: typeof FileText }) {
  return (
    <div className="grid grid-cols-[52px_1fr_auto] items-center gap-4 border-b border-black/[0.045] px-5 py-4 last:border-b-0">
      <div className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-black/[0.035]">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-[15px] font-semibold tracking-[-0.03em]">{name}</div>
        <p className="mt-1 text-[13px] text-black/50">{desc}</p>
      </div>
      <div className="flex items-center gap-4">
        <button className="rounded-[12px] bg-black/[0.04] px-4 py-2 text-[13px] font-medium">
          Open
        </button>
        <MoreHorizontal className="h-5 w-5 text-black/35" />
      </div>
    </div>
  );
}

function CustomToolCard({ title, create }: { title: string; create?: boolean }) {
  return (
    <div className="rounded-[18px] border border-dashed border-black/[0.12] bg-white/70 p-4 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-[14px] bg-black/[0.035]">
        {create ? <Plus className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
      </div>
      <div className="text-[13px] font-semibold leading-tight tracking-[-0.03em]">{title}</div>
    </div>
  );
}

function ActivityRow({ text, time }: { text: string; time: string }) {
  return (
    <div className="grid grid-cols-[52px_1fr_auto] items-center gap-4 border-b border-black/[0.045] px-5 py-4 last:border-b-0">
      <div className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-black/[0.035]">
        <BarChart3 className="h-5 w-5" />
      </div>
      <div>
        <div className="text-[14px] font-medium text-black/65">{text}</div>
        <p className="mt-1 text-[12px] text-black/40">{time}</p>
      </div>
      <div className="flex h-6 w-6 items-center justify-center rounded-full border border-black/30">
        <ChevronRight className="h-3.5 w-3.5 rotate-90 text-black/60" />
      </div>
    </div>
  );
}
