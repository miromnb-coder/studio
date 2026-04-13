'use client';

export type ConversationFilter = 'all' | 'recent' | 'agents' | 'saved' | 'unfinished';

const FILTERS: Array<{ id: ConversationFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'recent', label: 'Recent' },
  { id: 'agents', label: 'Agents' },
  { id: 'saved', label: 'Saved' },
  { id: 'unfinished', label: 'Unfinished' },
];

export function ConversationFilters({
  value,
  onChange,
}: {
  value: ConversationFilter;
  onChange: (next: ConversationFilter) => void;
}) {
  return (
    <div className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1">
      {FILTERS.map((filter) => {
        const active = filter.id === value;
        return (
          <button
            key={filter.id}
            type="button"
            onClick={() => onChange(filter.id)}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium tracking-[-0.01em] transition ${
              active
                ? 'border-[#c8cfd9] bg-[#e6ebf2] text-[#2d3441] shadow-[0_8px_20px_rgba(60,68,82,0.08)]'
                : 'border-[#d7dde6] bg-white/90 text-[#697282]'
            }`}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
