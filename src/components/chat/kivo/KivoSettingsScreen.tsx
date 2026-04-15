'use client';

import { useMemo, useState } from 'react';
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
import { KivoReferralSheet } from './KivoReferralSheet';

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

type ReferralStats = {
  creditsEarned: number;
  successfulReferrals: number;
  pendingInvites: number;
};

export function KivoSettingsScreen() {
  const router = useRouter();

  const user = useAppStore((s) => s.user);
  const usage = useAppStore((s: any) => s.usage);

  const [referralOpen, setReferralOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [referralLoading, setReferralLoading] = useState(false);
  const [referralStats, setReferralStats] = useState<ReferralStats>({
    creditsEarned: 0,
    successfulReferrals: 0,
    pendingInvites: 0,
  });

  const profileInitial = useMemo(() => {
    const source =
      user?.displayName ||
      user?.name ||
      user?.email?.[0] ||
      'K';

    return source.charAt(0).toUpperCase();
  }, [user]);

  const displayName = user?.displayName || user?.name || 'Kivo User';
  const email = user?.email || 'your@email.com';

  const creditsText = (() => {
    const maybeCredits =
      usage?.creditsRemaining ??
      usage?.credits ??
      usage?.remainingCredits;

    if (typeof maybeCredits === 'number') return String(maybeCredits);
    return '300';
  })();

  const openReferralSheet = async () => {
    setReferralOpen(true);
    setReferralLoading(true);

    try {
      const [linkResponse, statsResponse] = await Promise.all([
        fetch('/api/referrals/link', {
          method: 'GET',
          cache: 'no-store',
        }),
        fetch('/api/referrals/stats', {
          method: 'GET',
          cache: 'no-store',
        }),
      ]);

      const linkData = await linkResponse.json().catch(() => null);
      const statsData = await statsResponse.json().catch(() => null);

      if (linkResponse.ok && linkData?.inviteLink) {
        setInviteLink(linkData.inviteLink);
      }

      if (statsResponse.ok && statsData) {
        setReferralStats({
          creditsEarned: Number(statsData.creditsEarned ?? 0),
          successfulReferrals: Number(statsData.successfulReferrals ?? 0),
          pendingInvites: Number(statsData.pendingInvites ?? 0),
        });
      }
    } catch (error) {
      console.error('Failed to load referral data', error);
    } finally {
      setReferralLoading(false);
    }
  };

  const sections: SettingsSection[] = [
    {
      id: 'account',
      title: 'Account',
      rows: [
        { id: 'profile', label: 'Profile', icon: User, href: '/profile' },
        { id: 'language', label: 'Language', value: 'English', icon: Globe, href: '/settings/language' },
        { id: 'appearance', label: 'Appearance', value: 'Light', icon: Sparkles, href: '/settings/appearance' },
        { id: 'share', label: 'Share with a friend', icon: Share2 },
      ],
    },
    {
      id: 'kivo',
      title: 'Kivo',
      rows: [
        { id: 'scheduled', label: 'Scheduled tasks', icon: Sparkles, href: '/tasks' },
        { id: 'knowledge', label: 'Knowledge', icon: Cpu, href: '/memory' },
        { id: 'mail', label: 'Mail Kivo', icon: Mail, href: '/control' },
        { id: 'cloud', label: 'Cloud Browser', icon: Cloud, href: '/tools' },
        { id: 'skills', label: 'Skills', icon: Puzzle, href: '/tools' },
      ],
    },
    {
      id: 'integrations',
      title: 'Integrations',
      rows: [
        { id: 'connectors', label: 'Connectors', icon: Plug, href: '/control' },
        { id: 'integrations-row', label: 'Integrations', icon: Wrench, href: '/control' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#2f3640]">
      <div className="mx-auto flex min-h-screen w-full max-w-[560px] flex-col bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.92),rgba(245,245,247,1)_58%)] shadow-[0_24px_80px_rgba(31,41,55,0.08)]">
        <header className="sticky top-0 z-30 border-b border-black/[0.04] bg-[rgba(245,245,247,0.78)] px-5 pb-3 pt-4 backdrop-blur-2xl">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.push('/home')}
              aria-label="Back to home"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/[0.05] bg-white/60 text-[#3c4450] transition-all duration-200 ease-out hover:bg-white active:scale-[0.985]"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2} />
            </button>

            <h1 className="text-[21px] font-medium tracking-[-0.04em] text-[#2f3640]">
              Settings
            </h1>

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

        <main className="flex min-h-0 flex-1 flex-col px-5 pb-10 pt-5">
          <section className="mb-6 rounded-[24px] border border-black/[0.05] bg-white/80 px-4 py-4 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
            <button
              type="button"
              onClick={() => router.push('/profile')}
              className="flex w-full items-center gap-4 text-left"
            >
              <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#b3897f] text-[24px] font-medium text-white">
                {profileInitial}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[17px] font-medium tracking-[-0.03em] text-[#2f3640]">
                  {displayName}
                </p>
                <p className="mt-1 truncate text-[14px] text-[#858c99]">
                  {email}
                </p>
              </div>

              <ChevronRight className="h-5 w-5 shrink-0 text-[#98a0ad]" strokeWidth={2} />
            </button>
          </section>

          <section className="mb-8 rounded-[24px] border border-black/[0.05] bg-white/82 px-4 py-4 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[16px] font-medium tracking-[-0.02em] text-[#2f3640]">
                  Free plan
                </p>
                <p className="mt-1 text-[13px] text-[#8b93a0]">
                  Credits available: {creditsText}
                </p>
              </div>

              <button
                type="button"
                onClick={() => router.push('/upgrade')}
                className="inline-flex items-center rounded-full border border-black/[0.06] bg-[#111111] px-4 py-2.5 text-[14px] font-medium text-white transition-all duration-200 ease-out hover:opacity-95 active:scale-[0.985]"
              >
                Upgrade
              </button>
            </div>
          </section>

          {sections.map((section) => (
            <section key={section.id} className="mb-7 last:mb-0">
              <p className="mb-3 px-1 text-[13px] font-medium tracking-[-0.01em] text-[#9aa1ad]">
                {section.title}
              </p>

              <div className="overflow-hidden rounded-[22px] border border-black/[0.05] bg-white/72 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
                {section.rows.map((row, index) => {
                  const Icon = row.icon;

                  return (
                    <button
                      key={row.id}
                      type="button"
                      onClick={() => {
                        if (row.id === 'share') {
                          void openReferralSheet();
                          return;
                        }

                        if (row.href) {
                          router.push(row.href);
                        }
                      }}
                      className={`flex w-full items-center gap-4 px-4 py-3.5 text-left transition-all duration-200 ease-out hover:bg-white/70 active:scale-[0.995] ${
                        index !== section.rows.length - 1
                          ? 'border-b border-black/[0.05]'
                          : ''
                      }`}
                    >
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f1f3f6] text-[#353b45]">
                        <Icon className="h-5 w-5" strokeWidth={1.9} />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-medium tracking-[-0.02em] text-[#2f3640]">
                          {row.label}
                        </span>
                      </span>

                      <span className="flex shrink-0 items-center gap-2 text-[#98a0ad]">
                        {row.value ? (
                          <span className="text-[14px] font-normal text-[#98a0ad]">
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

        <KivoReferralSheet
          open={referralOpen}
          onClose={() => setReferralOpen(false)}
          inviteLink={inviteLink}
          loadingLink={referralLoading}
          creditsEarned={referralStats.creditsEarned}
          successfulReferrals={referralStats.successfulReferrals}
          pendingInvites={referralStats.pendingInvites}
          rewardLabel="Earn 100 credits for every successful referral"
          onSendEmailInvite={async (inviteEmail) => {
            console.log('Send referral invite to:', inviteEmail);
          }}
        />
      </div>
    </div>
  );
}
