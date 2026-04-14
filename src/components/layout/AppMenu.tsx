'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, LogOut } from 'lucide-react';
import type { SharedMenuRow } from '@/components/chat/menu-config';

type AppMenuProps = {
  open: boolean;
  pathname: string;
  primaryRows: SharedMenuRow[];
  secondaryRows: SharedMenuRow[];
  onClose: () => void;
  onSelect: (row: SharedMenuRow) => void;
  onSignOut: () => void;
};

type AppMenuSectionProps = {
  rows: SharedMenuRow[];
  pathname: string;
  onSelect: (row: SharedMenuRow) => void;
  title?: string;
};

function AppMenuSection({ rows, pathname, onSelect, title }: AppMenuSectionProps) {
  return (
    <section>
      {title ? <p className="mb-2 mt-5 px-2 text-[13px] font-normal text-[#8b919f]">{title}</p> : null}
      <div className="overflow-hidden rounded-[18px] border border-[#d7dbe2] bg-[#f5f6f9] shadow-[0_8px_16px_rgba(66,72,88,0.05)]">
        {rows.map((row) => {
          const Icon = row.icon;
          const isActive = Boolean(row.href && (pathname === row.href || pathname.startsWith(`${row.href}/`)));

          return (
            <button
              key={row.id}
              type="button"
              onClick={() => onSelect(row)}
              className={`tap-feedback flex h-[56px] w-full items-center gap-3 border-b border-[#e2e5eb] px-4 text-left transition-colors last:border-b-0 ${
                isActive ? 'bg-[#e9edf4]' : 'hover:bg-[#eceff4]'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-[#4e5d75]' : 'text-[#7d8492]'}`} strokeWidth={1.8} />
              <span className={`flex-1 text-[16px] font-normal ${isActive ? 'text-[#354153]' : 'text-[#59606d]'}`}>{row.label}</span>

              {row.badge ? (
                <span className="rounded-full bg-[#e8ebf1] px-2 py-0.5 text-[11px] font-medium text-[#9097a4]">
                  {row.badge}
                </span>
              ) : null}

              <ChevronRight className="h-5 w-5 text-[#a3a9b5]" strokeWidth={1.8} />
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function AppMenu({
  open,
  pathname,
  primaryRows,
  secondaryRows,
  onClose,
  onSelect,
  onSignOut,
}: AppMenuProps) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 z-20 bg-[#7f87940f]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.aside
            initial={{ y: 54, opacity: 0.92 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 48, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 34, mass: 0.95 }}
            className="absolute inset-x-0 bottom-0 z-30 max-h-[calc(100vh-132px)] overflow-y-auto rounded-t-[32px] border-t border-[#d9dde4] bg-[#ececf1] px-4 pb-[calc(24px+env(safe-area-inset-bottom))] pt-5 shadow-[0_-14px_30px_rgba(66,72,88,0.1)] sm:px-6"
          >
            <div className="mx-auto mb-5 h-[5px] w-14 rounded-full bg-[#d1d5dc]" />
            <h2 className="mb-3 px-2 text-[18px] font-medium tracking-[-0.02em] text-[#5b6270]">Menu</h2>

            <AppMenuSection rows={primaryRows} pathname={pathname} onSelect={onSelect} />
            <AppMenuSection title="Account" rows={secondaryRows} pathname={pathname} onSelect={onSelect} />

            <div className="mt-5 overflow-hidden rounded-[18px] border border-[#d7dbe2] bg-[#f5f6f9] shadow-[0_8px_16px_rgba(66,72,88,0.05)]">
              <button
                type="button"
                onClick={onSignOut}
                className="tap-feedback flex h-[56px] w-full items-center gap-3 px-4 text-left"
              >
                <LogOut className="h-5 w-5 text-[#7d8492]" strokeWidth={1.8} />
                <span className="flex-1 text-[16px] font-normal text-[#59606d]">Sign Out</span>
              </button>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
