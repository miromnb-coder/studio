'use client';

type CasualResponseViewProps = {
  text: string;
};

export function CasualResponseView({ text }: CasualResponseViewProps) {
  if (!text) return null;

  return (
    <p className="max-w-[760px] whitespace-pre-wrap text-[16px] leading-[1.75] tracking-[-0.01em] text-[#3f4b5c]">
      {text}
    </p>
  );
}
