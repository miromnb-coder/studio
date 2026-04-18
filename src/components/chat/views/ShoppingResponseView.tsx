'use client';

import { ExternalLink } from 'lucide-react';
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
}: {
  product: PresentationModel['products'][number];
  index: number;
}) {
  const content = (
    <>
      <div className={`h-40 bg-gradient-to-br ${accentForIndex(index)}`}>
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
      </div>

      <div className="p-4">
        <p className="line-clamp-2 text-[15px] font-semibold leading-[1.4] text-[#233042]">
          {product.title}
        </p>
        <p className="mt-2 text-[13px] font-medium text-[#4d6650]">
          {product.price}
        </p>
        <p className="mt-1 text-[12px] text-[#6f8196]">{product.source}</p>
        {product.snippet ? (
          <p className="mt-2 line-clamp-3 text-[12.5px] leading-[1.58] text-[#5f6d80]">
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

  if (product.url) {
    return (
      <a
        href={product.url}
        target="_blank"
        rel="noreferrer"
        className="overflow-hidden rounded-[22px] border border-[#e7edf5] bg-white transition hover:shadow-[0_10px_24px_rgba(15,23,42,0.06)]"
      >
        {content}
      </a>
    );
  }

  return (
    <div className="overflow-hidden rounded-[22px] border border-[#e7edf5] bg-white">
      {content}
    </div>
  );
}

export function ShoppingResponseView({ model }: ShoppingResponseViewProps) {
  if (model.products.length < 2) {
    return (
      <PlainResponseView
        title={model.title}
        lead={model.lead}
        text={model.plainText || model.summary}
      />
    );
  }

  return (
    <div className="max-w-[900px] space-y-4">
      <PlainResponseView
        title={model.title}
        lead={model.lead}
        text={model.summary}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {model.products.map((product, index) => (
          <ProductCard key={product.id} product={product} index={index} />
        ))}
      </div>
    </div>
  );
}
