'use client';

import { Search } from 'lucide-react';

export function ConversationSearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="sticky top-0 z-10 mb-3 rounded-2xl border border-[#d7dde6] bg-[#f8fafc]/95 p-2 backdrop-blur">
      <label className="flex items-center gap-2.5 rounded-xl border border-[#d8dee8] bg-white px-3 py-2 text-sm text-[#5f6877] shadow-[0_6px_12px_rgba(66,72,88,0.05)]">
        <Search className="h-4 w-4 text-[#8b95a3]" />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full bg-transparent text-sm outline-none placeholder:text-[#9ba3af]"
          placeholder="Search title, message, tag, agent"
        />
      </label>
    </div>
  );
}
