'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Globe, Monitor, RotateCcw, Save, Settings2 } from 'lucide-react';

import KivoChatHeader from '@/components/chat/kivo/KivoChatHeader';
import { KivoChatSidebarArea, KIVO_CHAT_SIDEBAR_RAIL_WIDTH } from '@/components/chat/kivo/KivoChatSidebarArea';

const SIDEBAR_GAP = 12;

const defaults = {
  language: 'English',
  timezone: 'Auto',
  weekStart: 'Monday',
  dateFormat: 'DD/MM/YYYY',
  units: 'Metric',
  openInChat: true,
  showSuggestions: true,
  sidebarClosed: false,
};

export default function GeneralSettingsPage() {
  const router = useRouter();

  const [showSidebarRail, setShowSidebarRail] = useState(false);
  const [language, setLanguage] = useState(defaults.language);
  const [timezone, setTimezone] = useState(defaults.timezone);
  const [weekStart, setWeekStart] = useState(defaults.weekStart);
  const [dateFormat, setDateFormat] = useState(defaults.dateFormat);
  const [units, setUnits] = useState(defaults.units);
  const [openInChat, setOpenInChat] = useState(defaults.openInChat);
  const [showSuggestions, setShowSuggestions] = useState(defaults.showSuggestions);
  const [sidebarClosed, setSidebarClosed] = useState(defaults.sidebarClosed);

  const contentLeftOffset = showSidebarRail ? KIVO_CHAT_SIDEBAR_RAIL_WIDTH + SIDEBAR_GAP : 0;

  useEffect(() => {
    setLanguage(localStorage.getItem('kivo.settings.language') || defaults.language);
    setTimezone(localStorage.getItem('kivo.settings.timezone') || defaults.timezone);
    setWeekStart(localStorage.getItem('kivo.settings.weekStart') || defaults.weekStart);
    setDateFormat(localStorage.getItem('kivo.settings.dateFormat') || defaults.dateFormat);
    setUnits(localStorage.getItem('kivo.settings.units') || defaults.units);
    setOpenInChat(localStorage.getItem('kivo.settings.openInChat') !== 'false');
    setShowSuggestions(localStorage.getItem('kivo.settings.showSuggestions') !== 'false');
    setSidebarClosed(localStorage.getItem('kivo.settings.sidebarClosed') === 'true');
  }, []);

  function saveAll() {
    localStorage.setItem('kivo.settings.language', language);
    localStorage.setItem('kivo.settings.timezone', timezone);
    localStorage.setItem('kivo.settings.weekStart', weekStart);
    localStorage.setItem('kivo.settings.dateFormat', dateFormat);
    localStorage.setItem('kivo.settings.units', units);
    localStorage.setItem('kivo.settings.openInChat', String(openInChat));
    localStorage.setItem('kivo.settings.showSuggestions', String(showSuggestions));
    localStorage.setItem('kivo.settings.sidebarClosed', String(sidebarClosed));
  }

  function resetAll() {
    setLanguage(defaults.language);
    setTimezone(defaults.timezone);
    setWeekStart(defaults.weekStart);
    setDateFormat(defaults.dateFormat);
    setUnits(defaults.units);
    setOpenInChat(defaults.openInChat);
    setShowSuggestions(defaults.showSuggestions);
    setSidebarClosed(defaults.sidebarClosed);
    localStorage.setItem('kivo.settings.language', defaults.language);
    localStorage.setItem('kivo.settings.timezone', defaults.timezone);
    localStorage.setItem('kivo.settings.weekStart', defaults.weekStart);
    localStorage.setItem('kivo.settings.dateFormat', defaults.dateFormat);
    localStorage.setItem('kivo.settings.units', defaults.units);
    localStorage.setItem('kivo.settings.openInChat', String(defaults.openInChat));
    localStorage.setItem('kivo.settings.showSuggestions', String(defaults.showSuggestions));
    localStorage.setItem('kivo.settings.sidebarClosed', String(defaults.sidebarClosed));
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
          <KivoChatHeader hasMessages={false} isSidebarOpen={showSidebarRail} onSidebarToggle={() => setShowSidebarRail((open) => !open)} />
        </div>
        <section className="px-4 pb-28 pt-7 sm:px-5">
          <div className="mx-auto max-w-[980px]">
            <button onClick={() => router.push('/settings')} className="mb-6 inline-flex items-center gap-2 rounded-[14px] border border-black/[0.055] bg-white px-4 py-2.5 text-[13px] font-medium shadow-[0_8px_22px_rgba(15,23,42,0.025)]"><ChevronLeft className="h-4 w-4" />Back to Settings</button>

            <div className="mb-7">
              <h1 className="font-serif text-[44px] leading-none tracking-[-0.06em]">General</h1>
              <p className="mt-2 text-[16px] text-black/50">Manage your language, region, and app behavior.</p>
            </div>

            <Card>
              <SectionHeader title="App settings" subtitle="Configure language, date and region defaults." />
              <SelectRow icon={<Globe />} label="Language" value={language} onChange={setLanguage} options={['English', 'Finnish']} />
              <SelectRow icon={<Monitor />} label="Time zone" value={timezone} onChange={setTimezone} options={['Auto', 'Helsinki', 'UTC']} />
              <SelectRow icon={<Settings2 />} label="Start week on" value={weekStart} onChange={setWeekStart} options={['Monday', 'Sunday']} />
              <SelectRow icon={<Settings2 />} label="Date format" value={dateFormat} onChange={setDateFormat} options={['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']} />
              <SelectRow icon={<Settings2 />} label="Units" value={units} onChange={setUnits} options={['Metric', 'Imperial']} last />
            </Card>

            <Card>
              <SectionHeader title="Startup behavior" subtitle="Control how Kivo opens and behaves by default." />
              <ToggleRow icon={<Monitor />} title="Open Kivo in chat" checked={openInChat} onClick={() => setOpenInChat((v) => !v)} />
              <ToggleRow icon={<Settings2 />} title="Show suggestions when chat is empty" checked={showSuggestions} onClick={() => setShowSuggestions((v) => !v)} />
              <ToggleRow icon={<Settings2 />} title="Keep sidebar closed by default" checked={sidebarClosed} onClick={() => setSidebarClosed((v) => !v)} last />
            </Card>

            <Card>
              <SectionHeader title="Actions" subtitle="Persist or reset your general preferences." />
              <div className="grid gap-3 sm:grid-cols-2">
                <ActionButton icon={<Save />} label="Save general settings" onClick={saveAll} />
                <ActionButton icon={<RotateCcw />} label="Reset general settings" onClick={resetAll} />
              </div>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
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

function SelectRow({ icon, label, value, onChange, options, last = false }: { icon: ReactNode; label: string; value: string; onChange: (v: string) => void; options: string[]; last?: boolean }) {
  return (
    <div className={["flex items-center gap-4 py-4", last ? '' : 'border-b border-black/[0.045]'].join(' ')}>
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-black/[0.035] [&>svg]:h-5 [&>svg]:w-5">{icon}</div>
      <div className="flex-1">
        <div className="text-[15px] font-semibold tracking-[-0.03em]">{label}</div>
      </div>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="rounded-[12px] border border-black/[0.08] bg-white px-3 py-2 text-[13px]">
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}

function ToggleRow({ icon, title, checked, onClick, last = false }: { icon: ReactNode; title: string; checked: boolean; onClick: () => void; last?: boolean }) {
  return (
    <button onClick={onClick} className={["flex w-full items-center gap-4 py-4 text-left", last ? '' : 'border-b border-black/[0.045]'].join(' ')}>
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-black/[0.035] [&>svg]:h-5 [&>svg]:w-5">{icon}</div>
      <div className="min-w-0 flex-1 text-[15px] font-semibold tracking-[-0.03em]">{title}</div>
      <span className={["relative h-7 w-12 rounded-full transition", checked ? 'bg-[#111318]' : 'bg-black/10'].join(' ')}><span className={["absolute top-1 h-5 w-5 rounded-full bg-white transition", checked ? 'left-6' : 'left-1'].join(' ')} /></span>
    </button>
  );
}

function ActionButton({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return <button onClick={onClick} className="inline-flex items-center justify-center gap-3 rounded-[17px] border border-black/[0.055] bg-white px-5 py-4 text-[14px] font-medium shadow-[0_8px_22px_rgba(15,23,42,0.018)]"><span className="[&>svg]:h-5 [&>svg]:w-5">{icon}</span>{label}</button>;
}
