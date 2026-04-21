'use client';

export function KivoThinkingState({
  text = 'Thinking...',
}: {
  text?: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-black/[0.06] bg-white px-3 py-2 text-[13px] text-[#6B7280] shadow-[0_8px_18px_rgba(0,0,0,0.03)]">
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-black/20" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-black/55" />
      </span>
      <span>{text}</span>
    </div>
  );
}
