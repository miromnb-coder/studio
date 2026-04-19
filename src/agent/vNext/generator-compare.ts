import type { StructuredAnswer } from './types';
import type { StructuredPayloadSchema, ToolSummaryItem } from './generator-types';
import { asArray, asObject, normalizeText, toStringArray } from './generator-types';

const DEFAULT_COMPARE_CATEGORIES = ['Price', 'Battery', 'Camera', 'Performance', 'Value'];

export function buildCompareResponse(params: {
  structured: StructuredAnswer;
  toolSummaries: ToolSummaryItem[];
}): Partial<StructuredPayloadSchema> {
  const { structured, toolSummaries } = params;

  for (const item of toolSummaries) {
    if (item.tool !== 'compare' || !item.ok) continue;

    const data = asObject(item.data);
    const comparedItems = toStringArray(data.comparedItems);
    const criteria = toStringArray(data.criteria);
    const scorecards = asArray(data.scorecards);

    const columns = (criteria.length ? criteria : DEFAULT_COMPARE_CATEGORIES).slice(0, 5);

    const rows: NonNullable<StructuredPayloadSchema['compareRows']> = scorecards
      .map((raw) => {
        const record = asObject(raw);
        const label = normalizeText(record.item || record.label);
        const scores = asObject(record.scores);

        const values = columns.map((criterion) => `${criterion}: ${normalizeText(String(scores[criterion] ?? '—'))}`);
        if (!label || !values.length) return null;
        return { label, values };
      })
      .filter((row): row is { label: string; values: string[] } => Boolean(row));

    const winner = normalizeText(data.winner || data.recommendation || structured.nextStep);

    return {
      compareHeaders: ['Option', ...columns.slice(0, 3)],
      compareRows: rows.slice(0, 12),
      summary: structured.summary || (winner ? `Recommendation: ${winner}` : undefined),
      nextActions: winner ? [winner] : undefined,
      title: structured.title || (comparedItems.length ? `${comparedItems.slice(0, 2).join(' vs ')}` : undefined),
    };
  }

  return {
    compareHeaders: ['Option', ...DEFAULT_COMPARE_CATEGORIES.slice(0, 3)],
    compareRows: [],
    summary: structured.summary,
  };
}
