'use client';

import type { StructuredSource } from '@/agent/vNext/types';

type StructuredSourceRowProps = {
  sources: StructuredSource[];
};

export function StructuredSourceRow({ sources }: StructuredSourceRowProps) {
  if (!sources.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 text-[12px] text-[#748196]">
      <span className="font-medium text-[#8a96a8]">Built from</span>
      {sources.map((source) => (
        <span
          key={source.id}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#e6ecf4] bg-white/95 px-2.5 py-1 font-medium text-[#5a687d]"
        >
          <span className={source.used ? 'text-[#4f8f64]' : 'text-[#9ca9bb]'}>
            {source.used ? '✓' : '•'}
          </span>
          {source.label}
        </span>
      ))}
    </div>
  );
}
