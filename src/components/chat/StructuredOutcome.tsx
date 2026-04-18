'use client';

type StructuredOutcomeProps = {
  outcome?: string;
};

export function StructuredOutcome({ outcome }: StructuredOutcomeProps) {
  if (!outcome?.trim()) return null;

  return (
    <p className="text-[13px] font-medium tracking-[-0.01em] text-[#73829a]">
      Outcome: <span className="text-[#54627a]">{outcome}</span>
    </p>
  );
}
