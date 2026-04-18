'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Globe, Tags } from 'lucide-react';
import type { PresentationModel } from '@/lib/presentation/build-presentation-model';
import { PlainResponseView } from './PlainResponseView';

type SearchResponseViewProps = {
  model: PresentationModel;
};

const INITIAL_CHIP_COUNT = 3;
const INITIAL_SOURCE_COUNT = 2;

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

function ToggleButton({
  expanded,
  hiddenCount,
  onClick,
}: {
  expanded: boolean;
  hiddenCount: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full border border-[#dde5ef] bg-white px-4 py-2 text-[13px] font-medium text-[#44566b] transition hover:border-[#cfd9e6] hover:bg-[#fbfdff]"
    >
      <span>
        {expanded
          ? 'Näytä vähemmän'
          : `Näytä lisää lähteitä${hiddenCount > 0 ? ` (${hiddenCount})` : ''}`}
      </span>
      {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
    </button>
  );
}

export function SearchResponseView({ model }: SearchResponseViewProps) {
  const [expanded, setExpanded] = useState(false);

  if (!model.sources.length) {
    return (
      <PlainResponseView
        title={model.title}
        lead={model.lead}
        text={model.plainText || model.summary}
      />
    );
  }

  const visibleSources = expanded
    ? model.sources
    : model.sources.slice(0, INITIAL_SOURCE_COUNT);

  const visibleChips = expanded
    ? model.chips
    : model.chips.slice(0, INITIAL_CHIP_COUNT);

  const hiddenSourceCount = Math.max(model.sources.length - INITIAL_SOURCE_COUNT, 0);
  const hiddenChipCount = Math.max(model.chips.length - INITIAL_CHIP_COUNT, 0);

  const shouldShowToggle = model.sources.length > INITIAL_SOURCE_COUNT;
  const chipSummary = useMemo(() => {
    if (expanded || hiddenChipCount <= 0) return null;
    return `+${hiddenChipCount} more`;
  }, [expanded, hiddenChipCount]);

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

        {visibleChips.map((chip) => (
          <span
            key={chip}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#e6ecf4] bg-[#fbfdff] px-3 py-1.5 text-[12px] text-[#637489]"
          >
            <Tags className="h-3.5 w-3.5" />
            {chip}
          </span>
        ))}

        {chipSummary ? (
          <span className="inline-flex items-center rounded-full border border-[#edf2f7] bg-[#fafcff] px-3 py-1.5 text-[12px] text-[#8a97a8]">
            {chipSummary}
          </span>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {visibleSources.map((source) => (
          <SourceCard
            key={source.id}
            domain={source.domain}
            title={source.title}
            snippet={source.snippet}
            url={source.url || undefined}
          />
        ))}
      </div>

      {shouldShowToggle ? (
        <div className="pt-1">
          <ToggleButton
            expanded={expanded}
            hiddenCount={hiddenSourceCount}
            onClick={() => setExpanded((value) => !value)}
          />
        </div>
      ) : null}
    </div>
  );
}
