'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
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
  MessageCircle,
  Mic,
  Palette,
  Settings,
  ShieldCheck,
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

type KivoUser = {
  name: string;
  email: string;
  plan: 'free' | 'premium';
  emailVerified: boolean;
};

type Integration = {
  key: string;
  title: string;
  subtitle: string;
  connected: boolean;
  href: string;
  icon: ReactNode;
};

export default function SettingsPage() {
  const router = useRouter();
  const [showSidebarRail, setShowSidebarRail] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'clear-data' | 'delete-account' | null>(null);

  const [theme, setTheme] = useState('Light');
  const [language, setLanguage] = useState('English');
  const [weekStart, setWeekStart] = useState('Monday');

  const [user, setUser] = useState<KivoUser>({
    name: 'Kivo user',
    email: 'No email connected',
    plan: 'free',
    emailVerified: false,
  });

  const [stats, setStats] = useState({
    conversations: 0,
    tasks: 0,
    timeSaved: '0h',
    usagePercent: 0,
  });

  const [connected, setConnected] = useState({
    gmail: false,
    googleCalendar: false,
    browserSearch: false,
    googleDrive: false,
    github: false,
    outlook: false,
  });

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('kivo.user');
      const storedStats = localStorage.getItem('kivo.stats');
      const storedIntegrations = localStorage.getItem('kivo.integrations');

      if (storedUser) setUser((prev) => ({ ...prev, ...JSON.parse(storedUser) }));
      if (storedStats) setStats((prev) => ({ ...prev, ...JSON.parse(storedStats) }));
      if (storedIntegrations) setConnected((prev) => ({ ...prev, ...JSON.parse(storedIntegrations) }));

      setTheme(localStorage.getItem('kivo.settings.theme') || 'Light');
      setLanguage(localStorage.getItem('kivo.settings.language') || 'English');
      setWeekStart(localStorage.getItem('kivo.settings.weekStart') || 'Monday');
    } catch {
      // safe fallback
    }
  }, []);

  const contentLeftOffset = showSidebarRail
    ? KIVO_CHAT_SIDEBAR_RAIL_WIDTH + SIDEBAR_GAP
    : 0;

  const displayName = user.name || 'Kivo user';
  const initial = displayName.charAt(0).toUpperCase();
  const planLabel = user.plan === 'premium' ? 'Premium plan' : 'Free plan';

  const integrations: Integration[] = [
    {
      key: 'gmail',
      title: 'Gmail',
      subtitle: 'Smart inbox access',
      connected: connected.gmail,
      href: '/actions?tool=gmail',
      icon: <GmailIcon />,
    },
    {
      key: 'googleCalendar',
      title: 'Google Calendar',
      subtitle: 'Schedule and planning',
      connected: connected.googleCalendar,
      href: '/actions?tool=google-calendar',
      icon: <GoogleCalendarIcon />,
    },
    {
      key: 'browserSearch',
      title: 'Browser Search',
      subtitle: 'Live web research',
      connected: connected.browserSearch,
      href: '/tools?tool=browser-search',
      icon: <BrowserIcon />,
    },
    {
      key: 'googleDrive',
      title: 'Google Drive',
      subtitle: 'Files and documents',
      connected: connected.googleDrive,
      href: '/tools?source=drive',
      icon: <GoogleDriveIcon />,
    },
    {
      key: 'github',
      title: 'GitHub',
      subtitle: 'Code and repositories',
      connected: connected.github,
      href: '/tools?tool=github',
      icon: <GitHubIcon />,
    },
    {
      key: 'outlook',
      title: 'Outlook',
      subtitle: 'Email and calendar',
      connected: connected.outlook,
      href: '/tools?tool=outlook',
      icon: <OutlookIcon />,
    },
  ];

  function updateSetting(key: string, value: string) {
    localStorage.setItem(`kivo.settings.${key}`, value);
    if (key === 'theme') setTheme(value);
    if (key === 'language') setLanguage(value);
    if (key === 'weekStart') setWeekStart(value);
  }

  function exportData() {
    const data = {
      user,
      stats,
      connected,
      settings: { theme, language, weekStart },
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'kivo-data-export.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  function clearData() {
    localStorage.removeItem('kivo.history');
    localStorage.removeItem('kivo:history');
    localStorage.removeItem('kivo.activity');
    setConfirmAction(null);
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
          <div className="mx-auto max-w-[1180px]">
            <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="font-serif text-[44px] leading-none tracking-[-0.06em]">
                  Settings
                </h1>
                <p className="mt-2 text-[16px] text-black/50">
                  Manage your preferences, account, and integrations.
                </p>
              </div>

              <div>
                <button
                  onClick={() => router.push('/chat?prompt=optimize-settings')}
                  className="inline-flex items-center gap-2 rounded-[16px] border border-black/[0.06] bg-white px-5 py-3 text-[14px] font-medium shadow-[0_10px_26px_rgba(15,23,42,0.025)]"
                >
                  <Zap className="h-4 w-4" />
                  Let Kivo optimize my settings
                </button>
                <p className="mt-2 text-[12px] text-black/45">
                  Personalize your experience in one click.
                </p>
              </div>
            </div>

            <Card className="mb-8">
              <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr] lg:items-center">
                <div className="flex items-center gap-5">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#7B5342] text-[38px] font-medium text-white">
                    {initial}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-[25px] font-semibold tracking-[-0.04em]">
                      {displayName}
                    </div>
                    <div className="mt-1 text-[14px] text-black/45">{user.email}</div>
                    <div className="mt-1 flex items-center gap-1.5 text-[13px] text-black/50">
                      <span className={user.emailVerified ? 'h-2 w-2 rounded-full bg-emerald-500' : 'h-2 w-2 rounded-full bg-black/20'} />
                      {user.emailVerified ? 'Email verified' : 'Email not verified'}
                    </div>
                    <div className="mt-3 inline-flex rounded-[10px] bg-black/[0.04] px-3 py-1.5 text-[12px] font-medium">
                      {planLabel}
                    </div>
                  </div>

                  <button
                    onClick={() => router.push('/settings/account')}
                    className="hidden items-center gap-3 rounded-[14px] border border-black/[0.055] bg-white px-5 py-3 text-[14px] font-medium sm:inline-flex"
                  >
                    Manage account
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3 border-black/[0.055] lg:border-l lg:pl-8">
                  <ProfileStat icon={<MessageCircle />} value={stats.conversations} label="Conversations" sub="Total" />
                  <ProfileStat icon={<CheckCircle2 />} value={stats.tasks} label="Tasks" sub="Completed" />
                  <ProfileStat icon={<ClockIcon />} value={stats.timeSaved} label="Time saved" sub="Estimated" />
                </div>
              </div>
            </Card>

            <div className="grid gap-6 lg:grid-cols-[1fr_1.25fr]">
              <div>
                <SectionTitle>Preferences</SectionTitle>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-2">
                  <Card>
                    <SettingsRow onClick={() => router.push('/settings/general')} icon={<Settings />} title="General" subtitle="Language, time zone, and app settings" />
                    <SettingsRow onClick={() => router.push('/settings/appearance')} icon={<Palette />} title="Appearance" subtitle="Theme, color, and display options" />
                    <SettingsRow onClick={() => router.push('/settings/notifications')} icon={<Bell />} title="Notifications" subtitle="Manage how you receive updates" />
                    <SettingsRow onClick={() => router.push('/settings/privacy')} icon={<Lock />} title="Privacy" subtitle="Control your data and visibility" />
                    <SettingsRow onClick={() => router.push('/settings/voice')} icon={<Mic />} title="Voice & speech" subtitle="Voice, language, and responses" last />
                  </Card>

                  <Card>
                    <h3 className="mb-6 text-[18px] font-semibold tracking-[-0.03em]">
                      Quick settings
                    </h3>

                    <QuickSelect icon={<Sun />} label="Theme" value={theme} values={['Light', 'Dark', 'System']} onChange={(value) => updateSetting('theme', value)} />
                    <QuickSelect icon={<Globe />} label="Language" value={language} values={['English', 'Finnish']} onChange={(value) => updateSetting('language', value)} />
                    <QuickRow icon={<User />} label="Time zone" value="Auto" />
                    <QuickSelect icon={<CalendarDays />} label="Start week on" value={weekStart} values={['Monday', 'Sunday']} onChange={(value) => updateSetting('weekStart', value)} />

                    <button
                      onClick={() => router.push('/settings/general')}
                      className="mt-5 flex w-full items-center justify-between rounded-[14px] border border-black/[0.055] bg-white px-4 py-3 text-[14px] font-medium"
                    >
                      View all general settings
                      <ChevronRight className="h-4 w-4 text-black/35" />
                    </button>
                  </Card>
                </div>
              </div>

              <div>
                <div className="flex items-end justify-between">
                  <div>
                    <SectionTitle>Integrations</SectionTitle>
                    <p className="-mt-2 mb-4 text-[13px] text-black/45">
                      Connect your favorite apps and services.
                    </p>
                  </div>

                  <button
                    onClick={() => router.push('/tools')}
                    className="mb-4 rounded-[13px] border border-black/[0.055] bg-white px-4 py-2 text-[13px] font-medium"
                  >
                    View all
                  </button>
                </div>

                <Card>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {integrations.map((item) => (
                      <IntegrationRow
                        key={item.key}
                        {...item}
                        onClick={() => router.push(item.href)}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => router.push('/tools')}
                    className="mt-5 flex w-full items-center justify-between rounded-[14px] border border-black/[0.055] bg-white px-4 py-3 text-[14px] font-medium"
                  >
                    Browse all integrations
                    <ChevronRight className="h-4 w-4 text-black/35" />
                  </button>
                </Card>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <SectionTitle>Account</SectionTitle>
                <Card>
                  <SettingsRow onClick={() => router.push('/upgrade')} icon={<Crown />} title="Plan" right={planLabel} />
                  <SettingsRow onClick={() => router.push('/settings/usage')} icon={<Zap />} title="Usage" subtitle="View your usage and limits" right={`${stats.usagePercent}% used`} />
                  <SettingsRow onClick={() => router.push('/settings/billing')} icon={<CreditCard />} title="Billing" subtitle="Manage payment and invoices" />
                  <SettingsRow onClick={() => router.push('/settings/api')} icon={<Code2 />} title="API" subtitle="Manage API keys and devices" />
                  <SettingsRow onClick={() => setConfirmAction('delete-account')} icon={<Trash2 className="text-red-500" />} title="Delete account" subtitle="Permanently delete your account" last />
                </Card>
              </div>

              <div>
                <SectionTitle>Data & memory</SectionTitle>
                <Card>
                  <SettingsRow onClick={() => router.push('/settings/memory')} icon={<Database />} title="Memory" subtitle="Manage what Kivo remembers" />
                  <SettingsRow onClick={() => router.push('/settings/data-sources')} icon={<Folder />} title="Data sources" subtitle="Connected sources and data" />
                  <SettingsRow onClick={exportData} icon={<Download />} title="Export data" subtitle="Download your data" />
                  <SettingsRow onClick={() => setConfirmAction('clear-data')} icon={<Trash2 />} title="Clear data" subtitle="Clear your data and history" />

                  <div className="mt-4 flex items-center gap-3 rounded-[16px] border border-blue-500/15 bg-blue-500/[0.035] px-4 py-3">
                    <ShieldCheck className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="text-[14px] font-semibold">Your data is private and secure.</div>
                      <div className="text-[12px] text-black/45">We never sell your data.</div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            <SectionTitle>About</SectionTitle>
            <Card>
              <div className="grid gap-0 sm:grid-cols-3 sm:divide-x sm:divide-black/[0.055]">
                <AboutItem onClick={() => router.push('/about')} icon={<KivoIcon />} title="About Kivo" subtitle="Version 1.0.0" />
                <AboutItem onClick={() => router.push('/help')} icon={<HelpCircle />} title="Help center" subtitle="Get help and support" />
                <AboutItem onClick={() => router.push('/whats-new')} icon={<Gift />} title="What’s new" subtitle="See the latest updates" />
              </div>
            </Card>

            <button
              onClick={() => router.push('/upgrade')}
              className="mx-auto mt-7 flex items-center justify-center gap-2 text-[13px] text-black/55"
            >
              <Lock className="h-4 w-4" />
              You’re on the {planLabel}
              <span className="font-medium text-indigo-600">Upgrade to unlock more</span>
            </button>
          </div>
        </section>
      </div>

      {confirmAction ? (
        <ConfirmModal
          title={confirmAction === 'clear-data' ? 'Clear your data?' : 'Delete account?'}
          desc={
            confirmAction === 'clear-data'
              ? 'This clears local Kivo history and activity data from this device.'
              : 'This action should be connected to your real account deletion flow before production.'
          }
          actionLabel={confirmAction === 'clear-data' ? 'Clear data' : 'Continue'}
          onCancel={() => setConfirmAction(null)}
          onConfirm={confirmAction === 'clear-data' ? clearData : () => router.push('/settings/delete-account')}
        />
      ) : null}
    </main>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-4 mt-9 text-[22px] font-semibold tracking-[-0.04em]">{children}</h2>;
}

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-[28px] border border-black/[0.055] bg-white/90 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.04)] ${className}`}>
      {children}
    </div>
  );
}

function ProfileStat({ icon, value, label, sub }: { icon: ReactNode; value: ReactNode; label: string; sub: string }) {
  return (
    <div>
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-[14px] bg-black/[0.035] [&>svg]:h-5 [&>svg]:w-5">
        {icon}
      </div>
      <div className="font-serif text-[30px] leading-none tracking-[-0.06em]">{value}</div>
      <div className="mt-1 text-[13px] text-black/55">{label}</div>
      <div className="text-[12px] text-black/40">{sub}</div>
    </div>
  );
}

function SettingsRow({
  icon,
  title,
  subtitle,
  right,
  last = false,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  right?: string;
  last?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-4 py-4 text-left ${last ? '' : 'border-b border-black/[0.045]'}`}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-black/[0.035] [&>svg]:h-5 [&>svg]:w-5">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[16px] font-semibold tracking-[-0.03em]">{title}</div>
        {subtitle ? <div className="mt-1 text-[13px] text-black/45">{subtitle}</div> : null}
      </div>
      {right ? <div className="text-[14px] text-black/55">{right}</div> : null}
      <ChevronRight className="h-5 w-5 text-black/35" />
    </button>
  );
}

function QuickRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 py-4">
      <div className="[&>svg]:h-5 [&>svg]:w-5">{icon}</div>
      <div className="flex-1 text-[15px] font-medium">{label}</div>
      <div className="rounded-[12px] border border-black/[0.055] bg-white px-3 py-2 text-[13px] text-black/65">
        {value}
      </div>
    </div>
  );
}

function QuickSelect({
  icon,
  label,
  value,
  values,
  onChange,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  values: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-4 py-4">
      <div className="[&>svg]:h-5 [&>svg]:w-5">{icon}</div>
      <div className="flex-1 text-[15px] font-medium">{label}</div>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-[12px] border border-black/[0.055] bg-white px-3 py-2 text-[13px] outline-none"
      >
        {values.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
      <ChevronDown className="hidden h-4 w-4 text-black/35" />
    </div>
  );
}

function IntegrationRow({
  icon,
  title,
  subtitle,
  connected,
  onClick,
}: Integration & {
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-4 rounded-[20px] border border-black/[0.045] bg-white px-4 py-4 text-left shadow-[0_8px_22px_rgba(15,23,42,0.018)]"
    >
      <div className="flex h-13 w-13 items-center justify-center rounded-[16px] border border-black/[0.055] bg-white shadow-[0_8px_18px_rgba(15,23,42,0.035)]">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-semibold tracking-[-0.03em]">{title}</div>
        <div className="mt-1 text-[12px] text-black/42">{subtitle}</div>
        <div className="mt-1 flex items-center gap-1.5 text-[12px] text-black/45">
          <span className={connected ? 'h-2 w-2 rounded-full bg-[#22C55E]' : 'h-2 w-2 rounded-full bg-black/20'} />
          {connected ? 'Connected' : 'Not connected'}
        </div>
      </div>

      {connected ? (
        <ChevronRight className="h-5 w-5 text-black/35" />
      ) : (
        <span className="rounded-[12px] bg-[#111318] px-4 py-2 text-[13px] font-medium text-white">
          Connect
        </span>
      )}
    </button>
  );
}

function AboutItem({ icon, title, subtitle, onClick }: { icon: ReactNode; title: string; subtitle: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-4 px-5 py-4 text-left">
      <div className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-black/[0.035] [&>svg]:h-5 [&>svg]:w-5">
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-[15px] font-semibold">{title}</div>
        <div className="mt-1 text-[12px] text-black/45">{subtitle}</div>
      </div>
      <ChevronRight className="h-5 w-5 text-black/35" />
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
          <button onClick={onCancel} className="rounded-[16px] bg-black/[0.045] px-4 py-3 text-[14px] font-medium">
            Cancel
          </button>
          <button onClick={onConfirm} className="rounded-[16px] bg-[#111318] px-4 py-3 text-[14px] font-medium text-white">
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function ClockIcon() {
  return <Clock3 />;
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
      <path fill="#4285F4" d="M2.5 13.6h10.9l-2.2 3.9H4.7l-2.2-3.9Z" />
    </svg>
  );
}

function GoogleCalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7">
      <rect x="4" y="4" width="16" height="16" rx="3" fill="#fff" />
      <path fill="#4285F4" d="M4 8a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2H4V8Z" />
      <path fill="#EA4335" d="M4 9h16v1.3H4z" />
      <text x="12" y="17" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#4285F4">31</text>
    </svg>
  );
}

function BrowserIcon() {
  return <Globe className="h-7 w-7 text-blue-500" />;
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.52 2.87 8.36 6.84 9.72.5.1.68-.22.68-.49v-1.9c-2.78.62-3.37-1.22-3.37-1.22-.45-1.18-1.1-1.49-1.1-1.49-.9-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05A9.3 9.3 0 0 1 12 6.98c.85 0 1.7.12 2.5.34 1.9-1.33 2.74-1.05 2.74-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9v2.8c0 .27.18.6.69.49A10.1 10.1 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z" />
    </svg>
  );
}

function OutlookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7">
      <path fill="#0078D4" d="M3 6.5 11 5v14l-8-1.5v-11Z" />
      <path fill="#28A8EA" d="M11 7h9v10h-9V7Z" />
      <path fill="#fff" d="M7.1 9.2c-1.5 0-2.5 1.2-2.5 2.8s1 2.8 2.5 2.8 2.5-1.2 2.5-2.8-1-2.8-2.5-2.8Zm0 1.2c.7 0 1.1.6 1.1 1.6s-.4 1.6-1.1 1.6S6 13 6 12s.4-1.6 1.1-1.6Z" />
    </svg>
  );
}
