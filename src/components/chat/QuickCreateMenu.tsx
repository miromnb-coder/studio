'use client';

import type { ComponentType } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type QuickCreateItem = {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
};

type QuickCreateMenuProps = {
  open: boolean;
  items: QuickCreateItem[];
  onClose: () => void;
  onSelect: (id: string) => void;
};

export function QuickCreateMenu({ open, items, onClose, onSelect }: QuickCreateMenuProps) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            className="fixed inset-0 z-40 bg-transparent"
            aria-label="Close create menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.aside
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.985 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onClick={(event) => event.stopPropagation()}
            className="fixed bottom-[calc(116px+env(safe-area-inset-bottom))] left-4 z-50 w-[min(86vw,312px)] overflow-hidden rounded-2xl border border-[#d8dde5] bg-[#f7f8fb] shadow-[0_18px_34px_rgba(53,61,75,0.18)] sm:left-6"
          >
            <header className="border-b border-[#e2e6ed] px-4 py-3">
              <p className="text-[13px] font-semibold tracking-[0.02em] text-[#5d6574]">Quick Create</p>
            </header>

            <div className="p-1.5">
              {items.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={item.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(item.id)}
                      className="flex h-12 w-full items-center gap-3 rounded-[12px] px-3 text-left transition-colors hover:bg-[#edf1f7]"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e1e5ec] bg-white text-[#6b7382]">
                        <Icon className="h-[16px] w-[16px]" strokeWidth={1.9} />
                      </span>
                      <span className="text-[14px] font-medium text-[#4f5663]">{item.label}</span>
                    </button>
                    {index < items.length - 1 ? <div className="mx-3 h-px bg-[#e7eaf0]" /> : null}
                  </div>
                );
              })}
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
