'use client';

import type { ComponentType } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type BottomActionSheetProps = {
  open: boolean;
  title: string;
  items: Array<{
    id: string;
    label: string;
    icon: ComponentType<{ className?: string; strokeWidth?: number }>;
    subtitle?: string;
    disabled?: boolean;
  }>;
  onClose: () => void;
  onSelect: (id: string) => void;
};

export function BottomActionSheet({
  open,
  title,
  items,
  onClose,
  onSelect,
}: BottomActionSheetProps) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            className="absolute inset-0 z-20 bg-[#8f97a610]"
            aria-label={`Close ${title}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.aside
            initial={{ y: 24, opacity: 0.84 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 26, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute inset-x-4 bottom-[calc(96px+env(safe-area-inset-bottom))] z-30 rounded-[24px] border border-[#d7dbe2] bg-[#f4f5f8] p-3 shadow-[0_12px_24px_rgba(66,72,88,0.08)] sm:inset-x-6"
          >
            <p className="mb-2 px-1 text-[14px] font-medium text-[#636a77]">{title}</p>

            {items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => !item.disabled && onSelect(item.id)}
                  disabled={item.disabled}
                  className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-2 py-1 text-left transition ${
                    item.disabled
                      ? 'cursor-not-allowed opacity-50'
                      : 'tap-feedback hover:bg-[#eaedf2]'
                  }`}
                >
                  <Icon
                    className="h-[18px] w-[18px] text-[#7d8492]"
                    strokeWidth={1.9}
                  />
                  <span className="flex-1">
                    <span className="block text-sm text-[#575e6b]">{item.label}</span>
                    {item.subtitle ? (
                      <span className="block text-xs text-[#8a92a0]">{item.subtitle}</span>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
