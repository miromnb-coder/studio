'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

type AppShellProps = {
  children: ReactNode;
  className?: string;
};

export function AppShell({ children, className = '' }: AppShellProps) {
  return <main className={`screen premium-bg pb-12 ${className}`.trim()}>{children}</main>;
}

export function ProductPageHeader({
  pageTitle,
  pageSubtitle,
  showBack = false,
}: {
  pageTitle: string;
  pageSubtitle: string;
  showBack?: boolean;
}) {
  const router = useRouter();

  return (
    <header className="mb-4 rounded-[24px] border border-[#d9dde4] bg-[#f4f5f8] px-4 pb-4 pt-3 shadow-[0_8px_18px_rgba(66,72,88,0.06)]">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#d6dbe3] bg-[#eef1f5] text-[#5f6775] ${showBack ? '' : 'opacity-0 pointer-events-none'}`.trim()}
          aria-label="Go back"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-[36px] font-semibold leading-none tracking-[-0.04em] text-[#2a3140]">Kivo</p>
        <span className="h-9 w-9" />
      </div>
      <h1 className="text-[40px] font-semibold leading-none tracking-[-0.04em] text-[#252c3a]">{pageTitle}</h1>
      <p className="mt-1.5 text-base text-[#6f7786]">{pageSubtitle}</p>
    </header>
  );
}

type PremiumCardProps = {
  children: ReactNode;
  className?: string;
};

export function PremiumCard({ children, className = '' }: PremiumCardProps) {
  return <section className={`premium-card ${className}`.trim()}>{children}</section>;
}

export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-[17px] font-semibold tracking-[-0.018em] text-[#22262c]">{title}</h2>
        {subtitle ? <p className="mt-1 text-xs leading-5 text-[#7a838f]">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function SmartButton({
  children,
  className = '',
  variant = 'primary',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' }) {
  const base = 'tap-feedback inline-flex items-center justify-center rounded-[14px] px-4 py-2.5 text-sm font-medium tracking-[-0.01em]';
  const variants = {
    primary: 'border border-[#d0d6df] bg-[#ecf0f6] text-[#2f3644] hover:bg-[#e5eaf1] shadow-[0_8px_20px_rgba(66,72,88,0.08)]',
    secondary: 'border border-[#d9dde4] bg-[#f7f8fb] text-[#4f5661] hover:bg-[#f0f3f7]',
    ghost: 'text-[#4f5661] hover:bg-[#f4f6f8]',
  } as const;

  return (
    <motion.button whileTap={{ scale: 0.98 }} className={`${base} ${variants[variant]} ${className}`.trim()} {...props}>
      {children}
    </motion.button>
  );
}

export function AIStatusPill({ status = 'Ready' }: { status?: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[#dde1e8] bg-[#f8f9fb] px-3 py-1.5 text-xs font-medium text-[#4f5661]">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-200" />
      {status}
    </div>
  );
}

export function AnimatedNumber({ value, prefix = '$' }: { value: number; prefix?: string }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: 'easeOut' }}
      className="text-3xl font-semibold tracking-tight text-[#22262c]"
    >
      {prefix}
      {Math.round(value).toLocaleString()}
    </motion.span>
  );
}

export function StatCard({ title, value, caption }: { title: string; value: ReactNode; caption?: string }) {
  return (
    <PremiumCard className="space-y-1.5 p-4">
      <p className="text-[11px] uppercase tracking-[0.16em] text-[#7a838f]">{title}</p>
      <div>{value}</div>
      {caption ? <p className="text-xs leading-5 text-[#8b95a3]">{caption}</p> : null}
    </PremiumCard>
  );
}

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <PremiumCard className="space-y-3 p-6 text-center">
      <div className="mx-auto inline-flex rounded-2xl border border-white/10 bg-[#f4f6f8] p-3 text-zinc-200"><Sparkles className="h-5 w-5" /></div>
      <h3 className="text-lg font-semibold text-[#22262c]">{title}</h3>
      <p className="text-sm text-[#8b95a3]">{message}</p>
      {action ? <div className="pt-1">{action}</div> : null}
    </PremiumCard>
  );
}

export function ActionRow({ title, description, icon, onClick }: { title: string; description: string; icon: ReactNode; onClick?: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="premium-card premium-card-hover flex w-full items-start gap-3 p-4 text-left"
      type="button"
    >
      <div className="rounded-xl border border-white/9 bg-[#f8f9fb] p-2.5 text-[#4f5661]">{icon}</div>
      <div>
        <p className="text-sm font-semibold text-[#22262c]">{title}</p>
        <p className="text-xs text-[#8b95a3]">{description}</p>
      </div>
    </motion.button>
  );
}

export function InsightCard({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <PremiumCard className="space-y-2.5 p-4">
      <p className="text-base font-semibold tracking-[-0.015em] text-[#22262c]">{title}</p>
      <p className="text-sm leading-6 text-[#8b95a3]">{description}</p>
      {action}
    </PremiumCard>
  );
}

export function AIOrb({ className = '' }: { className?: string }) {
  return (
    <div className={`ai-orb ${className}`.trim()}>
      <div className="ai-orb-core" />
      <div className="ai-orb-ring" />
    </div>
  );
}
