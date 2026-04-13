'use client';

import { Search, X } from 'lucide-react';

type ConversationSearchProps = {
  value: string;
  onChange: (value: string) => void;
};

export function ConversationSearch({
  value,
  onChange,
}: ConversationSearchProps) {
  const hasValue = value.trim().length > 0;

  return (
    <div className="sticky top-0 z-10 mb-3">
      <div className="rounded-[22px] border border-[#dde2ea] bg-[#f8fafd]/96 p-2 shadow-[0_8px_18px_rgba(60,68,82,0.05)] backdrop-blur-xl">
        <label className="flex items-center gap-2.5 rounded-[16px] border border-[#e2e7ef] bg-white px-3 py-2.5 text-sm text-[#5f6877] shadow-[0_3px_10px_rgba(60,68,82,0.04)] transition focus-within:border-[#d0d7e2] focus-within:shadow-[0_6px_16px_rgba(60,68,82,0.06)]">
          <Search
            className="h-4 w-4 shrink-0 text-[#8d96a4]"
            strokeWidth={2}
          />

          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Search title, message, tag, agent"
            className="w-full bg-transparent text-[14px] text-[#2f3744] outline-none placeholder:text-[#9aa2af]"
          />

          {hasValue ? (
            <button
              type="button"
              onClick={() => onChange('')}
              aria-label="Clear search"
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#e2e7ef] bg-[#f8fafd] text-[#8d96a4] transition hover:bg-[#f1f4f8] active:scale-[0.96]"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2.2} />
            </button>
          ) : null}
        </label>
      </div>
    </div>
  );
}
