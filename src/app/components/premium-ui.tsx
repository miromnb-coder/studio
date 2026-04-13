'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/chat/PageHeader';

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
    <PageHeader
      title={pageTitle}
      subtitle={pageSubtitle}
      showBack={showBack}
      onBack={showBack ? () => router.back() : undefined}
      mood="control"
    />
  );
}

export function PremiumCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`premium-card ${className}`.trim()}>{children}</section>;
}

export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-[17px] font-semibold tracking-[-0.018em] text-[#111111]">{title}</h2>
        {subtitle ? <p className="mt-1 text-xs leading-5 text-[#616773]">{subtitle}</p> : null}
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
    primary: 'border border-[#111111] bg-[#111111] text-white shadow-[0_12px_24px_rgba(17,17,17,0.16)]',
    secondary: 'border border-[#e4e7ed] bg-white text-[#1c1c1e]',
    ghost: 'text-[#616773] hover:bg-[#f6f7f8]',
  } as const;

  return (
    <motion.button whileTap={{ scale: 0.98 }} className={`${base} ${variants[variant]} ${className}`.trim()} {...props}>
      {children}
    </motion.button>
  );
}

export function EmptyState({ title, message, action }: { title: string; message: string; action?: ReactNode }) {
  return (
    <PremiumCard className="space-y-3 p-6 text-center">
      <div className="mx-auto inline-flex rounded-2xl border border-[#eceef3] bg-[#f6f8fb] p-3 text-[#8d95a3]"><Sparkles className="h-5 w-5" /></div>
      <h3 className="text-lg font-semibold text-[#111111]">{title}</h3>
      <p className="text-sm text-[#616773]">{message}</p>
      {action ? <div className="pt-1">{action}</div> : null}
    </PremiumCard>
  );
}
