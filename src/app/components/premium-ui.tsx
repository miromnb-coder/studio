'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

type AppShellProps = {
  children: ReactNode;
  className?: string;
};

export function AppShell({ children, className = '' }: AppShellProps) {
  return <main className={`screen premium-bg pb-32 ${className}`.trim()}>{children}</main>;
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
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold tracking-[-0.01em] text-zinc-100">{title}</h2>
        {subtitle ? <p className="text-xs text-zinc-400">{subtitle}</p> : null}
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
  const base = 'tap-feedback inline-flex items-center justify-center rounded-[14px] px-4 py-2.5 text-sm font-medium';
  const variants = {
    primary: 'border border-white/20 bg-white/[0.14] text-zinc-100 hover:bg-white/[0.2] shadow-[0_8px_22px_rgba(0,0,0,0.35)]',
    secondary: 'border border-white/10 bg-white/[0.04] text-zinc-200 hover:bg-white/[0.07]',
    ghost: 'text-zinc-300 hover:bg-white/[0.05]',
  } as const;

  return (
    <motion.button whileTap={{ scale: 0.98 }} className={`${base} ${variants[variant]} ${className}`.trim()} {...props}>
      {children}
    </motion.button>
  );
}

export function AIStatusPill({ status = 'Ready' }: { status?: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-300">
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
      className="text-3xl font-semibold tracking-tight text-zinc-100"
    >
      {prefix}
      {Math.round(value).toLocaleString()}
    </motion.span>
  );
}

export function StatCard({ title, value, caption }: { title: string; value: ReactNode; caption?: string }) {
  return (
    <PremiumCard className="space-y-1.5 p-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">{title}</p>
      <div>{value}</div>
      {caption ? <p className="text-xs text-zinc-400">{caption}</p> : null}
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
      <div className="mx-auto inline-flex rounded-2xl border border-white/15 bg-white/[0.06] p-3 text-zinc-200"><Sparkles className="h-5 w-5" /></div>
      <h3 className="text-lg font-semibold text-zinc-100">{title}</h3>
      <p className="text-sm text-zinc-400">{message}</p>
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
      <div className="rounded-xl border border-white/15 bg-white/[0.04] p-2.5 text-zinc-300">{icon}</div>
      <div>
        <p className="text-sm font-semibold text-zinc-100">{title}</p>
        <p className="text-xs text-zinc-400">{description}</p>
      </div>
    </motion.button>
  );
}

export function InsightCard({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <PremiumCard className="space-y-2 p-4">
      <p className="text-base font-semibold text-zinc-100">{title}</p>
      <p className="text-sm text-zinc-400">{description}</p>
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
