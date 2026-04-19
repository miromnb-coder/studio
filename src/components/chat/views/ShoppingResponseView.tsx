'use client';

import { ExternalLink, ShoppingBag, Sparkles } from 'lucide-react';
import type { PresentationModel } from '@/lib/presentation/build-presentation-model';
import { PlainResponseView } from './PlainResponseView';

type ShoppingResponseViewProps = {
  model: PresentationModel;
};

function initialsFromTitle(title: string) {
  const initials = title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return initials || 'P';
}

function accentForIndex(index: number) {
  const accents = [
    'from-[#ebf4ff] to-[#f8fbff]',
    'from-[#eefbf5] to-[#f8fdfb]',
    'from-[#fff6ec] to-[#fffaf4]',
    'from-[#f5f1ff] to-[#faf8ff]',
  ];

  return accents[index % accents.length];
}

function ProductCard({
  product,
  index,
  featured = false,
}: {
  product: PresentationModel['products'][number];
  index: number;
  featured?: boolean;
}) {
  const content = (
    <>
      <div
        className={`relative h-44 bg-gradient-to-br ${accentForIndex(index)} ${
          featured ? 'sm:h-48' : ''
        }`}
      >
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-[22px] border border-white/80 bg-white/90 text-[18px] font-semibold text-[#5f7086] shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
              {initialsFromTitle(product.title)}
            </div>
          </div>
        )}

        {featured ? (
          <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-[rgba(59,130,246,0.16)] bg-[rgba(255,255,255,0.92)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#355678] backdrop-blur">
            <Sparkles className="h-3 w-3" />
            Best pick
          </div>
        ) : null}
      </div>

      <div className="p-4">
        <p
          className={`line-clamp-2 font-semibold leading-[1.4] text-[#233042] ${
            featured ? 'text-[16px]' : 'text-[15px]'
          }`}
        >
          {product.title}
        </p>

        <div className="mt-2 flex items-center gap-2">
          <p className="text-[13px] font-semibold text-[#335b46]">{product.price}</p>
          {product.source ? (
            <>
              <span className="text-[#c5cfdb]">•</span>
              <p className="text-[12px] text-[#6f8196]">{product.source}</p>
            </>
          ) : null}
        </div>

        {product.snippet ? (
          <p className="mt-2 line-clamp-3 text-[12.5px] leading-[1.62] text-[#5f6d80]">
            {product.snippet}
          </p>
        ) : null}

        {product.url ? (
          <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-[#355678]">
            View product <ExternalLink className="h-3.5 w-3.5" />
          </span>
        ) : null}
      </div>
    </>
  );

  const className = featured
    ? 'overflow-hidden rounded-[24px] border border-[rgba(59,130,246,0.14)] bg-white transition hover:shadow-[0_12px_28px_rgba(15,23,42,0.06)]'
    : 'overflow-hidden rounded-[22px] border border-[#e7edf5] bg-white transition hover:shadow-[0_10px_24px_rgba(15,23,42,0.06)]';

  if (product.url) {
    return (
      <a
        href={product.url}
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

export function ShoppingResponseView({ model }: ShoppingResponseViewProps) {
  if (!model.products.length) {
    return (
      <PlainResponseView
        title={model.title}
        lead={model.lead}
        text={model.plainText || model.summary}
      />
    );
  }

  const featured = model.products[0];
  const rest = model.products.slice(1);

  return (
    <div className="max-w-[980px] space-y-5">
      <PlainResponseView
        title={model.title}
        lead={model.lead}
        text={model.summary || model.plainText}
      />

      {featured ? (
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#e6ecf4] bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.13em] text-[#7d8ca0]">
            <Sparkles className="h-3.5 w-3.5" />
            Recommended
          </div>

          <div className="grid gap-3">
            <ProductCard product={featured} index={0} featured />
          </div>
        </div>
      ) : null}

      {rest.length ? (
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#e6ecf4] bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.13em] text-[#7d8ca0]">
            <ShoppingBag className="h-3.5 w-3.5" />
            More options
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {rest.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                index={index + 1}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
