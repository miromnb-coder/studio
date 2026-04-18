'use client';

import { ExternalLink } from 'lucide-react';
import type { PresentationModel } from '@/lib/presentation/build-presentation-model';

type ShoppingResponseViewProps = {
  model: PresentationModel;
};

export function ShoppingResponseView({ model }: ShoppingResponseViewProps) {
  return (
    <div className="max-w-[900px] space-y-4">
      <p className="whitespace-pre-wrap text-[16px] leading-[1.75] tracking-[-0.01em] text-[#3f4b5c]">{model.summary}</p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {model.products.map((product) => (
          <a key={product.id} href={product.url || '#'} target="_blank" rel="noreferrer" className="overflow-hidden rounded-[22px] border border-[#e7edf5] bg-white hover:shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
            <div className="h-40 bg-[#f6f9fd]">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.title} className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div className="p-4">
              <p className="line-clamp-2 text-[15px] font-semibold text-[#233042]">{product.title}</p>
              <p className="mt-2 text-[13px] text-[#4d6650]">{product.price}</p>
              <p className="mt-1 text-[12px] text-[#6f8196]">{product.source}</p>
              {product.snippet ? <p className="mt-2 line-clamp-3 text-[12.5px] text-[#5f6d80]">{product.snippet}</p> : null}
              <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-[#355678]">View product <ExternalLink className="h-3.5 w-3.5" /></span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
