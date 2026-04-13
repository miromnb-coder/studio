'use client';

export type ConversationFilter =
  | 'all'
  | 'recent'
  | 'agents'
  | 'saved'
  | 'unfinished';

const FILTERS: Array<{
  id: ConversationFilter;
  label: string;
}> = [
  { id: 'all', label: 'All' },
  { id: 'recent', label: 'Recent' },
  { id: 'agents', label: 'Agents' },
  { id: 'saved', label: 'Saved' },
  { id: 'unfinished', label: 'Unfinished' },
];

type ConversationFiltersProps = {
  value: ConversationFilter;
  onChange: (next: ConversationFilter) => void;
};

export function ConversationFilters({
  value,
  onChange,
}: ConversationFiltersProps) {
  return (
    <div className="mb-3">
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none [mask-image:linear-gradient(to_right,transparent,black_8px,black_calc(100%-8px),transparent)]">
        {FILTERS.map((filter) => {
          const active = filter.id === value;

          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => onChange(filter.id)}
              aria-pressed={active}
              className={`shrink-0 rounded-full border px-3.5 py-2 text-[12px] font-medium tracking-[-0.01em] transition duration-200 active:scale-[0.98] ${
                active
                  ? 'border-[#d2d8e2] bg-[#eef2f7] text-[#2d3441] shadow-[0_8px_18px_rgba(60,68,82,0.07)]'
                  : 'border-[#dde2ea] bg-white/92 text-[#6c7482] hover:bg-[#f7f9fc]'
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
