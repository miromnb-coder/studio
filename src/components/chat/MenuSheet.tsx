'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { type MenuRow, MenuSection } from './MenuSection';

export type { MenuRow } from './MenuSection';

type MenuSheetProps = {
  open: boolean;
  primaryRows: MenuRow[];
  secondaryRows: MenuRow[];
  onClose: () => void;
  onPrimaryClick: (row: MenuRow) => void;
  onSecondaryClick: (row: MenuRow) => void;
  onSignOut: () => void;
};

export function MenuSheet({
  open,
  primaryRows,
  secondaryRows,
  onClose,
  onPrimaryClick,
  onSecondaryClick,
  onSignOut,
}: MenuSheetProps) {
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

            <MenuSection rows={primaryRows} onClick={onPrimaryClick} />
            <MenuSection title="Secondary" rows={secondaryRows} onClick={onSecondaryClick} />

            <div className="mt-5 overflow-hidden rounded-[18px] border border-[#d7dbe2] bg-[#f5f6f9] shadow-[0_8px_16px_rgba(66,72,88,0.05)]">
              <button
                type="button"
                onClick={onSignOut}
                className="flex h-[56px] w-full items-center gap-3 px-4 text-left"
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
