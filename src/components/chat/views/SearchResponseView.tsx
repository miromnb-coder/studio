'use client';

import { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Globe,
  Search as SearchIcon,
  Sparkles,
} from 'lucide-react';
import type { PresentationModel } from '@/lib/presentation/build-presentation-model';
import { PlainResponseView } from './PlainResponseView';

type SearchResponseViewProps = {
  model: PresentationModel;
};

const INITIAL_CHIP_COUNT = 3;
const INITIAL_RESULT_COUNT = 3;

const INTERNAL_CHIP_LABELS = new Set([
  'search',
  'sources',
  'results',
  'web',
  'browser_search',
  'memory',
  'gmail',
  'calendar',
]);

function hostnameFromUrl(url?: string | null): string {
  if (!url) return 'Source';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'Source';
  }
}

function shorten(text: string | undefined | null, maxLength: number): string {
  const normalized = (text ?? '').replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  if (normalized.length <= maxLength) return normalized;

  const sliced = normalized.slice(0, maxLength);
  const lastSpace = sliced.lastIndexOf(' ');
  return `${(lastSpace > 60 ? sliced.slice(0, lastSpace) : sliced).trim()}…`;
}

function isUsefulChip(label: string): boolean {
  const normalized = label.trim().toLowerCase();
  if (!normalized) return false;
  if (INTERNAL_CHIP_LABELS.has(normalized)) return false;
  if (normalized.length <= 2) return false;
  return true;
}

function buildIntroText(model: PresentationModel): string {
  const candidates = [model.summary, model.lead, model.plainText]
    .map((item) => (item ?? '').replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const unique = [...new Set(candidates)];
  if (!unique.length) return '';

  return shorten(unique[0], 260);
}

function SourceCard({
  source,
  featured = false,
}: {
  source: PresentationModel['sources'][number];
  featured?: boolean;
}) {
  const domain = source.domain || hostnameFromUrl(source.url);
  const snippet = shorten(source.snippet, featured ? 220 : 160);

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

      {snippet ? (
        <p className="mt-3 text-[13.5px] leading-[1.68] text-[#5f6d80]">
          {snippet}
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
      <span>{expanded ? 'Show less' : `Show more${hiddenCount > 0 ? ` (${hiddenCount})` : ''}`}</span>
      {expanded ? (
        <ChevronUp className="h-4 w-4" />
      ) : (
        <ChevronDown className="h-4 w-4" />
      )}
    </button>
  );
}

export function SearchResponseView({ model }: SearchResponseViewProps) {
  const [expanded, setExpanded] = useState(false);

  const filteredChips = useMemo(
    () => model.chips.filter(isUsefulChip),
    [model.chips],
  );

  const introText = buildIntroText(model);

  if (!model.sources.length) {
    return (
      <PlainResponseView
        title={model.title}
        lead={model.lead}
        text={introText || model.plainText || model.summary}
      />
    );
  }

  const featuredSource = model.sources[0];
  const remainingSources = model.sources.slice(1);

  const visibleSources = expanded
    ? remainingSources
    : remainingSources.slice(0, Math.max(INITIAL_RESULT_COUNT - 1, 0));

  const visibleChips = expanded
    ? filteredChips
    : filteredChips.slice(0, INITIAL_CHIP_COUNT);

  const hiddenSourceCount = Math.max(
    remainingSources.length - Math.max(INITIAL_RESULT_COUNT - 1, 0),
    0,
  );
  const hiddenChipCount = Math.max(filteredChips.length - INITIAL_CHIP_COUNT, 0);
  const shouldShowToggle =
    remainingSources.length > Math.max(INITIAL_RESULT_COUNT - 1, 0);

  return (
    <div className="max-w-[900px] space-y-5">
      <PlainResponseView
        title={model.title}
        lead={model.lead}
        text={introText || model.summary || model.plainText}
      />

      {visibleChips.length ? (
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

          {!expanded && hiddenChipCount > 0 ? (
            <span className="inline-flex items-center rounded-full border border-[#edf2f7] bg-[#fafcff] px-3 py-1.5 text-[12px] text-[#8a97a8]">
              +{hiddenChipCount} more
            </span>
          ) : null}
        </div>
      ) : null}

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
