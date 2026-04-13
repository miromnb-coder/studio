'use client';

type ActionSuggestionsProps = {
  actions: string[];
  onActionClick?: (action: string) => void;
};

export function ActionSuggestions({ actions, onActionClick }: ActionSuggestionsProps) {
  if (!actions.length) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {actions.slice(0, 4).map((action, index) => (
        <button
          key={`${action}-${index}`}
          type="button"
          onClick={() => onActionClick?.(action)}
          className="rounded-full border border-[#d8dee8] bg-white px-3 py-1.5 text-[12px] font-medium text-[#4b5566] transition hover:border-[#c2cadd] hover:bg-[#f8f9fc]"
        >
          {action}
        </button>
      ))}
    </div>
  );
}
