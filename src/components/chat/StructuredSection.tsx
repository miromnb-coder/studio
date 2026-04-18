'use client';

import type { StructuredSection as StructuredSectionModel } from '@/agent/vNext/types';

type StructuredSectionProps = {
  section: StructuredSectionModel;
};

const TONE_ACCENTS: Record<NonNullable<StructuredSectionModel['tone']>, string> = {
  default: 'before:bg-[#e3e9f1] text-[#334155]',
  important: 'before:bg-[#f0c46a] text-[#5a3b09]',
  success: 'before:bg-[#8cc79b] text-[#1f5131]',
  warning: 'before:bg-[#e3a0a0] text-[#6a2b2b]',
};

const LABEL_STYLES: Record<NonNullable<StructuredSectionModel['tone']>, string> = {
  default: 'text-[#8d98a8]',
  important: 'text-[#c28b19]',
  success: 'text-[#5d9b6c]',
  warning: 'text-[#c37a7a]',
};

export function StructuredSection({ section }: StructuredSectionProps) {
  const tone = section.tone ?? 'default';

  return (
    <section
      className={`relative space-y-1.5 pl-4 before:absolute before:left-0 before:top-0 before:h-full before:w-[2px] before:rounded-full ${TONE_ACCENTS[tone]}`}
    >
      {section.label ? (
        <h4
          className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${LABEL_STYLES[tone]}`}
        >
          {section.label}
        </h4>
      ) : null}

      <p className="text-[15px] leading-[1.68] tracking-[-0.012em] text-current">
        {section.content}
      </p>
    </section>
  );
}
