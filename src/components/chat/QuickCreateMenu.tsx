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
            className="absolute inset-0 z-20 bg-transparent"
            aria-label="Close create menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.aside
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.985 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute bottom-[calc(108px+env(safe-area-inset-bottom))] left-4 z-30 w-[min(82vw,295px)] overflow-hidden rounded-2xl border border-[#d7dbe3] bg-[#f5f6f9] shadow-[0_14px_30px_rgba(70,76,90,0.12)] sm:left-6"
          >
            <header className="border-b border-[#e1e4ea] px-4 py-3">
              <p className="text-[13px] font-semibold tracking-[0.01em] text-[#5f6675]">Create</p>
            </header>

            <div className="p-1.5">
              {items.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={item.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(item.id)}
                      className="flex h-11 w-full items-center gap-3 rounded-[12px] px-3 text-left transition-colors hover:bg-[#eceff4]"
                    >
                      <Icon className="h-[16px] w-[16px] text-[#7b8393]" strokeWidth={1.9} />
                      <span className="text-[14px] font-medium text-[#555d6a]">{item.label}</span>
                    </button>
                    {index < items.length - 1 ? <div className="mx-3 h-px bg-[#e6e9ef]" /> : null}
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
