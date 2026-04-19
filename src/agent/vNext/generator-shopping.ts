import type { StructuredAnswer } from './types';
import type { StructuredPayloadSchema, ToolSummaryItem } from './generator-types';
import { asArray, asObject, normalizeText } from './generator-types';

export function buildShoppingResponse(params: {
  structured: StructuredAnswer;
  toolSummaries: ToolSummaryItem[];
}): Partial<StructuredPayloadSchema> {
  const { structured, toolSummaries } = params;
  const cards: NonNullable<StructuredPayloadSchema['productCards']> = [];

  for (const item of toolSummaries) {
    if (!item.ok) continue;

    const data = asObject(item.data);
    const rawProducts =
      item.tool === 'web'
        ? asArray(data.products).length > 0
          ? asArray(data.products)
          : asArray(data.shoppingResults)
        : asArray(data.products);

    for (const raw of rawProducts) {
      const record = asObject(raw);
      const title = normalizeText(record.title || record.name || record.label);
      if (!title) continue;

      cards.push({
        id: normalizeText(record.id) || `product-${cards.length}`,
        title,
        price: normalizeText(record.price || record.formattedPrice) || null,
        source: normalizeText(record.source || record.store || record.vendor) || null,
        imageUrl: normalizeText(record.imageUrl || record.image || record.thumbnail) || null,
        description: normalizeText(record.description || record.summary || record.preview) || null,
        href: normalizeText(record.href || record.url) || null,
      });
    }
  }

  const buyingAdvice = structured.nextStep || (cards.length ? 'Pick based on value, warranty, and verified seller reputation.' : undefined);

  return {
    productCards: cards.slice(0, 12),
    summary: structured.summary || buyingAdvice,
    nextActions: buyingAdvice ? [buyingAdvice] : undefined,
  };
}
