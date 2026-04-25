'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, ChevronLeft, Clock3, RotateCcw, Save, Send } from 'lucide-react';

import KivoChatHeader from '@/components/chat/kivo/KivoChatHeader';
import { KivoChatSidebarArea, KIVO_CHAT_SIDEBAR_RAIL_WIDTH } from '@/components/chat/kivo/KivoChatSidebarArea';

const SIDEBAR_GAP = 12;

const defaults = {
  push: false,
  email: false,
  dailySummary: false,
  smartReminders: false,
  moneyAlerts: false,
  calendarAlerts: false,
  agentAlerts: false,
  quietHours: false,
  quietStart: '22:00',
  quietEnd: '07:00',
};

export default function NotificationsPage() {
  const router = useRouter();

  const [showSidebarRail, setShowSidebarRail] = useState(false);
  const [settings, setSettings] = useState(defaults);
  const [testReady, setTestReady] = useState(false);

  const contentLeftOffset = showSidebarRail ? KIVO_CHAT_SIDEBAR_RAIL_WIDTH + SIDEBAR_GAP : 0;

  useEffect(() => {
    setSettings({
      push: localStorage.getItem('kivo.notifications.push') === 'true',
      email: localStorage.getItem('kivo.notifications.email') === 'true',
      dailySummary: localStorage.getItem('kivo.notifications.dailySummary') === 'true',
      smartReminders: localStorage.getItem('kivo.notifications.smartReminders') === 'true',
      moneyAlerts: localStorage.getItem('kivo.notifications.moneyAlerts') === 'true',
      calendarAlerts: localStorage.getItem('kivo.notifications.calendarAlerts') === 'true',
      agentAlerts: localStorage.getItem('kivo.notifications.agentAlerts') === 'true',
      quietHours: localStorage.getItem('kivo.notifications.quietHours') === 'true',
      quietStart: localStorage.getItem('kivo.notifications.quietStart') || defaults.quietStart,
      quietEnd: localStorage.getItem('kivo.notifications.quietEnd') || defaults.quietEnd,
    });
  }, []);

  function setField<K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    localStorage.setItem(`kivo.notifications.${key}`, String(value));
  }

  function saveAll() {
    Object.entries(settings).forEach(([key, value]) => {
      localStorage.setItem(`kivo.notifications.${key}`, String(value));
    });
  }

  function resetAll() {
    setSettings(defaults);
    Object.entries(defaults).forEach(([key, value]) => {
      localStorage.setItem(`kivo.notifications.${key}`, String(value));
    });
  }

  function sendTest() {
    setTestReady(true);
    window.setTimeout(() => setTestReady(false), 2500);
  }

  const notificationsEnabled = settings.push || settings.email;

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
              <h1 className="font-serif text-[44px] leading-none tracking-[-0.06em]">Notifications</h1>
              <p className="mt-2 text-[16px] text-black/50">Choose how Kivo keeps you updated.</p>
            </div>

            <Card>
              <SectionHeader title="Notification status" subtitle="Current notification delivery state." />
              <div className="grid gap-3 sm:grid-cols-2">
                <StatusPill label="Notifications" value={notificationsEnabled ? 'Enabled' : 'Off'} />
                <StatusPill label="Daily summary" value={settings.dailySummary ? 'Enabled' : 'Off'} />
              </div>
            </Card>

            <Card>
              <SectionHeader title="Notification controls" subtitle="Manage delivery channels and alert types." />
              <ToggleRow icon={<Bell />} title="Push notifications" checked={settings.push} onClick={() => setField('push', !settings.push)} />
              <ToggleRow icon={<Bell />} title="Email notifications" checked={settings.email} onClick={() => setField('email', !settings.email)} />
              <ToggleRow icon={<Bell />} title="Daily summary" checked={settings.dailySummary} onClick={() => setField('dailySummary', !settings.dailySummary)} />
              <ToggleRow icon={<Bell />} title="Smart reminders" checked={settings.smartReminders} onClick={() => setField('smartReminders', !settings.smartReminders)} />
              <ToggleRow icon={<Bell />} title="Money alerts" checked={settings.moneyAlerts} onClick={() => setField('moneyAlerts', !settings.moneyAlerts)} />
              <ToggleRow icon={<Bell />} title="Calendar alerts" checked={settings.calendarAlerts} onClick={() => setField('calendarAlerts', !settings.calendarAlerts)} />
              <ToggleRow icon={<Bell />} title="Agent completion alerts" checked={settings.agentAlerts} onClick={() => setField('agentAlerts', !settings.agentAlerts)} last />
            </Card>

            <Card>
              <SectionHeader title="Quiet hours" subtitle="Silence alerts during your off-time." />
              <ToggleRow icon={<Clock3 />} title="Quiet hours on/off" checked={settings.quietHours} onClick={() => setField('quietHours', !settings.quietHours)} />
              <TimeRow label="Start time" value={settings.quietStart} onChange={(value) => setField('quietStart', value)} />
              <TimeRow label="End time" value={settings.quietEnd} onChange={(value) => setField('quietEnd', value)} last />
            </Card>

            <Card>
              <SectionHeader title="Actions" subtitle="Test, save, or reset notification settings." />
              <div className="grid gap-3 sm:grid-cols-3">
                <ActionButton icon={<Send />} label="Send test notification" onClick={sendTest} />
                <ActionButton icon={<Save />} label="Save notification settings" onClick={saveAll} />
                <ActionButton icon={<RotateCcw />} label="Reset notifications" onClick={resetAll} />
              </div>
              {testReady ? <div className="mt-4 rounded-[16px] border border-black/[0.055] bg-black/[0.02] px-4 py-3 text-[13px]">Test notification ready</div> : null}
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
  return <div className="mb-5"><h2 className="text-[18px] font-semibold tracking-[-0.035em]">{title}</h2><p className="mt-1 text-[13px] text-black/45">{subtitle}</p></div>;
}
function ToggleRow({ icon, title, checked, onClick, last = false }: { icon: ReactNode; title: string; checked: boolean; onClick: () => void; last?: boolean }) {
  return <button onClick={onClick} className={["flex w-full items-center gap-4 py-4 text-left", last ? '' : 'border-b border-black/[0.045]'].join(' ')}><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-black/[0.035] [&>svg]:h-5 [&>svg]:w-5">{icon}</div><div className="min-w-0 flex-1 text-[15px] font-semibold tracking-[-0.03em]">{title}</div><span className={["relative h-7 w-12 rounded-full transition", checked ? 'bg-[#111318]' : 'bg-black/10'].join(' ')}><span className={["absolute top-1 h-5 w-5 rounded-full bg-white transition", checked ? 'left-6' : 'left-1'].join(' ')} /></span></button>;
}
function TimeRow({ label, value, onChange, last = false }: { label: string; value: string; onChange: (value: string) => void; last?: boolean }) {
  return <div className={["flex items-center justify-between gap-3 py-4", last ? '' : 'border-b border-black/[0.045]'].join(' ')}><div className="text-[15px] font-semibold tracking-[-0.03em]">{label}</div><input type="time" value={value} onChange={(event) => onChange(event.target.value)} className="rounded-[12px] border border-black/[0.08] bg-white px-3 py-2 text-[13px]" /></div>;
}
function ActionButton({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return <button onClick={onClick} className="inline-flex items-center justify-center gap-3 rounded-[17px] border border-black/[0.055] bg-white px-5 py-4 text-[14px] font-medium shadow-[0_8px_22px_rgba(15,23,42,0.018)]"><span className="[&>svg]:h-5 [&>svg]:w-5">{icon}</span>{label}</button>;
}
function StatusPill({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[18px] border border-black/[0.055] bg-white px-4 py-3"><div className="text-[12px] text-black/45">{label}</div><div className="mt-1 text-[16px] font-semibold tracking-[-0.03em]">{value}</div></div>;
}
