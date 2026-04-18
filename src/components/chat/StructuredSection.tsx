'use client';

import type { StructuredSection as StructuredSectionModel } from '@/agent/vNext/types';

type StructuredSectionProps = {
  section: StructuredSectionModel;
};

const TONE_STYLES: Record<NonNullable<StructuredSectionModel['tone']>, string> = {
  default: 'border-[#e8edf4] bg-[#f9fbfe] text-[#334155]',
  important: 'border-[#f4deb1] bg-[#fffaf1] text-[#5a3b09]',
  success: 'border-[#d7ecd9] bg-[#f3fbf4] text-[#1f5131]',
  warning: 'border-[#f2d4d4] bg-[#fff6f6] text-[#6a2b2b]',
};

export function StructuredSection({ section }: StructuredSectionProps) {
  const tone = section.tone ?? 'default';

  return (
    <section className={`rounded-2xl border px-4 py-3.5 ${TONE_STYLES[tone]}`}>
      {section.label ? (
        <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-current/75">
          {section.label}
        </h4>
      ) : null}
      <p className="text-[15px] leading-[1.6] tracking-[-0.012em] text-current/95">
        {section.content}
      </p>
    </section>
  );
}
