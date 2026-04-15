'use client';

import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';

type UpgradeModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  upgradeTarget?: 'plus' | 'pro';
};

export function UpgradeModal({
  open,
  onClose,
  title = 'Upgrade required',
  description = 'You have reached your current plan limit.',
  upgradeTarget = 'plus',
}: UpgradeModalProps) {
  const router = useRouter();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/30 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-[28px] border border-black/[0.06] bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[22px] font-semibold tracking-[-0.04em] text-[#2f3640]">
              {title}
            </h2>
            <p className="mt-2 text-[14px] leading-6 text-[#6f7785]">
              {description}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/[0.05] bg-white text-[#6f7785]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 rounded-[22px] border border-black/[0.05] bg-[#f8f9fb] p-4">
          <p className="text-[15px] font-medium text-[#2f3640]">
            Recommended plan: {upgradeTarget === 'plus' ? 'Kivo Plus' : 'Kivo Pro'}
          </p>
          <p className="mt-1 text-[13px] leading-5 text-[#7a8190]">
            Unlock more messages, agent runs, file analysis, memory, and premium tools.
          </p>
        </div>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-full border border-black/[0.06] bg-white text-sm font-medium text-[#374151]"
          >
            Not now
          </button>

          <button
            type="button"
            onClick={() => router.push('/upgrade')}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-full bg-[#111111] text-sm font-medium text-white"
          >
            View plans
          </button>
        </div>
      </div>
    </div>
  );
}
