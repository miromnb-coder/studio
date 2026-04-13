'use client';

import { X } from 'lucide-react';

type ConversationHeaderProps = {
  onClose: () => void;
};

export function ConversationHeader({
  onClose,
}: ConversationHeaderProps) {
  return (
    <div className="mb-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[22px] font-semibold tracking-[-0.03em] text-[#262d37]">
            Conversations
          </p>

          <p className="mt-1 text-[12px] leading-snug text-[#7d8695]">
            Continue your work instantly
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close conversations drawer"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#dde2ea] bg-white text-[#66707e] shadow-[0_2px_8px_rgba(45,52,64,0.05)] transition hover:bg-[#f7f9fc] active:scale-[0.97]"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
