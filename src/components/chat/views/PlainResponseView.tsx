'use client';

type PlainResponseViewProps = {
  title?: string;
  lead?: string;
  text: string;
};

export function PlainResponseView({ title, lead, text }: PlainResponseViewProps) {
  return (
    <div className="max-w-[780px] space-y-3">
      {title ? (
        <h3 className="text-[24px] font-semibold leading-[1.16] tracking-[-0.03em] text-[#1f2937]">
          {title}
        </h3>
      ) : null}
      {lead ? (
        <p className="text-[18px] leading-[1.65] tracking-[-0.015em] text-[#2f3b4b]">{lead}</p>
      ) : null}
      <p className="whitespace-pre-wrap text-[16px] leading-[1.75] tracking-[-0.01em] text-[#3f4b5c]">
        {text}
      </p>
    </div>
  );
}
