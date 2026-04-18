'use client';

import type { StructuredSource } from '@/agent/vNext/types';

type StructuredSourceRowProps = {
  sources: StructuredSource[];
};

export function StructuredSourceRow({ sources }: StructuredSourceRowProps) {
  if (!sources.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] leading-6">
      <span className="font-medium tracking-[-0.01em] text-[#97a1af]">
        Built from
      </span>

      {sources.map((source) => (
        <span
          key={source.id}
          className="inline-flex items-center gap-1.5 font-medium tracking-[-0.01em] text-[#5f6c80]"
        >
          <span
            className={
              source.used
                ? 'text-[#5fa271]'
                : 'text-[#a4afbe]'
            }
          >
            {source.used ? '✓' : '•'}
          </span>

          <span>{source.label}</span>
        </span>
      ))}
    </div>
  );
}
