'use client';

import { X } from 'lucide-react';

export function ConversationHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="mb-3">
      <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-[#cfd6df]" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[21px] font-medium tracking-[-0.025em] text-[#262c36]">Conversations</p>
          <p className="mt-1 text-xs text-[#7c8593]">Continue your work instantly</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close conversations drawer"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#d7dde6] bg-white text-[#6a7280]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
