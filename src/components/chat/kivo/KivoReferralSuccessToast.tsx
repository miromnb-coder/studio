'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, X } from 'lucide-react';

type KivoReferralSuccessToastProps = {
  open: boolean;
  title: string;
  detail: string;
  onClose: () => void;
};

export function KivoReferralSuccessToast({
  open,
  title,
  detail,
  onClose,
}: KivoReferralSuccessToastProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.985 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="pointer-events-none fixed inset-x-0 top-[86px] z-[80] mx-auto w-full max-w-[560px] px-4"
        >
          <div className="pointer-events-auto mx-auto flex items-start gap-3 rounded-[22px] border border-[#d8e7d8] bg-[rgba(255,255,255,0.94)] px-4 py-3 shadow-[0_16px_34px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
            <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eef8ee] text-[#2f7a46]">
              <CheckCircle2 className="h-5 w-5" strokeWidth={2} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold tracking-[-0.02em] text-[#24412d]">
                {title}
              </p>
              <p className="mt-1 text-[13px] leading-5 text-[#5b6b62]">
                {detail}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close referral toast"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#7b8a80] transition hover:bg-black/[0.04]"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
