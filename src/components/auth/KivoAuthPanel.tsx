'use client';

import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { buildAuthCallbackUrl, sanitizeNextPath } from '@/lib/auth/redirects';

type PendingAction = 'apple' | 'google' | 'email' | 'login' | null;

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
      <path d="M16.99 12.76c.01-2.18 1.79-3.23 1.87-3.28-1.02-1.49-2.61-1.69-3.17-1.71-1.35-.14-2.64.8-3.33.8-.7 0-1.76-.78-2.9-.76-1.49.02-2.86.87-3.63 2.22-1.55 2.69-.4 6.67 1.12 8.86.74 1.07 1.63 2.27 2.8 2.23 1.13-.05 1.56-.73 2.93-.73 1.37 0 1.76.73 2.95.7 1.22-.02 2-1.1 2.74-2.18.85-1.24 1.2-2.45 1.22-2.51-.03-.01-2.32-.89-2.3-3.64Zm-2.12-6.38c.62-.75 1.04-1.8.93-2.84-.89.04-1.97.59-2.61 1.34-.57.66-1.07 1.72-.94 2.74.99.08 2-.5 2.62-1.24Z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12.24 10.29v3.89h5.41c-.22 1.25-.94 2.31-2.02 3.02l3.27 2.54c1.91-1.76 3.01-4.36 3.01-7.44 0-.72-.06-1.42-.18-2.1h-9.49Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.73 0 5.02-.9 6.7-2.44l-3.27-2.54c-.9.6-2.06.96-3.43.96-2.64 0-4.88-1.78-5.68-4.18H2.94v2.62A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#4A90E2"
        d="M6.32 13.8A5.96 5.96 0 0 1 6 12c0-.63.11-1.24.32-1.8V7.58H2.94A10 10 0 0 0 2 12c0 1.61.38 3.14.94 4.42l3.38-2.62Z"
      />
      <path
        fill="#FBBC05"
        d="M12 6.02c1.49 0 2.83.51 3.89 1.5l2.92-2.92C17.01 2.92 14.72 2 12 2a10 10 0 0 0-9.06 5.58l3.38 2.62c.8-2.4 3.04-4.18 5.68-4.18Z"
      />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
      <path d="m5 7 7 6 7-6" />
    </svg>
  );
}

function AuthButton({
  children,
  icon,
  dark = false,
  onClick,
  disabled,
}: {
  children: ReactNode;
  icon: ReactNode;
  dark?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        'group relative flex h-[64px] w-full items-center justify-center gap-3 overflow-hidden rounded-[24px] px-4',
        'text-[17px] font-medium tracking-[-0.03em] whitespace-nowrap',
        'transition-transform duration-200 active:scale-[0.992] disabled:cursor-not-allowed disabled:opacity-60',
        dark
          ? [
              'bg-[linear-gradient(180deg,rgba(17,17,17,0.98)_0%,rgba(0,0,0,0.96)_100%)]',
              'text-white',
              'shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_10px_30px_rgba(0,0,0,0.18)]',
            ].join(' ')
          : [
              'border border-white/55',
              'bg-white/58',
              'text-black',
              'backdrop-blur-md',
              'shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_10px_24px_rgba(15,23,42,0.06)]',
            ].join(' '),
      ].join(' ')}
    >
      {!dark && (
        <>
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.42)_0%,rgba(255,255,255,0.16)_100%)]" />
          <div className="pointer-events-none absolute inset-x-6 bottom-0 h-8 rounded-full bg-white/35 blur-2xl" />
        </>
      )}

      <span className={['relative z-10', dark ? 'text-white' : 'text-black/72'].join(' ')}>{icon}</span>
      <span className="relative z-10">{children}</span>
    </button>
  );
}

export function KivoAuthPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const nextPath = sanitizeNextPath(searchParams.get('next'));
  const isBusy = pendingAction !== null;

  const startOAuth = async (provider: 'apple' | 'google') => {
    if (isBusy) return;

    setPendingAction(provider);

    const callbackQuery = new URLSearchParams();
    callbackQuery.set('next', nextPath);

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: buildAuthCallbackUrl(`/auth/callback?${callbackQuery.toString()}`),
        ...(provider === 'google'
          ? {
              queryParams: {
                access_type: 'offline',
                prompt: 'select_account',
              },
            }
          : {}),
      },
    });

    if (error) {
      console.error(`${provider.toUpperCase()}_AUTH_START_ERROR`, error);
      setPendingAction(null);
    }
  };

  const goToEmail = () => {
    if (isBusy) return;
    setPendingAction('email');
    router.push(`/signup?next=${encodeURIComponent(nextPath)}`);
  };

  const goToLogin = () => {
    if (isBusy) return;
    setPendingAction('login');
    router.push(`/login?next=${encodeURIComponent(nextPath)}`);
  };

  return (
    <section
      className="
        relative mx-auto w-full overflow-hidden
        rounded-[32px]
        border border-white/60
        bg-white/38
        px-4 pb-5 pt-4
        backdrop-blur-[28px] backdrop-saturate-150
        shadow-[inset_0_1px_0_rgba(255,255,255,0.78),0_24px_80px_rgba(15,23,42,0.12),0_10px_30px_rgba(255,255,255,0.16)]
        supports-[backdrop-filter]:bg-white/34
      "
      style={{
        WebkitBackdropFilter: 'blur(28px) saturate(1.5)',
      }}
    >
      <div className="pointer-events-none absolute inset-0 rounded-[32px] bg-[linear-gradient(180deg,rgba(255,255,255,0.42)_0%,rgba(255,255,255,0.18)_42%,rgba(244,247,255,0.14)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/80" />
      <div className="pointer-events-none absolute inset-[1px] rounded-[31px] border border-white/30" />
      <div className="pointer-events-none absolute -bottom-6 left-1/2 h-20 w-[72%] -translate-x-1/2 rounded-full bg-white/30 blur-3xl" />

      <div className="relative z-10 space-y-3">
        <AuthButton dark icon={<AppleIcon />} onClick={() => void startOAuth('apple')} disabled={isBusy}>
          {pendingAction === 'apple' ? 'Connecting to Apple...' : 'Continue with Apple'}
        </AuthButton>

        <AuthButton icon={<GoogleIcon />} onClick={() => void startOAuth('google')} disabled={isBusy}>
          {pendingAction === 'google' ? 'Connecting to Google...' : 'Continue with Google'}
        </AuthButton>

        <AuthButton icon={<EmailIcon />} onClick={goToEmail} disabled={isBusy}>
          {pendingAction === 'email' ? 'Opening Email...' : 'Continue with Email'}
        </AuthButton>
      </div>

      <div className="relative z-10 pt-5 text-center text-[15px] font-normal tracking-[-0.02em] text-black/52">
        Already have an account?{' '}
        <button
          type="button"
          className="font-semibold text-black transition-opacity disabled:opacity-60"
          onClick={goToLogin}
          disabled={isBusy}
        >
          {pendingAction === 'login' ? 'Opening...' : 'Log in'}
        </button>
      </div>
    </section>
  );
}
