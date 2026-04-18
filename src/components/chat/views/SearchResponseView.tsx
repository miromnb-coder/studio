'use client';

import { Globe, Tags } from 'lucide-react';
import type { PresentationModel } from '@/lib/presentation/build-presentation-model';

type SearchResponseViewProps = {
  model: PresentationModel;
};

export function SearchResponseView({ model }: SearchResponseViewProps) {
  return (
    <div className="max-w-[840px] space-y-4">
      <p className="whitespace-pre-wrap text-[16px] leading-[1.75] tracking-[-0.01em] text-[#3f4b5c]">
        {model.summary}
      </p>

      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e3e9f2] bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7b8899]">
          <Globe className="h-3.5 w-3.5" />
          Live sources
        </span>
        {model.chips.map((chip) => (
          <span key={chip} className="inline-flex items-center gap-1.5 rounded-full border border-[#e6ecf4] bg-[#fbfdff] px-3 py-1.5 text-[12px] text-[#637489]">
            <Tags className="h-3.5 w-3.5" />
            {chip}
          </span>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {model.sources.map((source) => (
          <a key={source.id} href={source.url || '#'} target="_blank" rel="noreferrer" className="rounded-[20px] border border-[#e7edf5] bg-[linear-gradient(180deg,#ffffff,#fbfdff)] p-4 hover:shadow-[0_8px_18px_rgba(15,23,42,0.05)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#93a0b2]">{source.domain}</p>
            <p className="mt-1 text-[15px] font-semibold text-[#263244]">{source.title}</p>
            {source.snippet ? <p className="mt-2 text-[13px] leading-[1.6] text-[#5f6d80]">{source.snippet}</p> : null}
          </a>
        ))}
      </div>
    </div>
  );
}
