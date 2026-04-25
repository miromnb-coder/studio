'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  AppWindow,
  Calendar,
  ChevronLeft,
  Download,
  Github,
  Mail,
  RefreshCcw,
  Shield,
  Search,
  Wrench,
} from 'lucide-react';

import KivoChatHeader from '@/components/chat/kivo/KivoChatHeader';
import {
  KivoChatSidebarArea,
  KIVO_CHAT_SIDEBAR_RAIL_WIDTH,
} from '@/components/chat/kivo/KivoChatSidebarArea';

const SIDEBAR_GAP = 12;

type SourceKey = 'gmail' | 'google-calendar' | 'browser-search' | 'drive' | 'github' | 'outlook';

type SourceDefinition = {
  key: SourceKey;
  title: string;
  description: string;
  icon: ReactNode;
  route: string;
};

const sources: SourceDefinition[] = [
  { key: 'gmail', title: 'Gmail', description: 'Email, receipts, subscriptions', icon: <Mail />, route: '/actions?tool=gmail' },
  { key: 'google-calendar', title: 'Google Calendar', description: 'Events, meetings, planning', icon: <Calendar />, route: '/actions?tool=google-calendar' },
  { key: 'browser-search', title: 'Browser Search', description: 'Web research and live info', icon: <Search />, route: '/tools?tool=browser-search' },
  { key: 'drive', title: 'Google Drive', description: 'Files and documents', icon: <AppWindow />, route: '/tools?source=drive' },
  { key: 'github', title: 'GitHub', description: 'Repositories and code', icon: <Github />, route: '/tools?tool=github' },
  { key: 'outlook', title: 'Outlook', description: 'Email and calendar', icon: <Mail />, route: '/tools?tool=outlook' },
];

export default function DataSourcesPage() {
  const router = useRouter();

  const [showSidebarRail, setShowSidebarRail] = useState(false);
  const [connectedMap, setConnectedMap] = useState<Record<string, boolean>>({});
  const [syncStatus, setSyncStatus] = useState('Idle');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const [allowDataRead, setAllowDataRead] = useState(false);
  const [allowDataSummary, setAllowDataSummary] = useState(false);
  const [allowDataMemory, setAllowDataMemory] = useState(false);

  const contentLeftOffset = showSidebarRail ? KIVO_CHAT_SIDEBAR_RAIL_WIDTH + SIDEBAR_GAP : 0;

  useEffect(() => {
    try {
      setAllowDataRead(localStorage.getItem('kivo.settings.allowDataRead') === 'true');
      setAllowDataSummary(localStorage.getItem('kivo.settings.allowDataSummary') === 'true');
      setAllowDataMemory(localStorage.getItem('kivo.settings.allowDataMemory') === 'true');

      const rawSources = localStorage.getItem('kivo.dataSources');
      const parsed = rawSources ? JSON.parse(rawSources) : {};
      const connected = parsed?.connected && typeof parsed.connected === 'object' ? parsed.connected : {};
      setConnectedMap(connected);
      setSyncStatus(typeof parsed?.syncStatus === 'string' ? parsed.syncStatus : 'Idle');
      setLastUpdated(typeof parsed?.lastUpdated === 'string' ? parsed.lastUpdated : null);
    } catch {
      setConnectedMap({});
      setSyncStatus('Idle');
      setLastUpdated(null);
    }
  }, []);

  const connectedCount = useMemo(
    () => sources.filter((source) => Boolean(connectedMap[source.key])).length,
    [connectedMap],
  );

  function saveToggle(key: 'allowDataRead' | 'allowDataSummary' | 'allowDataMemory', value: boolean) {
    localStorage.setItem(`kivo.settings.${key}`, String(value));
    if (key === 'allowDataRead') setAllowDataRead(value);
    if (key === 'allowDataSummary') setAllowDataSummary(value);
    if (key === 'allowDataMemory') setAllowDataMemory(value);
  }

  function refreshSources() {
    const now = new Date().toISOString();
    localStorage.setItem('kivo.dataSources.lastRefresh', now);
    setLastUpdated(now);
    setSyncStatus('Synced now');
  }

  function exportSources() {
    const data = {
      connected: connectedMap,
      permissions: { allowDataRead, allowDataSummary, allowDataMemory },
      syncStatus,
      lastUpdated,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kivo-data-sources-export.json';
    a.click();
    URL.revokeObjectURL(url);
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

      <div className="min-h-[100dvh] transition-[padding-left] duration-300 ease-out" style={{ paddingLeft: contentLeftOffset }}>
        <div className="sticky top-0 z-40 border-b border-black/[0.035] bg-white/82 backdrop-blur-2xl">
          <KivoChatHeader
            hasMessages={false}
            isSidebarOpen={showSidebarRail}
            onSidebarToggle={() => setShowSidebarRail((open) => !open)}
          />
        </div>

        <section className="px-4 pb-28 pt-7 sm:px-5">
          <div className="mx-auto max-w-[980px]">
            <button onClick={() => router.push('/settings')} className="mb-6 inline-flex items-center gap-2 rounded-[14px] border border-black/[0.055] bg-white px-4 py-2.5 text-[13px] font-medium shadow-[0_8px_22px_rgba(15,23,42,0.025)]">
              <ChevronLeft className="h-4 w-4" />
              Back to Settings
            </button>

            <div className="mb-7">
              <h1 className="font-serif text-[44px] leading-none tracking-[-0.06em]">Data Sources</h1>
              <p className="mt-2 text-[16px] text-black/50">Control which apps and data Kivo can use.</p>
            </div>

            <Card>
              <SectionHeader title="Data source status" subtitle="Overview of your current source connections." />
              <div className="grid gap-3 sm:grid-cols-3">
                <StatusPill label="Connected sources" value={String(connectedCount)} />
                <StatusPill label="Sync status" value={syncStatus} />
                <StatusPill label="Last updated" value={lastUpdated ? formatDate(lastUpdated) : 'No updates yet'} />
              </div>
              {connectedCount === 0 ? (
                <div className="mt-4 rounded-[18px] border border-black/[0.055] bg-black/[0.02] px-4 py-3 text-[13px] text-black/55">No sources connected yet</div>
              ) : null}
            </Card>

            <Card>
              <SectionHeader title="Connected sources / Available sources" subtitle="Connect and manage apps Kivo can access." />
              <div className="grid gap-3 sm:grid-cols-2">
                {sources.map((source) => {
                  const connected = Boolean(connectedMap[source.key]);
                  return (
                    <div key={source.key} className="rounded-[20px] border border-black/[0.055] bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.018)]">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-black/[0.035] [&>svg]:h-5 [&>svg]:w-5">{source.icon}</div>
                          <div>
                            <div className="text-[15px] font-semibold tracking-[-0.03em]">{source.title}</div>
                            <p className="mt-1 text-[12px] leading-[1.35] text-black/45">{source.description}</p>
                          </div>
                        </div>
                        <span className={["rounded-full px-2.5 py-1 text-[11px] font-medium", connected ? 'bg-emerald-500/15 text-emerald-700' : 'bg-black/[0.045] text-black/60'].join(' ')}>
                          {connected ? 'Connected' : 'Not connected'}
                        </span>
                      </div>
                      <button onClick={() => router.push(source.route)} className="mt-4 w-full rounded-[14px] border border-black/[0.055] bg-white px-4 py-2.5 text-[13px] font-medium">
                        {connected ? 'Manage' : 'Connect'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card>
              <SectionHeader title="Data permissions" subtitle="Set what Kivo can do with connected data." />
              <ToggleRow icon={<Shield />} title="Allow Kivo to read connected data" checked={allowDataRead} onClick={() => saveToggle('allowDataRead', !allowDataRead)} />
              <ToggleRow icon={<Search />} title="Allow Kivo to summarize connected data" checked={allowDataSummary} onClick={() => saveToggle('allowDataSummary', !allowDataSummary)} />
              <ToggleRow icon={<Wrench />} title="Allow Kivo to use data for memory" checked={allowDataMemory} onClick={() => saveToggle('allowDataMemory', !allowDataMemory)} last />
            </Card>

            <Card>
              <SectionHeader title="Actions" subtitle="Refresh, export, or manage tools." />
              <div className="grid gap-3 sm:grid-cols-3">
                <ActionButton icon={<RefreshCcw />} label="Refresh sources" onClick={refreshSources} />
                <ActionButton icon={<Download />} label="Export sources" onClick={exportSources} />
                <ActionButton icon={<Wrench />} label="Open tools" onClick={() => router.push('/tools')} />
              </div>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(Number(date))) return 'Unknown';
  return date.toLocaleString();
}

function Card({ children }: { children: ReactNode }) {
  return <div className="mb-5 rounded-[28px] border border-black/[0.055] bg-white/90 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.04)]">{children}</div>;
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-[18px] font-semibold tracking-[-0.035em]">{title}</h2>
      <p className="mt-1 text-[13px] text-black/45">{subtitle}</p>
    </div>
  );
}

function ToggleRow({ icon, title, checked, onClick, last = false }: { icon: ReactNode; title: string; checked: boolean; onClick: () => void; last?: boolean }) {
  return (
    <button onClick={onClick} className={["flex w-full items-center gap-4 py-4 text-left", last ? '' : 'border-b border-black/[0.045]'].join(' ')}>
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-black/[0.035] [&>svg]:h-5 [&>svg]:w-5">{icon}</div>
      <div className="min-w-0 flex-1 text-[15px] font-semibold tracking-[-0.03em]">{title}</div>
      <span className={["relative h-7 w-12 rounded-full transition", checked ? 'bg-[#111318]' : 'bg-black/10'].join(' ')}>
        <span className={["absolute top-1 h-5 w-5 rounded-full bg-white transition", checked ? 'left-6' : 'left-1'].join(' ')} />
      </span>
    </button>
  );
}

function ActionButton({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex items-center justify-center gap-3 rounded-[17px] border border-black/[0.055] bg-white px-5 py-4 text-[14px] font-medium shadow-[0_8px_22px_rgba(15,23,42,0.018)]">
      <span className="[&>svg]:h-5 [&>svg]:w-5">{icon}</span>
      {label}
    </button>
  );
}

function StatusPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-black/[0.055] bg-white px-4 py-3">
      <div className="text-[12px] text-black/45">{label}</div>
      <div className="mt-1 text-[16px] font-semibold tracking-[-0.03em]">{value}</div>
    </div>
  );
}
