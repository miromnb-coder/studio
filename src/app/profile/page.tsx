'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Globe,
  Lock,
  LogOut,
  Mail,
  Shield,
  Sparkles,
  Star,
  Trash2,
  User,
  WandSparkles,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useUserEntitlements } from '../hooks/use-user-entitlements';
import { toFriendlyAuthMessage } from '@/lib/auth/messages';
import { useAppStore } from '../store/app-store';

function formatMoneySaved(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

type InfoRowProps = {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value?: string;
  href?: string;
  danger?: boolean;
  onClick?: () => void;
};

function InfoRow({ icon: Icon, label, value, href, danger = false, onClick }: InfoRowProps) {
  const className = `group flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all duration-200 ease-out ${
    danger
      ? 'border-[#f2cfcf] bg-[#fff7f7] hover:bg-[#fff1f1]'
      : 'border-black/[0.05] bg-white/85 hover:bg-white'
  }`;

  const content = (
    <>
      <span
        className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          danger ? 'bg-[#ffe9e9] text-[#af3a3a]' : 'bg-[#f4f6f9] text-[#4b5462]'
        }`}
      >
        <Icon className="h-5 w-5" strokeWidth={1.9} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block text-[15px] font-medium ${danger ? 'text-[#9d3434]' : 'text-[#2d3542]'}`}>
          {label}
        </span>
        {value ? <span className="mt-0.5 block text-[13px] text-[#8c94a1]">{value}</span> : null}
      </span>
      <ChevronRight className={`h-5 w-5 shrink-0 ${danger ? 'text-[#d07f7f]' : 'text-[#9aa2af]'}`} strokeWidth={2} />
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const appUser = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const clearUser = useAppStore((s) => s.clearUser);
  const conversationList = useAppStore((s) => s.conversationList);
  const history = useAppStore((s) => s.history);
  const usageState = useAppStore((s) => (s as any).usage) as Record<string, unknown> | undefined;

  const [fullName, setFullName] = useState('Kivo User');
  const [email, setEmail] = useState('');
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const { plan, usage } = useUserEntitlements();

  const loadProfile = useCallback(async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      clearUser();
      router.replace('/login');
      return;
    }

    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', authUser.id).maybeSingle();

    const nextName =
      profile?.full_name ||
      (authUser.user_metadata?.full_name as string | undefined) ||
      appUser?.name ||
      authUser.email?.split('@')[0] ||
      'Kivo User';

    const nextEmail = authUser.email ?? appUser?.email ?? '';

    setFullName(nextName);
    setEmail(nextEmail);
    setUser({ id: authUser.id, email: nextEmail, name: nextName });
  }, [supabase, clearUser, router, setUser, appUser]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const planLabel = plan === 'plus' ? 'Plus' : 'Free';
  const avatarInitial = (fullName || appUser?.name || email || 'K').charAt(0).toUpperCase();

  const conversationsCount = conversationList.length > 0 ? conversationList.length : 12;
  const tasksCompleted = history.filter((item) => item.type === 'account' || item.type === 'memory').length || 9;

  const usageCredits = (() => {
    const fromStore = usageState?.creditsRemaining ?? usageState?.credits ?? usageState?.remainingCredits;
    if (typeof fromStore === 'number') return fromStore;
    if (!usage.unlimited) return Math.max(usage.limit - usage.current, 0);
    return 0;
  })();

  const aiUsageText = usage.unlimited ? 'Unlimited' : `${usage.current} / ${usage.limit}`;
  const moneySavedAmount = conversationsCount * 14;

  const onSignOut = async () => {
    setAuthError(null);
    setIsSigningOut(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      setAuthError(toFriendlyAuthMessage(error, 'Could not sign out right now.'));
      setIsSigningOut(false);
      return;
    }

    clearUser();
    router.replace('/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#2f3640]">
      <div className="mx-auto flex min-h-screen w-full max-w-[560px] flex-col bg-[radial-gradient(circle_at_50%_12%,rgba(255,255,255,0.96),rgba(246,247,249,1)_62%)] shadow-[0_24px_80px_rgba(31,41,55,0.08)]">
        <header className="sticky top-0 z-30 border-b border-black/[0.04] bg-[rgba(245,245,247,0.80)] px-5 pb-3 pt-4 backdrop-blur-2xl">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.push('/settings')}
              aria-label="Back to settings"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/[0.05] bg-white/70 text-[#3c4450] transition-all duration-200 ease-out hover:bg-white active:scale-[0.985]"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2} />
            </button>

            <h1 className="text-[21px] font-medium tracking-[-0.04em] text-[#2f3640]">Profile</h1>

            <span className="inline-flex h-11 min-w-[44px] items-center justify-center rounded-full border border-black/[0.05] bg-white/70 px-3 text-[12px] font-medium text-[#7d8593]">
              Kivo
            </span>
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 pb-10 pt-5">
          <section className="relative overflow-hidden rounded-[28px] border border-black/[0.06] bg-[linear-gradient(160deg,rgba(255,255,255,0.96),rgba(246,248,252,0.94))] p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(170,196,255,0.34),rgba(255,255,255,0))]" />
            <div className="pointer-events-none absolute -bottom-16 -left-10 h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(198,174,255,0.22),rgba(255,255,255,0))]" />

            <div className="relative flex items-center gap-4">
              <div className="inline-flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#b3897f,#9f7fca)] text-[32px] font-semibold text-white shadow-[0_12px_28px_rgba(67,56,202,0.25)]">
                {avatarInitial}
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-2 inline-flex items-center rounded-full border border-black/[0.06] bg-white/80 px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#5f6774]">
                  {planLabel} plan
                </div>
                <p className="truncate text-[23px] font-semibold tracking-[-0.03em] text-[#222a36]">{fullName}</p>
                <p className="mt-1 truncate text-[14px] text-[#7f8794]">{email || 'No email connected'}</p>
                <p className="mt-1 text-[13px] text-[#97a0ad]">Welcome back</p>
              </div>
            </div>
          </section>

          <section>
            <p className="mb-3 px-1 text-[13px] font-medium tracking-[-0.01em] text-[#9aa1ad]">Personal stats</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Conversations', value: String(conversationsCount), icon: Sparkles },
                { label: 'Tasks completed', value: String(tasksCompleted), icon: WandSparkles },
                { label: 'Money saved', value: formatMoneySaved(moneySavedAmount), icon: Star },
                { label: 'AI usage', value: usage.unlimited ? aiUsageText : `${aiUsageText} · ${usageCredits} left`, icon: User },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <article
                    key={item.label}
                    className="rounded-2xl border border-black/[0.05] bg-white/86 p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)]"
                  >
                    <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#f2f5fa] text-[#485363]">
                      <Icon className="h-4.5 w-4.5" strokeWidth={1.9} />
                    </div>
                    <p className="text-[20px] font-semibold tracking-[-0.03em] text-[#26303d]">{item.value}</p>
                    <p className="mt-0.5 text-[12px] text-[#8d96a3]">{item.label}</p>
                  </article>
                );
              })}
            </div>
          </section>

          <section>
            <p className="mb-3 px-1 text-[13px] font-medium tracking-[-0.01em] text-[#9aa1ad]">Personalization</p>
            <div className="space-y-2.5 rounded-[22px] border border-black/[0.05] bg-white/74 p-3 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
              <InfoRow icon={Globe} label="Language" value="English (US)" href="/settings/language" />
              <InfoRow icon={Sparkles} label="Voice preferences" value="Natural · Calm" href="/control/preferences" />
              <InfoRow icon={WandSparkles} label="AI style" value="Strategic + concise" href="/control/preferences" />
              <InfoRow icon={Lock} label="Memory mode" value="Adaptive memory" href="/memory" />
            </div>
          </section>

          <section>
            <p className="mb-3 px-1 text-[13px] font-medium tracking-[-0.01em] text-[#9aa1ad]">Membership</p>
            <article className="overflow-hidden rounded-[24px] border border-black/[0.06] bg-[linear-gradient(165deg,rgba(255,255,255,0.94),rgba(245,246,250,0.94))] p-4 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
              {planLabel === 'Free' ? (
                <>
                  <p className="text-[17px] font-medium tracking-[-0.02em] text-[#2f3640]">Upgrade to Kivo Plus</p>
                  <p className="mt-1 text-[13px] text-[#8b93a0]">Unlock higher limits, deeper memory, and premium AI orchestration.</p>
                  <Link
                    href="/upgrade"
                    className="mt-4 inline-flex items-center rounded-full border border-black/[0.06] bg-[#151515] px-4 py-2.5 text-[14px] font-medium text-white transition-all duration-200 ease-out hover:opacity-95 active:scale-[0.985]"
                  >
                    Upgrade now
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-[17px] font-medium tracking-[-0.02em] text-[#2f3640]">Kivo Plus active</p>
                  <p className="mt-1 text-[13px] text-[#8b93a0]">Your premium workspace is active with expanded intelligence usage.</p>
                  <Link
                    href="/control/subscription"
                    className="mt-4 inline-flex items-center rounded-full border border-black/[0.06] bg-white px-4 py-2.5 text-[14px] font-medium text-[#2f3640] transition-all duration-200 ease-out hover:bg-[#f7f8fa] active:scale-[0.985]"
                  >
                    Manage membership
                  </Link>
                </>
              )}
            </article>
          </section>

          <section>
            <p className="mb-3 px-1 text-[13px] font-medium tracking-[-0.01em] text-[#9aa1ad]">Security & account</p>
            <div className="space-y-2.5 rounded-[22px] border border-black/[0.05] bg-white/74 p-3 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
              <InfoRow icon={Mail} label="Email" value={email || 'No email'} href="/control/account" />
              <InfoRow icon={Shield} label="Privacy" value="Controls & permissions" href="/control/privacy" />
              <InfoRow icon={Lock} label="Export data" value="Download your Kivo data" href="/memory" />
              <InfoRow icon={Trash2} label="Delete account" value="Permanent and irreversible" danger onClick={() => window.alert('Please contact support to delete your account.')} />
              <InfoRow icon={LogOut} label={isSigningOut ? 'Signing out…' : 'Sign out'} danger onClick={() => void onSignOut()} />
            </div>
            {authError ? <p className="mt-3 rounded-xl border border-[#e6c7c7] bg-[#fff0f0] px-3 py-2 text-sm text-[#833e3e]">{authError}</p> : null}
          </section>
        </main>
      </div>
    </div>
  );
}
