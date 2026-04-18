'use client';

import type { PresentationModel } from '@/lib/presentation/build-presentation-model';

type CompareResponseViewProps = {
  model: PresentationModel;
};

export function CompareResponseView({ model }: CompareResponseViewProps) {
  return (
    <div className="max-w-[860px] space-y-4">
      <p className="whitespace-pre-wrap text-[16px] leading-[1.75] tracking-[-0.01em] text-[#3f4b5c]">{model.summary}</p>
      <div className="overflow-hidden rounded-[20px] border border-[#e7edf5] bg-white">
        <div className="grid grid-cols-[1.3fr_0.8fr_1.1fr_auto] gap-3 border-b border-[#edf2f7] bg-[#f8fbff] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b98a9]">
          <div>Option</div>
          <div>Source</div>
          <div>Signal</div>
          <div>Link</div>
        </div>
        {model.compareItems.map((item) => (
          <div key={item.id} className="grid grid-cols-[1.3fr_0.8fr_1.1fr_auto] gap-3 border-b border-[#f1f5f9] px-4 py-3 text-[13px] text-[#425164] last:border-b-0">
            <div className="font-semibold text-[#243041]">{item.option}</div>
            <div>{item.source}</div>
            <div>{item.signal}</div>
            <div>{item.url ? <a className="text-[#355678] underline" href={item.url} target="_blank" rel="noreferrer">Open</a> : '—'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
