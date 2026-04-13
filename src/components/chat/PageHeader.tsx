'use client';

import { ArrowLeft, Menu } from 'lucide-react';
import { useGlobalMenu } from '@/app/components/global-menu-provider';

type PageHeaderProps = {
  title: string;
  onBack?: () => void;
  showBack?: boolean;
  subtitle?: string;
};

export function PageHeader({ title, onBack, showBack = false, subtitle }: PageHeaderProps) {
  const { openMenu } = useGlobalMenu();

  return (
    <header className="mb-4 rounded-[24px] border border-[#d9dde4] bg-[#f4f5f8] px-4 pb-4 pt-3 shadow-[0_8px_18px_rgba(66,72,88,0.06)]">
      <div className="flex h-[48px] items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          className={`inline-flex h-[40px] w-[40px] items-center justify-center rounded-full border border-[#d6dbe3] bg-[#eef1f5] text-[#5f6775] transition ${showBack ? '' : 'pointer-events-none opacity-0'}`}
        >
          <ArrowLeft className="h-[20px] w-[20px]" strokeWidth={1.9} />
        </button>

        <h1 className="text-[23px] font-medium tracking-[-0.03em] text-[#4c5361]">{title}</h1>

        <button
          type="button"
          onClick={openMenu}
          aria-label="Open menu"
          className="inline-flex h-[40px] w-[40px] items-center justify-center rounded-full border border-[#d5d9e1] bg-[#f1f2f6] text-[#767e8b]"
        >
          <Menu className="h-[19px] w-[19px]" strokeWidth={1.8} />
        </button>
      </div>

      {subtitle ? <p className="mt-1.5 text-base text-[#6f7786]">{subtitle}</p> : null}
    </header>
  );
}
