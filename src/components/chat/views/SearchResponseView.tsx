'use client';

import { Globe, Tags } from 'lucide-react';
import type { PresentationModel } from '@/lib/presentation/build-presentation-model';
import { PlainResponseView } from './PlainResponseView';

type SearchResponseViewProps = {
  model: PresentationModel;
};

function SourceCard({
  domain,
  title,
  snippet,
  url,
}: {
  domain: string;
  title: string;
  snippet?: string;
  url?: string;
}) {
  const content = (
    <>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#93a0b2]">
        {domain}
      </p>
      <p className="mt-1 text-[15px] font-semibold leading-[1.4] text-[#263244]">
        {title}
      </p>
      {snippet ? (
        <p className="mt-2 text-[13px] leading-[1.6] text-[#5f6d80]">{snippet}</p>
      ) : null}
    </>
  );

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="rounded-[18px] border border-[#e7edf5] bg-[linear-gradient(180deg,#ffffff,#fbfdff)] p-4 transition hover:shadow-[0_8px_18px_rgba(15,23,42,0.05)]"
      >
        {content}
      </a>
    );
  }

  return (
    <div className="rounded-[18px] border border-[#e7edf5] bg-[linear-gradient(180deg,#ffffff,#fbfdff)] p-4">
      {content}
    </div>
  );
}

export function SearchResponseView({ model }: SearchResponseViewProps) {
  if (!model.sources.length) {
    return (
      <PlainResponseView
        title={model.title}
        lead={model.lead}
        text={model.plainText || model.summary}
      />
    );
  }

  return (
    <div className="max-w-[840px] space-y-4">
      <PlainResponseView
        title={model.title}
        lead={model.lead}
        text={model.summary}
      />

      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e3e9f2] bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7b8899]">
          <Globe className="h-3.5 w-3.5" />
          Live sources
        </span>

        {model.chips.map((chip) => (
          <span
            key={chip}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#e6ecf4] bg-[#fbfdff] px-3 py-1.5 text-[12px] text-[#637489]"
          >
            <Tags className="h-3.5 w-3.5" />
            {chip}
          </span>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {model.sources.map((source) => (
          <SourceCard
            key={source.id}
            domain={source.domain}
            title={source.title}
            snippet={source.snippet}
            url={source.url || undefined}
          />
        ))}
      </div>
    </div>
  );
}
