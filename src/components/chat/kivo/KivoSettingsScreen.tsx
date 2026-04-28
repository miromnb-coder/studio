'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Cloud,
  Crown,
  Database,
  Globe,
  History,
  Mail,
  Plug,
  Puzzle,
  Share2,
  ShieldCheck,
  Sparkles,
  User,
  Wrench,
  Zap,
} from 'lucide-react';
import { useAppStore } from '@/app/store/app-store';
import { KivoReferralSheet } from './KivoReferralSheet';
import { haptic } from '@/lib/haptics';

type SettingsRow = {
  id: string;
  label: string;
  description?: string;
  value?: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  href?: string;
  action?: 'referral';
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

function GhostHeaderButton({
  onClick,
  label,
  children,
  dot,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
  dot?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="relative inline-flex h-11 items-center justify-center px-1 text-[#2A2A31] transition-all duration-200 ease-out hover:opacity-65 active:scale-[0.985]"
    >
      {children}
      {dot ? (
        <span className="absolute right-[2px] top-[6px] h-2.5 w-2.5 rounded-full bg-[#ff5b5b]" />
      ) : null}
    </button>
  );
}

function SettingsSectionCard({
  section,
  onRowClick,
}: {
  section: SettingsSection;
  onRowClick: (row: SettingsRow) => void;
}) {
  return (
    <section className="mb-7 last:mb-0">
      <p className="mb-3 px-1 text-[13px] font-medium tracking-[-0.01em] text-[#9A9AA3]">
        {section.title}
      </p>

      <div className="overflow-hidden rounded-[24px] border border-black/[0.06] bg-white shadow-[0_12px_28px_rgba(0,0,0,0.035)]">
        {section.rows.map((row, index) => {
          const Icon = row.icon;

          return (
            <button
              key={row.id}
              type="button"
              onClick={() => onRowClick(row)}
              className={`flex w-full items-center gap-4 px-4 py-4 text-left transition-all duration-200 ease-out hover:bg-[#FCFCFD] active:scale-[0.995] ${
                index !== section.rows.length - 1
                  ? 'border-b border-black/[0.05]'
                  : ''
              }`}
            >
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F4F4F6] text-[#353B45]">
                <Icon className="h-5 w-5" strokeWidth={1.9} />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-[16px] font-medium tracking-[-0.02em] text-[#141419]">
                  {row.label}
                </span>
                {row.description ? (
                  <span className="mt-0.5 block truncate text-[13px] text-[#7B7B84]">
                    {row.description}
                  </span>
                ) : null}
              </span>

              <span className="flex shrink-0 items-center gap-2 text-[#9A9AA3]">
                {row.value ? (
                  <span className="text-[14px] font-normal text-[#7B7B84]">
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
  );
}

export function KivoSettingsScreen() {
  const router = useRouter();

  const user = useAppStore((s) => s.user);
  const usage = useAppStore((s: any) => s.usage);
  const alerts = useAppStore((s) => s.alerts);
  const conversationList = useAppStore((s) => s.conversationList);

  const [referralOpen, setReferralOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [referralLoading, setReferralLoading] = useState(false);
  const [referralStats, setReferralStats] = useState<ReferralStats>({
    creditsEarned: 0,
    successfulReferrals: 0,
    pendingInvites: 0,
  });

  const profileInitial = useMemo(() => {
    const source = user?.displayName || user?.name || user?.email?.[0] || 'K';
    return source.charAt(0).toUpperCase();
  }, [user]);

  const displayName = user?.displayName || user?.name || 'Kivo User';
  const email = user?.email || 'your@email.com';

  const unreadAlerts = Array.isArray(alerts)
    ? alerts.filter((alert) => !alert.resolved).length
    : 0;

  const conversationCount = Array.isArray(conversationList)
    ? conversationList.length
    : 0;

  const planLabel = (() => {
    const maybePlan =
      usage?.plan || usage?.currentPlan || usage?.subscriptionPlan;

    if (typeof maybePlan === 'string' && maybePlan.trim()) {
      const normalized = maybePlan.trim().toLowerCase();
      if (normalized === 'premium' || normalized === 'plus') return 'Kivo Plus';
      return 'Free plan';
    }

    return 'Free plan';
  })();

  const appearanceValue =
    typeof usage?.appearance === 'string' && usage.appearance.trim()
      ? usage.appearance
      : 'Light';

  const connectedCount =
    typeof usage?.connectedIntegrations === 'number'
      ? usage.connectedIntegrations
      : 2;

  const activeIntegrations =
    typeof usage?.activeIntegrations === 'number'
      ? usage.activeIntegrations
      : 12;

  const memoryCount =
    typeof usage?.memoryCount === 'number' ? usage.memoryCount : 24;

  const scheduledCount =
    typeof usage?.scheduledTasks === 'number' ? usage.scheduledTasks : 3;

  const openReferralSheet = async () => {
    haptic.light();
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
        {
          id: 'profile',
          label: 'Profile',
          description: 'Personal information and email',
          icon: User,
          href: '/profile',
        },
        {
          id: 'language',
          label: 'Language',
          description: 'App language',
          value: 'English',
          icon: Globe,
          href: '/settings/language',
        },
        {
          id: 'appearance',
          label: 'Appearance',
          description: 'Theme and visual style',
          value: appearanceValue,
          icon: Sparkles,
          href: '/settings/appearance',
        },
        {
          id: 'alerts',
          label: 'Notifications & alerts',
          description: 'Manage how you stay updated',
          value: unreadAlerts > 0 ? `${unreadAlerts} active` : 'All clear',
          icon: Bell,
          href: '/alerts',
        },
      ],
    },
    {
      id: 'workspace',
      title: 'Workspace',
      rows: [
        {
          id: 'history',
          label: 'History',
          description: 'View and manage past conversations',
          value: conversationCount > 0 ? `${conversationCount} chats` : undefined,
          icon: History,
          href: '/history',
        },
        {
          id: 'scheduled',
          label: 'Scheduled tasks',
          description: 'Your upcoming and recurring tasks',
          value: `${scheduledCount} upcoming`,
          icon: Clock3,
          href: '/tasks',
        },
        {
          id: 'memory',
          label: 'Memory',
          description: 'Manage what Kivo remembers',
          value: `${memoryCount} saved`,
          icon: Database,
          href: '/memory',
        },
        {
          id: 'share',
          label: 'Share with a friend',
          description: 'Invite and earn rewards',
          icon: Share2,
          action: 'referral',
        },
      ],
    },
    {
      id: 'tools',
      title: 'Kivo tools',
      rows: [
        {
          id: 'mail',
          label: 'Mail Kivo',
          description: 'AI email assistant',
          icon: Mail,
          href: '/control',
        },
        {
          id: 'cloud',
          label: 'Cloud Browser',
          description: 'Browse the web with Kivo',
          icon: Cloud,
          href: '/tools',
        },
        {
          id: 'skills',
          label: 'Skills',
          description: "Manage Kivo's capabilities",
          icon: Puzzle,
          href: '/tools',
        },
        {
          id: 'privacy',
          label: 'Privacy & safety',
          description: 'Security, data and permissions',
          icon: ShieldCheck,
          href: '/settings/privacy',
        },
      ],
    },
    {
      id: 'integrations',
      title: 'Integrations',
      rows: [
        {
          id: 'connectors',
          label: 'Connectors',
          description: 'Connect your favorite apps',
          value: `${connectedCount} connected`,
          icon: Plug,
          href: '/control',
        },
        {
          id: 'manage-integrations',
          label: 'Manage integrations',
          description: 'View and manage all integrations',
          value: `${activeIntegrations} active`,
          icon: Wrench,
          href: '/settings/integrations',
        },
      ],
    },
  ];

  const onRowClick = (row: SettingsRow) => {
    haptic.light();
    if (row.action === 'referral') {
      void openReferralSheet();
      return;
    }

    if (row.href) {
      router.push(row.href);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F6F7] text-[#141419]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#F7F7F8_0%,#FAFAFB_42%,#F4F4F5_100%)]" />
        <div className="absolute inset-x-0 top-0 h-[220px] bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.92)_0%,rgba(255,255,255,0.40)_54%,rgba(255,255,255,0)_84%)]" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-[560px] flex-col">
        <header
          className="sticky top-0 z-30 border-b border-black/[0.05] bg-white/72 px-5 pb-3 pt-4 backdrop-blur-2xl"
          style={{ paddingTop: 'max(16px, env(safe-area-inset-top, 0px))' }}
        >
          <div className="flex items-center justify-between">
            <GhostHeaderButton
              onClick={() => {
                haptic.selection();
                router.push('/home');
              }}
              label="Back to home"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2} />
            </GhostHeaderButton>

            <h1 className="text-[21px] font-semibold tracking-[-0.045em] text-[#141419]">
              Settings
            </h1>

            <GhostHeaderButton
              onClick={() => {
                haptic.light();
                router.push('/alerts');
              }}
              label="Open alerts"
              dot={unreadAlerts > 0}
            >
              <Bell className="h-5 w-5" strokeWidth={1.9} />
            </GhostHeaderButton>
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col px-5 pb-10 pt-5">
          <section className="mb-5 rounded-[26px] border border-black/[0.06] bg-white px-4 py-4 shadow-[0_12px_28px_rgba(0,0,0,0.035)]">
            <button
              type="button"
              onClick={() => {
                haptic.light();
                router.push('/profile');
              }}
              className="flex w-full items-center gap-4 text-left"
            >
              <div className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#B8897E] text-[26px] font-medium text-white">
                {profileInitial}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[18px] font-semibold tracking-[-0.03em] text-[#141419]">
                  {displayName}
                </p>
                <p className="mt-1 truncate text-[14px] text-[#7B7B84]">
                  {email}
                </p>

                <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-black/[0.05] bg-[#F7F7F8] px-3 py-1 text-[12px] font-medium text-[#7B7B84]">
                  <span className="h-2 w-2 rounded-full bg-[#B9BDC7]" />
                  {planLabel}
                </div>
              </div>

              <ChevronRight
                className="h-5 w-5 shrink-0 text-[#9A9AA3]"
                strokeWidth={2}
              />
            </button>
          </section>

          <section className="mb-8 overflow-hidden rounded-[28px] border border-black/[0.06] bg-white shadow-[0_14px_32px_rgba(0,0,0,0.04)]">
            <div className="bg-[linear-gradient(90deg,rgba(248,248,249,1)_0%,rgba(249,249,251,1)_55%,rgba(248,245,243,1)_100%)] px-4 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 gap-4">
                  <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-[#0B0B0F] text-white shadow-[0_12px_24px_rgba(0,0,0,0.12)]">
                    <Sparkles className="h-6 w-6" strokeWidth={2} />
                  </span>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-[17px] font-semibold tracking-[-0.03em] text-[#141419]">
                        Kivo Plus
                      </h2>

                      <span className="inline-flex items-center rounded-full bg-[#ECEAFB] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#5D5ABF]">
                        Popular
                      </span>
                    </div>

                    <p className="mt-2 max-w-[260px] text-[14px] leading-6 text-[#7B7B84]">
                      More credits, advanced tools, and priority access.
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      haptic.heavy();
                      router.push('/upgrade');
                    }}
                    className="inline-flex items-center rounded-full bg-[#0B0B0F] px-5 py-2.5 text-[14px] font-medium text-white shadow-[0_10px_24px_rgba(0,0,0,0.14)] transition-all duration-200 ease-out hover:opacity-95 active:scale-[0.985]"
                  >
                    Upgrade
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      haptic.heavy();
                      router.push('/upgrade');
                    }}
                    className="inline-flex items-center gap-1 text-[14px] font-medium text-[#7B7B84] transition-colors hover:text-[#141419]"
                  >
                    See benefits
                    <ChevronRight className="h-4 w-4" strokeWidth={2} />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 border-t border-black/[0.05]">
              <div className="flex items-center justify-center gap-2 px-4 py-4 text-[14px] font-medium text-[#141419]">
                <Zap className="h-4.5 w-4.5 text-[#4F5563]" strokeWidth={2} />
                More credits
              </div>
              <div className="flex items-center justify-center gap-2 border-x border-black/[0.05] px-4 py-4 text-[14px] font-medium text-[#141419]">
                <Sparkles className="h-4.5 w-4.5 text-[#4F5563]" strokeWidth={2} />
                Advanced tools
              </div>
              <div className="flex items-center justify-center gap-2 px-4 py-4 text-[14px] font-medium text-[#141419]">
                <Crown className="h-4.5 w-4.5 text-[#4F5563]" strokeWidth={2} />
                Priority access
              </div>
            </div>
          </section>

          {sections.map((section) => (
            <SettingsSectionCard
              key={section.id}
              section={section}
              onRowClick={onRowClick}
            />
          ))}

          <div className="mt-auto pt-6 text-center">
            <p className="text-[13px] text-[#9A9AA3]">Kivo v1.0.0</p>
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
