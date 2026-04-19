'use client';

import { CheckCircle2, Circle, Sparkles } from 'lucide-react';
import type { PresentationModel } from '@/lib/presentation/build-presentation-model';
import { PlainResponseView } from './PlainResponseView';

type CompareResponseViewProps = {
  model: PresentationModel;
};

function pickWinner(items: PresentationModel['compareItems']) {
  return items[0] ?? null;
}

function OptionCard({
  item,
  featured = false,
}: {
  item: PresentationModel['compareItems'][number];
  featured?: boolean;
}) {
  return (
    <div
      className={`rounded-[22px] border p-4 ${
        featured
          ? 'border-[rgba(59,130,246,0.16)] bg-[linear-gradient(180deg,rgba(248,251,255,0.98),rgba(255,255,255,0.98))]'
          : 'border-[#e7edf5] bg-[linear-gradient(180deg,#ffffff,#fbfdff)]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15px] font-semibold leading-[1.42] tracking-[-0.012em] text-[#243041]">
            {item.option}
          </p>
          {item.source ? (
            <p className="mt-1 text-[12px] text-[#7b8899]">{item.source}</p>
          ) : null}
        </div>

        {featured ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(59,130,246,0.16)] bg-[rgba(239,246,255,0.9)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#355678]">
            <Sparkles className="h-3 w-3" />
            Best fit
          </span>
        ) : null}
      </div>

      {item.signal ? (
        <p className="mt-3 text-[13.5px] leading-[1.68] text-[#5f6d80]">
          {item.signal}
        </p>
      ) : null}

      {item.url ? (
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center text-[12px] font-medium text-[#355678] underline"
        >
          Open source
        </a>
      ) : null}
    </div>
  );
}

function CompareMatrix({
  items,
}: {
  items: PresentationModel['compareItems'];
}) {
  return (
    <div className="overflow-hidden rounded-[22px] border border-[#e7edf5] bg-white">
      <div className="grid grid-cols-[1.1fr_1fr] border-b border-[#edf2f7] bg-[#f8fbff] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b98a9] sm:grid-cols-[1.1fr_0.8fr_1.2fr]">
        <div>Option</div>
        <div>Source</div>
        <div className="hidden sm:block">Signal</div>
      </div>

      {items.map((item, index) => {
        const isWinner = index === 0;

        return (
          <div
            key={item.id}
            className="grid grid-cols-[1.1fr_1fr] gap-3 border-b border-[#f1f5f9] px-4 py-4 last:border-b-0 sm:grid-cols-[1.1fr_0.8fr_1.2fr]"
          >
            <div className="min-w-0">
              <div className="flex items-start gap-2">
                {isWinner ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5b82b0]" />
                ) : (
                  <Circle className="mt-0.5 h-4 w-4 shrink-0 text-[#c1cddd]" />
                )}
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold leading-[1.42] text-[#243041]">
                    {item.option}
                  </p>
                  <p className="mt-1 text-[12px] text-[#5f6d80] sm:hidden">
                    {item.signal || '—'}
                  </p>
                </div>
              </div>
            </div>

            <div className="text-[13px] leading-[1.6] text-[#5f6d80]">
              {item.source || '—'}
            </div>

            <div className="hidden text-[13px] leading-[1.6] text-[#5f6d80] sm:block">
              {item.signal || '—'}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function CompareResponseView({ model }: CompareResponseViewProps) {
  if (!model.compareItems.length) {
    return (
      <PlainResponseView
        title={model.title}
        lead={model.lead}
        text={model.plainText || model.summary}
      />
    );
  }

  const winner = pickWinner(model.compareItems);
  const featured = winner ? [winner] : [];
  const others = winner ? model.compareItems.slice(1) : model.compareItems;

  return (
    <div className="max-w-[900px] space-y-5">
      <PlainResponseView
        title={model.title}
        lead={model.lead}
        text={model.summary || model.plainText}
      />

      {featured.length ? (
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#e6ecf4] bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.13em] text-[#7d8ca0]">
            <Sparkles className="h-3.5 w-3.5" />
            Recommendation
          </div>

          <div className="grid gap-3">
            {featured.map((item) => (
              <OptionCard key={item.id} item={item} featured />
            ))}
          </div>
        </div>
      ) : null}

      {others.length ? (
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#e6ecf4] bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.13em] text-[#7d8ca0]">
            Alternatives
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {others.map((item) => (
              <OptionCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#e6ecf4] bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.13em] text-[#7d8ca0]">
          Comparison
        </div>
        <CompareMatrix items={model.compareItems} />
      </div>
    </div>
  );
}
