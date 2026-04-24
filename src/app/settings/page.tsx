'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Code2,
  CreditCard,
  Crown,
  Database,
  Download,
  Folder,
  Gift,
  Globe,
  HelpCircle,
  Lock,
  Palette,
  Settings,
  Sun,
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

export default function SettingsPage() {
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
              Settings
            </h1>
            <p className="mt-2 text-[16px] text-black/50">
              Manage your preferences, account, and integrations.
            </p>

            <div className="mt-8 rounded-[24px] border border-black/[0.045] bg-white p-6 shadow-[0_10px_26px_rgba(15,23,42,0.025)]">
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#7B5342] text-[38px] font-medium text-white">
                    M
                  </div>
                  <div>
                    <div className="text-[24px] font-semibold tracking-[-0.04em]">Mikael</div>
                    <div className="mt-1 text-[14px] text-black/45">mikael@example.com</div>
                    <div className="mt-2 inline-flex rounded-[10px] bg-black/[0.04] px-3 py-1.5 text-[12px] font-medium">
                      Free plan
                    </div>
                  </div>
                </div>

                <button className="inline-flex items-center gap-3 rounded-[14px] bg-black/[0.04] px-5 py-3 text-[14px] font-medium">
                  Manage account
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <SectionTitle>Preferences</SectionTitle>
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <SettingsRow icon={<Settings />} title="General" subtitle="Language, time zone, and app settings" />
                <SettingsRow icon={<Palette />} title="Appearance" subtitle="Theme, color, and display options" />
                <SettingsRow icon={<Bell />} title="Notifications" subtitle="Manage how you receive updates" />
                <SettingsRow icon={<Lock />} title="Privacy" subtitle="Control your data and visibility" last />
              </Card>

              <Card>
                <h3 className="mb-7 text-[18px] font-semibold tracking-[-0.03em]">Quick settings</h3>
                <QuickRow icon={<Sun />} label="Theme" value="Light" />
                <QuickRow icon={<Globe />} label="Language" value="English" />
                <QuickRow icon={<User />} label="Time zone" value="(GMT+2) Helsinki" />
                <QuickRow icon={<CalendarDays />} label="Start week on" value="Monday" last />
              </Card>
            </div>

            <SectionTitle>Integrations</SectionTitle>
            <Card>
              <div className="grid grid-cols-2 gap-x-8">
                <div>
                  <IntegrationRow icon={<GoogleDriveIcon />} title="Google Drive" connected />
                  <IntegrationRow icon={<GmailIcon />} title="Gmail" connected />
                  <IntegrationRow icon={<GoogleCalendarIcon />} title="Google Calendar" connected last />
                </div>
                <div className="border-l border-black/[0.055] pl-8">
                  <IntegrationRow icon={<NotionIcon />} title="Notion" />
                  <IntegrationRow icon={<SlackIcon />} title="Slack" />
                  <IntegrationRow icon={<DropboxIcon />} title="Dropbox" last />
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <SectionTitle>Account</SectionTitle>
                <Card>
                  <SettingsRow icon={<Crown />} title="Plan" right="Free plan" />
                  <SettingsRow icon={<Zap />} title="Usage" subtitle="View your usage and limits" />
                  <SettingsRow icon={<CreditCard />} title="Billing" subtitle="Manage payment and invoices" />
                  <SettingsRow icon={<Code2 />} title="API" subtitle="Manage API keys and devices" />
                  <SettingsRow icon={<Trash2 />} title="Delete account" subtitle="Permanently delete your account" last />
                </Card>
              </div>

              <div>
                <SectionTitle>Data & memory</SectionTitle>
                <Card>
                  <SettingsRow icon={<Database />} title="Memory" subtitle="Manage what Kivo remembers" />
                  <SettingsRow icon={<Folder />} title="Data sources" subtitle="Connected sources and data" />
                  <SettingsRow icon={<Download />} title="Export data" subtitle="Download your data" />
                  <SettingsRow icon={<Trash2 />} title="Clear data" subtitle="Clear your data and history" last />
                </Card>
              </div>
            </div>

            <SectionTitle>About</SectionTitle>
            <Card>
              <div className="grid grid-cols-3 divide-x divide-black/[0.055]">
                <AboutItem icon={<KivoIcon />} title="About Kivo" subtitle="Version 1.0.0" />
                <AboutItem icon={<HelpCircle />} title="Help center" subtitle="Get help and support" />
                <AboutItem icon={<Gift />} title="What’s new" subtitle="See the latest updates" />
              </div>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-4 mt-9 text-[22px] font-semibold tracking-[-0.04em]">{children}</h2>;
}

function Card({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-black/[0.045] bg-white p-5 shadow-[0_10px_26px_rgba(15,23,42,0.025)]">
      {children}
    </div>
  );
}

function SettingsRow({ icon, title, subtitle, right, last = false }: { icon: ReactNode; title: string; subtitle?: string; right?: string; last?: boolean }) {
  return (
    <div className={`flex items-center gap-4 py-4 ${last ? '' : 'border-b border-black/[0.045]'}`}>
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-black/[0.035] [&>svg]:h-5 [&>svg]:w-5">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[16px] font-semibold tracking-[-0.03em]">{title}</div>
        {subtitle ? <div className="mt-1 text-[13px] text-black/45">{subtitle}</div> : null}
      </div>
      {right ? <div className="text-[14px] text-black/55">{right}</div> : null}
      <ChevronRight className="h-5 w-5 text-black/35" />
    </div>
  );
}

function QuickRow({ icon, label, value, last = false }: { icon: ReactNode; label: string; value: string; last?: boolean }) {
  return (
    <div className={`flex items-center gap-4 py-4 ${last ? '' : 'border-b border-transparent'}`}>
      <div className="[&>svg]:h-5 [&>svg]:w-5">{icon}</div>
      <div className="flex-1 text-[15px] font-medium">{label}</div>
      <div className="text-[15px] text-black/65">{value}</div>
      <ChevronDown className="h-4 w-4 text-black/35" />
    </div>
  );
}

function IntegrationRow({ icon, title, connected = false, last = false }: { icon: ReactNode; title: string; connected?: boolean; last?: boolean }) {
  return (
    <div className={`flex items-center gap-4 py-4 ${last ? '' : 'border-b border-black/[0.045]'}`}>
      <div className="flex h-11 w-11 items-center justify-center">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="text-[16px] font-semibold tracking-[-0.03em]">{title}</div>
        {connected ? (
          <div className="mt-1 flex items-center gap-1.5 text-[13px] text-black/45">
            <span className="h-2 w-2 rounded-full bg-[#22C55E]" />
            Connected
          </div>
        ) : null}
      </div>
      {connected ? <ChevronRight className="h-5 w-5 text-black/35" /> : <button className="rounded-[12px] bg-black/[0.04] px-4 py-2 text-[13px] font-medium">Connect</button>}
    </div>
  );
}

function AboutItem({ icon, title, subtitle }: { icon: ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <div className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-black/[0.035] [&>svg]:h-5 [&>svg]:w-5">
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-[15px] font-semibold">{title}</div>
        <div className="mt-1 text-[12px] text-black/45">{subtitle}</div>
      </div>
      <ChevronRight className="h-5 w-5 text-black/35" />
    </div>
  );
}

function KivoIcon() {
  return <span className="text-[18px] font-bold">K</span>;
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
      <text x="12" y="17" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#4285F4">31</text>
    </svg>
  );
}

function NotionIcon() {
  return <span className="text-[26px] font-serif font-bold">N</span>;
}

function SlackIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7">
      <path fill="#36C5F0" d="M8.2 3a2 2 0 0 1 2 2v4h-2a2 2 0 0 1 0-4Z" />
      <path fill="#2EB67D" d="M21 8.2a2 2 0 0 1-2 2h-4v-2a2 2 0 0 1 4 0Z" />
      <path fill="#ECB22E" d="M15.8 21a2 2 0 0 1-2-2v-4h2a2 2 0 0 1 0 4Z" />
      <path fill="#E01E5A" d="M3 15.8a2 2 0 0 1 2-2h4v2a2 2 0 0 1-4 0Z" />
      <path fill="#36C5F0" d="M13.8 3a2 2 0 0 1 2 2v4h-4V5a2 2 0 0 1 2-2Z" />
      <path fill="#2EB67D" d="M21 13.8a2 2 0 0 1-2 2h-4v-4h4a2 2 0 0 1 2 2Z" />
      <path fill="#ECB22E" d="M10.2 21a2 2 0 0 1-2-2v-4h4v4a2 2 0 0 1-2 2Z" />
      <path fill="#E01E5A" d="M3 10.2a2 2 0 0 1 2-2h4v4H5a2 2 0 0 1-2-2Z" />
    </svg>
  );
}

function DropboxIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7">
      <path fill="#0061FF" d="m6.5 4 5.5 3.5L6.5 11 1 7.5 6.5 4Zm11 0L23 7.5 17.5 11 12 7.5 17.5 4ZM1 14.5 6.5 11l5.5 3.5L6.5 18 1 14.5Zm16.5-3.5 5.5 3.5-5.5 3.5-5.5-3.5 5.5-3.5ZM6.5 19l5.5-3.5 5.5 3.5-5.5 3.5L6.5 19Z" />
    </svg>
  );
}
