'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Cpu,
  Globe,
  Mail,
  Plug,
  Puzzle,
  Share2,
  Sparkles,
  User,
  Wrench,
} from 'lucide-react';
import { useAppStore } from '@/app/store/app-store';

type SettingsRow = {
  id: string;
  label: string;
  value?: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  href?: string;
};

type SettingsSection = {
  id: string;
  title: string;
  rows: SettingsRow[];
};

export function KivoSettingsScreen() {
  const router = useRouter();

  const user = useAppStore((s) => s.user);
  const usage = useAppStore((s: any) => s.usage);

  const profileInitial = useMemo(() => {
    const source =
      user?.displayName ||
      user?.name ||
      user?.email?.[0] ||
      'K';

    return source.charAt(0).toUpperCase();
  }, [user]);

  const displayName =
    user?.displayName || user?.name || 'Kivo User';

  const email =
    user?.email || 'your@email.com';

  const creditsText = (() => {
    const maybeCredits =
      usage?.creditsRemaining ??
      usage?.credits ??
      usage?.remainingCredits;

    if (typeof maybeCredits === 'number') {
      return String(maybeCredits);
    }

    return '300';
  })();

  const sections: SettingsSection[] = [
    {
      id: 'manus',
      title: 'Kivo',
      rows: [
        { id: 'share', label: 'Share with a friend', icon: Share2, href: '/upgrade' },
        { id: 'scheduled', label: 'Scheduled tasks', icon: Sparkles, href: '/tasks' },
        { id: 'knowledge', label: 'Knowledge', icon: Cpu, href: '/memory' },
        { id: 'mail', label: 'Mail Kivo', icon: Mail, href: '/control' },
        { id: 'cloud', label: 'Cloud Browser', icon: Cloud, href: '/tools' },
        { id: 'skills', label: 'Skills', icon: Puzzle, href: '/tools' },
        { id: 'connectors', label: 'Connectors', icon: Plug, href: '/control' },
        { id: 'integrations', label: 'Integrations', icon: Wrench, href: '/control' },
      ],
    },
    {
      id: 'general',
      title: 'General',
      rows: [
        { id: 'account', label: 'Account', icon: User, href: '/profile' },
        { id: 'language', label: 'Language', value: 'English', icon: Globe, href: '/settings/language' },
        { id: 'appearance', label: 'Appearance', value: 'Light', icon: Sparkles, href: '/settings/appearance' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#2f3640]">
      <div className="mx-auto flex min-h-screen w-full max-w-[560px] flex-col bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.92),rgba(245,245,247,1)_58%)] shadow-[0_24px_80px_rgba(31,41,55,0.08)]">
        <header className="sticky top-0 z-30 bg-[rgba(245,245,247,0.82)] px-5 pb-3 pt-4 backdrop-blur-2xl">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.push('/home')}
              aria-label="Back to home"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/[0.05] bg-white/60 text-[#3c4450] transition-all duration-200 ease-out hover:bg-white active:scale-[0.985]"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2} />
            </button>

            <div className="text-center">
              <h1 className="text-[22px] font-semibold tracking-[-0.05em] text-[#2f3640]">
                Settings
              </h1>
            </div>

            <button
              type="button"
              onClick={() => router.push('/alerts')}
              aria-label="Open alerts"
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/[0.05] bg-white/60 text-[#3c4450] transition-all duration-200 ease-out hover:bg-white active:scale-[0.985]"
            >
              <Bell className="h-5 w-5" strokeWidth={1.9} />
              <span className="absolute right-[11px] top-[11px] h-2.5 w-2.5 rounded-full bg-[#ff5b5b]" />
            </button>
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col px-5 pb-10 pt-4">
          <section className="mb-5">
            <div className="flex items-center gap-4">
              <div className="inline-flex h-[74px] w-[74px] shrink-0 items-center justify-center rounded-full bg-[#b3897f] text-[34px] font-medium text-white shadow-[0_10px_24px_rgba(17,24,39,0.08)]">
                {profileInitial}
              </div>

              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => router.push('/profile')}
                  className="flex max-w-full items-center gap-2 text-left"
                >
                  <span className="truncate text-[18px] font-semibold tracking-[-0.04em] text-[#2f3640] sm:text-[20px]">
                    {displayName}
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-[#7f8794]" strokeWidth={2} />
                </button>

                <p className="mt-1 truncate text-[14px] text-[#858c99]">
                  {email}
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8 rounded-[28px] border border-black/[0.05] bg-white/82 px-5 py-5 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p
                  className="text-[20px] font-semibold tracking-[-0.03em] text-[#2f3640]"
                  style={{ fontFamily: 'ui-serif, Georgia, Times, serif' }}
                >
                  Free
                </p>
              </div>

              <button
                type="button"
                onClick={() => router.push('/upgrade')}
                className="inline-flex items-center rounded-full bg-[#111111] px-5 py-3 text-[15px] font-medium text-white transition-all duration-200 ease-out hover:opacity-95 active:scale-[0.985]"
              >
                Upgrade
              </button>
            </div>

            <div className="my-5 h-px border-t border-dashed border-black/[0.08]" />

            <button
              type="button"
              onClick={() => router.push('/upgrade')}
              className="flex w-full items-center justify-between text-left"
            >
              <div>
                <p className="text-[16px] font-medium text-[#2f3640]">Credits</p>
              </div>

              <div className="flex items-center gap-2 text-[#2f3640]">
                <Sparkles className="h-4.5 w-4.5" strokeWidth={1.9} />
                <span className="text-[16px] font-medium">{creditsText}</span>
                <ChevronRight className="h-5 w-5 text-[#98a0ad]" strokeWidth={2} />
              </div>
            </button>
          </section>

          {sections.map((section) => (
            <section key={section.id} className="mb-8 last:mb-0">
              <p className="mb-3 px-1 text-[13px] font-medium tracking-[-0.01em] text-[#9aa1ad]">
                {section.title}
              </p>

              <div className="space-y-1">
                {section.rows.map((row) => {
                  const Icon = row.icon;

                  return (
                    <button
                      key={row.id}
                      type="button"
                      onClick={() => {
                        if (row.href) router.push(row.href);
                      }}
                      className="flex w-full items-center gap-4 rounded-[20px] px-3 py-3 text-left transition-all duration-200 ease-out hover:bg-white/55 active:scale-[0.992]"
                    >
                      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#ededf0] text-[#353b45]">
                        <Icon className="h-5.5 w-5.5" strokeWidth={1.9} />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[16px] font-medium tracking-[-0.02em] text-[#2f3640]">
                          {row.label}
                        </span>
                      </span>

                      <span className="flex shrink-0 items-center gap-2 text-[#98a0ad]">
                        {row.value ? (
                          <span className="text-[15px] font-normal text-[#98a0ad]">
                            {row.value}
                          </span>
                        ) : null}
                        <ChevronRight className="h-5 w-5" strokeWidth={2} />
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}

          <div className="mt-auto pt-6 text-center">
            <p className="text-[13px] text-[#9aa1ad]">Kivo v1.0.0</p>
          </div>
        </main>
      </div>
    </div>
  );
}
