'use client';

type StructuredOutcomeProps = {
  outcome?: string;
};

export function StructuredOutcome({ outcome }: StructuredOutcomeProps) {
  if (!outcome?.trim()) return null;

  return (
    <div className="flex items-center gap-2 text-[13px] leading-6 tracking-[-0.01em]">
      <span className="h-1.5 w-1.5 rounded-full bg-[#c8d0dc]" />
      <span className="text-[#5b687d] font-medium">{outcome}</span>
    </div>
  );
}
