'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Check,
  ChevronLeft,
  Circle,
  Menu,
  Mic,
  Monitor,
  Moon,
  Palette,
  RotateCcw,
  Settings,
  SlidersHorizontal,
  Sun,
  Type,
} from 'lucide-react';

import KivoChatHeader from '@/components/chat/kivo/KivoChatHeader';
import {
  KivoChatSidebarArea,
  KIVO_CHAT_SIDEBAR_RAIL_WIDTH,
} from '@/components/chat/kivo/KivoChatSidebarArea';

const SIDEBAR_GAP = 12;

const accentColors = [
  { name: 'Purple', value: '#7C3AED' },
  { name: 'Blue', value: '#2563EB' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Green', value: '#10B981' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Pink', value: '#EC4899' },
];

export default function AppearancePage() {
  const router = useRouter();
  const [showSidebarRail, setShowSidebarRail] = useState(false);

  const [theme, setTheme] = useState('Light');
  const [accent, setAccent] = useState('#7C3AED');
  const [density, setDensity] = useState('Comfortable');
  const [motion, setMotion] = useState(true);
  const [blur, setBlur] = useState(true);
  const [fontSize, setFontSize] = useState('Default');
  const [saved, setSaved] = useState(false);

  const contentLeftOffset = showSidebarRail
    ? KIVO_CHAT_SIDEBAR_RAIL_WIDTH + SIDEBAR_GAP
    : 0;

  useEffect(() => {
    setTheme(localStorage.getItem('kivo.settings.theme') || 'Light');
    setAccent(localStorage.getItem('kivo.settings.accent') || '#7C3AED');
    setDensity(localStorage.getItem('kivo.settings.density') || 'Comfortable');
    setMotion(localStorage.getItem('kivo.settings.motion') !== 'false');
    setBlur(localStorage.getItem('kivo.settings.blur') !== 'false');
    setFontSize(localStorage.getItem('kivo.settings.fontSize') || 'Default');
  }, []);

  function saveAppearance() {
    localStorage.setItem('kivo.settings.theme', theme);
    localStorage.setItem('kivo.settings.accent', accent);
    localStorage.setItem('kivo.settings.density', density);
    localStorage.setItem('kivo.settings.motion', String(motion));
    localStorage.setItem('kivo.settings.blur', String(blur));
    localStorage.setItem('kivo.settings.fontSize', fontSize);

    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  }

  function resetDefaults() {
    setTheme('Light');
    setAccent('#7C3AED');
    setDensity('Comfortable');
    setMotion(true);
    setBlur(true);
    setFontSize('Default');

    localStorage.setItem('kivo.settings.theme', 'Light');
    localStorage.setItem('kivo.settings.accent', '#7C3AED');
    localStorage.setItem('kivo.settings.density', 'Comfortable');
    localStorage.setItem('kivo.settings.motion', 'true');
    localStorage.setItem('kivo.settings.blur', 'true');
    localStorage.setItem('kivo.settings.fontSize', 'Default');
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
          <div className="mx-auto max-w-[980px]">
            <button
              onClick={() => router.push('/settings')}
              className="mb-6 inline-flex items-center gap-2 rounded-[14px] border border-black/[0.055] bg-white px-4 py-2.5 text-[13px] font-medium shadow-[0_8px_22px_rgba(15,23,42,0.025)]"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Settings
            </button>

            <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="font-serif text-[44px] leading-none tracking-[-0.06em]">
                  Appearance
                </h1>
                <p className="mt-2 text-[16px] text-black/50">
                  Customize how Kivo looks and feels.
                </p>
              </div>

              <div className="rounded-[18px] border border-black/[0.055] bg-white px-4 py-3 shadow-[0_10px_26px_rgba(15,23,42,0.025)]">
                <div className="flex items-center gap-2 text-[13px] font-medium">
                  <Palette className="h-4 w-4" />
                  Live preview
                </div>
                <p className="mt-1 text-[12px] text-black/45">
                  Changes are shown below.
                </p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
              <Card className="hidden self-start lg:block">
                <div className="mb-5 text-[12px] font-semibold uppercase tracking-[0.12em] text-black/38">
                  Preferences
                </div>
                <SideItem active icon={<Palette />} title="Appearance" subtitle="Theme, color, display" />
                <SideItem icon={<Settings />} title="General" subtitle="Language and timezone" />
                <SideItem icon={<Bell />} title="Notifications" subtitle="Alerts and updates" />
                <SideItem icon={<Mic />} title="Voice & speech" subtitle="Voice responses" />
              </Card>

              <div className="space-y-5">
                <Card>
                  <SectionHeader
                    title="Theme"
                    subtitle="Choose how Kivo looks across your devices."
                  />

                  <div className="grid gap-3 sm:grid-cols-3">
                    <ChoiceCard
                      active={theme === 'Light'}
                      icon={<Sun />}
                      title="Light"
                      subtitle="Clean and bright"
                      onClick={() => setTheme('Light')}
                      accent={accent}
                    />
                    <ChoiceCard
                      active={theme === 'Dark'}
                      icon={<Moon />}
                      title="Dark"
                      subtitle="Easy on the eyes"
                      onClick={() => setTheme('Dark')}
                      accent={accent}
                    />
                    <ChoiceCard
                      active={theme === 'System'}
                      icon={<Monitor />}
                      title="System"
                      subtitle="Match your device"
                      onClick={() => setTheme('System')}
                      accent={accent}
                    />
                  </div>
                </Card>

                <Card>
                  <SectionHeader
                    title="Accent color"
                    subtitle="Choose your favorite Kivo highlight color."
                  />

                  <div className="flex flex-wrap gap-3">
                    {accentColors.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setAccent(color.value)}
                        className="flex h-11 w-11 items-center justify-center rounded-full border border-black/[0.06]"
                        style={{ backgroundColor: color.value }}
                        aria-label={color.name}
                      >
                        {accent === color.value ? (
                          <Check className="h-5 w-5 text-white" />
                        ) : null}
                      </button>
                    ))}
                  </div>
                </Card>

                <Card>
                  <SectionHeader
                    title="Interface density"
                    subtitle="Adjust spacing and layout density."
                  />

                  <div className="grid gap-3 sm:grid-cols-2">
                    <ChoiceCard
                      active={density === 'Comfortable'}
                      icon={<SlidersHorizontal />}
                      title="Comfortable"
                      subtitle="More spacing, easier to read"
                      onClick={() => setDensity('Comfortable')}
                      accent={accent}
                    />
                    <ChoiceCard
                      active={density === 'Compact'}
                      icon={<Menu />}
                      title="Compact"
                      subtitle="More content, less spacing"
                      onClick={() => setDensity('Compact')}
                      accent={accent}
                    />
                  </div>
                </Card>

                <div className="grid gap-5 sm:grid-cols-2">
                  <ToggleCard
                    title="Motion effects"
                    subtitle="Smooth transitions and animations."
                    checked={motion}
                    onClick={() => setMotion((value) => !value)}
                    accent={accent}
                  />
                  <ToggleCard
                    title="Glass blur"
                    subtitle="Frosted glass backgrounds."
                    checked={blur}
                    onClick={() => setBlur((value) => !value)}
                    accent={accent}
                  />
                </div>

                <Card>
                  <SectionHeader
                    title="Typography"
                    subtitle="Adjust text size across the interface."
                  />

                  <div className="grid gap-3 sm:grid-cols-3">
                    <FontChoice
                      active={fontSize === 'Small'}
                      title="Small"
                      subtitle="Smaller text"
                      onClick={() => setFontSize('Small')}
                      accent={accent}
                    />
                    <FontChoice
                      active={fontSize === 'Default'}
                      title="Default"
                      subtitle="Recommended"
                      onClick={() => setFontSize('Default')}
                      accent={accent}
                    />
                    <FontChoice
                      active={fontSize === 'Large'}
                      title="Large"
                      subtitle="Bigger text"
                      onClick={() => setFontSize('Large')}
                      accent={accent}
                    />
                  </div>
                </Card>

                <Card>
                  <SectionHeader
                    title="Live preview"
                    subtitle="See how Kivo looks with your current settings."
                  />

                  <div
                    className={[
                      'rounded-[24px] border border-black/[0.055] bg-white p-4 shadow-[0_14px_34px_rgba(15,23,42,0.035)]',
                      blur ? 'backdrop-blur-2xl' : '',
                    ].join(' ')}
                  >
                    <div className="mb-8 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black/[0.035]">
                          <Menu className="h-4 w-4" />
                        </div>
                        <div className="font-semibold">Kivo</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Circle className="h-4 w-4 text-black/30" />
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7B5342] text-[13px] font-semibold text-white">
                          M
                        </div>
                      </div>
                    </div>

                    <div className="mx-auto max-w-[420px] text-center">
                      <div
                        className={[
                          'font-semibold tracking-[-0.04em]',
                          fontSize === 'Small' ? 'text-[18px]' : fontSize === 'Large' ? 'text-[24px]' : 'text-[21px]',
                        ].join(' ')}
                      >
                        Good morning, Miro
                      </div>
                      <p className="mt-1 text-[14px] text-black/45">
                        How can I help you today?
                      </p>

                      <div className="mt-8 flex items-center gap-3 rounded-[18px] border border-black/[0.06] bg-[#F8F8F7] px-4 py-3 text-left">
                        <span className="flex-1 text-[13px] text-black/38">
                          Ask anything...
                        </span>
                        <button
                          className="flex h-9 w-9 items-center justify-center rounded-full text-white"
                          style={{ backgroundColor: accent }}
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={resetDefaults}
                    className="inline-flex items-center justify-center gap-2 rounded-[17px] border border-black/[0.055] bg-white px-5 py-4 text-[14px] font-medium shadow-[0_10px_26px_rgba(15,23,42,0.025)]"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset to defaults
                  </button>

                  <button
                    onClick={saveAppearance}
                    className="inline-flex items-center justify-center gap-2 rounded-[17px] px-5 py-4 text-[14px] font-semibold text-white shadow-[0_18px_42px_rgba(124,58,237,0.22)]"
                    style={{ backgroundColor: accent }}
                  >
                    {saved ? 'Saved' : 'Save appearance'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-[28px] border border-black/[0.055] bg-white/90 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.04)] ${className}`}
    >
      {children}
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-[18px] font-semibold tracking-[-0.035em]">{title}</h2>
      <p className="mt-1 text-[13px] text-black/45">{subtitle}</p>
    </div>
  );
}

function SideItem({
  icon,
  title,
  subtitle,
  active = false,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  active?: boolean;
}) {
  return (
    <div
      className={[
        'flex items-center gap-3 rounded-[18px] px-3 py-3',
        active ? 'bg-violet-500/[0.08]' : '',
      ].join(' ')}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-black/[0.035] [&>svg]:h-5 [&>svg]:w-5">
        {icon}
      </div>
      <div>
        <div className={active ? 'text-[14px] font-semibold text-violet-600' : 'text-[14px] font-semibold'}>
          {title}
        </div>
        <div className="mt-0.5 text-[12px] leading-[1.25] text-black/42">
          {subtitle}
        </div>
      </div>
    </div>
  );
}

function ChoiceCard({
  active,
  icon,
  title,
  subtitle,
  onClick,
  accent,
}: {
  active: boolean;
  icon: ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
  accent: string;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-[20px] border bg-white p-4 text-left shadow-[0_8px_22px_rgba(15,23,42,0.018)]"
      style={{ borderColor: active ? accent : 'rgba(0,0,0,0.055)' }}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-black/[0.035] [&>svg]:h-5 [&>svg]:w-5">
          {icon}
        </div>
        <div>
          <div className="text-[14px] font-semibold" style={{ color: active ? accent : undefined }}>
            {title}
          </div>
          <div className="mt-1 text-[12px] text-black/45">{subtitle}</div>
        </div>
      </div>
    </button>
  );
}

function ToggleCard({
  title,
  subtitle,
  checked,
  onClick,
  accent,
}: {
  title: string;
  subtitle: string;
  checked: boolean;
  onClick: () => void;
  accent: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between gap-4 rounded-[24px] border border-black/[0.055] bg-white/90 p-5 text-left shadow-[0_18px_50px_rgba(15,23,42,0.04)]"
    >
      <div>
        <div className="text-[15px] font-semibold tracking-[-0.03em]">{title}</div>
        <div className="mt-1 text-[13px] text-black/45">{subtitle}</div>
      </div>

      <span
        className="relative h-7 w-12 rounded-full transition"
        style={{ backgroundColor: checked ? accent : 'rgba(0,0,0,0.12)' }}
      >
        <span
          className={[
            'absolute top-1 h-5 w-5 rounded-full bg-white transition',
            checked ? 'left-6' : 'left-1',
          ].join(' ')}
        />
      </span>
    </button>
  );
}

function FontChoice({
  active,
  title,
  subtitle,
  onClick,
  accent,
}: {
  active: boolean;
  title: string;
  subtitle: string;
  onClick: () => void;
  accent: string;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-[20px] border bg-white p-4 text-left shadow-[0_8px_22px_rgba(15,23,42,0.018)]"
      style={{ borderColor: active ? accent : 'rgba(0,0,0,0.055)' }}
    >
      <div className="text-[26px] leading-none tracking-[-0.05em]">Aa</div>
      <div className="mt-3 text-[14px] font-semibold" style={{ color: active ? accent : undefined }}>
        {title}
      </div>
      <div className="mt-1 text-[12px] text-black/45">{subtitle}</div>
    </button>
  );
}
