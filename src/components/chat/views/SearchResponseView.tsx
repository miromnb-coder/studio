'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, Globe, Search as SearchIcon, Sparkles } from 'lucide-react';
import type { PresentationModel } from '@/lib/presentation/build-presentation-model';
import { PlainResponseView } from './PlainResponseView';

type SearchResponseViewProps = {
  model: PresentationModel;
};

const INITIAL_CHIP_COUNT = 4;
const INITIAL_SOURCE_COUNT = 3;

function hostnameFromUrl(url?: string | null): string {
  if (!url) return 'Source';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'Source';
  }
}

function SourceCard({
  source,
  featured = false,
}: {
  source: PresentationModel['sources'][number];
  featured?: boolean;
}) {
  const domain = source.domain || hostnameFromUrl(source.url);
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#91a0b3]">
            {domain}
          </p>
          <p
            className={`mt-1 text-[15px] font-semibold leading-[1.42] tracking-[-0.012em] text-[#243041] ${
              featured ? 'sm:text-[16px]' : ''
            }`}
          >
            {source.title}
          </p>
        </div>

        {source.url ? (
          <span className="inline-flex shrink-0 items-center justify-center rounded-full border border-[#e7edf5] bg-white p-2 text-[#7d8ca0]">
            <ExternalLink className="h-3.5 w-3.5" />
          </span>
        ) : null}
      </div>

      {source.snippet ? (
        <p className="mt-3 text-[13.5px] leading-[1.68] text-[#5f6d80]">
          {source.snippet}
        </p>
      ) : null}
    </>
  );

  const className = featured
    ? 'rounded-[22px] border border-[#e7edf5] bg-[linear-gradient(180deg,#ffffff,#fbfdff)] p-5 transition hover:shadow-[0_12px_28px_rgba(15,23,42,0.06)]'
    : 'rounded-[20px] border border-[#e7edf5] bg-[linear-gradient(180deg,#ffffff,#fbfdff)] p-4 transition hover:shadow-[0_10px_24px_rgba(15,23,42,0.05)]';

  if (source.url) {
    return (
      <a
        href={source.url}
        target="_blank"
        rel="noreferrer"
        className={className}
      >
        {content}
      </a>
    );
  }

  return <div className={className}>{content}</div>;
}

function SectionLabel({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[#e6ecf4] bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.13em] text-[#7d8ca0]">
      {icon}
      <span>{label}</span>
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
          ? 'Show less'
          : `Show more sources${hiddenCount > 0 ? ` (${hiddenCount})` : ''}`}
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

  const featuredSource = model.sources[0];
  const restSources = model.sources.slice(1);

  const visibleSources = expanded
    ? restSources
    : restSources.slice(0, Math.max(INITIAL_SOURCE_COUNT - 1, 0));

  const visibleChips = expanded
    ? model.chips
    : model.chips.slice(0, INITIAL_CHIP_COUNT);

  const hiddenSourceCount = Math.max(restSources.length - Math.max(INITIAL_SOURCE_COUNT - 1, 0), 0);
  const hiddenChipCount = Math.max(model.chips.length - INITIAL_CHIP_COUNT, 0);

  const shouldShowToggle = restSources.length > Math.max(INITIAL_SOURCE_COUNT - 1, 0);

  const chipSummary = useMemo(() => {
    if (expanded || hiddenChipCount <= 0) return null;
    return `+${hiddenChipCount} more`;
  }, [expanded, hiddenChipCount]);

  return (
    <div className="max-w-[900px] space-y-5">
      <PlainResponseView
        title={model.title}
        lead={model.lead}
        text={model.summary || model.plainText}
      />

      <div className="flex flex-wrap items-center gap-2.5">
        <SectionLabel
          icon={<SearchIcon className="h-3.5 w-3.5" />}
          label="Search"
        />

        {visibleChips.map((chip) => (
          <span
            key={chip}
            className="inline-flex items-center rounded-full border border-[#e9eef5] bg-[#fbfdff] px-3 py-1.5 text-[12px] text-[#637489]"
          >
            {chip}
          </span>
        ))}

        {chipSummary ? (
          <span className="inline-flex items-center rounded-full border border-[#edf2f7] bg-[#fafcff] px-3 py-1.5 text-[12px] text-[#8a97a8]">
            {chipSummary}
          </span>
        ) : null}
      </div>

      {featuredSource ? (
        <div className="space-y-3">
          <SectionLabel
            icon={<Sparkles className="h-3.5 w-3.5" />}
            label="Top result"
          />
          <SourceCard source={featuredSource} featured />
        </div>
      ) : null}

      {visibleSources.length ? (
        <div className="space-y-3">
          <SectionLabel
            icon={<Globe className="h-3.5 w-3.5" />}
            label="Sources"
          />

          <div className="grid gap-3 sm:grid-cols-2">
            {visibleSources.map((source) => (
              <SourceCard key={source.id} source={source} />
            ))}
          </div>
        </div>
      ) : null}

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
