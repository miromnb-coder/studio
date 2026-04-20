'use client';

import type { ReactNode } from 'react';

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
      <path fill="#EA4335" d="M12.24 10.29v3.89h5.41c-.22 1.25-.94 2.31-2.02 3.02l3.27 2.54c1.91-1.76 3.01-4.36 3.01-7.44 0-.72-.06-1.42-.18-2.1h-9.49Z" />
      <path fill="#34A853" d="M12 22c2.73 0 5.02-.9 6.7-2.44l-3.27-2.54c-.9.6-2.06.96-3.43.96-2.64 0-4.88-1.78-5.68-4.18H2.94v2.62A10 10 0 0 0 12 22Z" />
      <path fill="#4A90E2" d="M6.32 13.8A5.96 5.96 0 0 1 6 12c0-.63.11-1.24.32-1.8V7.58H2.94A10 10 0 0 0 2 12c0 1.61.38 3.14.94 4.42l3.38-2.62Z" />
      <path fill="#FBBC05" d="M12 6.02c1.49 0 2.83.51 3.89 1.5l2.92-2.92C17.01 2.92 14.72 2 12 2a10 10 0 0 0-9.06 5.58l3.38 2.62c.8-2.4 3.04-4.18 5.68-4.18Z" />
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
}: {
  children: ReactNode;
  icon: ReactNode;
  dark?: boolean;
}) {
  return (
    <button
      type="button"
      className={[
        'flex h-[62px] w-full items-center justify-center gap-3 rounded-[22px] px-4',
        'text-[17px] font-medium tracking-[-0.03em] whitespace-nowrap',
        'transition active:scale-[0.995]',
        dark
          ? 'bg-[linear-gradient(180deg,#161616,#050505)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
          : 'border border-black/[0.03] bg-white/74 text-black shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]',
      ].join(' ')}
    >
      <span className={dark ? 'text-white' : 'text-black/70'}>{icon}</span>
      <span>{children}</span>
    </button>
  );
}

export function KivoAuthPanel() {
  return (
    <section
      className="
        relative mx-auto w-full
        rounded-[30px]
        border border-white/80
        bg-white/24
        px-4 pb-5 pt-4
        shadow-[0_18px_60px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.75)]
        backdrop-blur-[18px]
      "
    >
      <div className="space-y-3">
        <AuthButton dark icon={<AppleIcon />}>
          Continue with Apple
        </AuthButton>

        <AuthButton icon={<GoogleIcon />}>
          Continue with Google
        </AuthButton>

        <AuthButton icon={<EmailIcon />}>
          Continue with Email
        </AuthButton>
      </div>

      <div className="pt-4 text-center text-[15px] font-normal tracking-[-0.02em] text-black/48">
        Already have an account?{' '}
        <button type="button" className="font-semibold text-black">
          Log in
        </button>
      </div>
    </section>
  );
}
