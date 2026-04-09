'use client';

type Props = {
  data?: Record<string, unknown>;
};

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}

export function StructuredResultCard({ data }: Props) {
  if (!data || Object.keys(data).length === 0) return null;

  const detectLeaks = (data.detect_leaks as Record<string, unknown> | undefined) || undefined;
  const analyze = (data.analyze as Record<string, unknown> | undefined) || undefined;

  const leaks = Array.isArray(detectLeaks?.leaks) ? detectLeaks?.leaks : null;
  const savings = typeof detectLeaks?.estimatedMonthlySavings === 'number' ? detectLeaks.estimatedMonthlySavings : null;
  const insights = typeof analyze?.insights === 'string' ? analyze.insights : null;

  return (
    <details className="mt-2 rounded-xl border border-black/5 bg-[#fafafa] p-3">
      <summary className="cursor-pointer list-none text-sm font-medium text-[#2a2a2a]">Structured results</summary>

      <div className="mt-2 space-y-2 text-sm text-[#3a3a3a]">
        {leaks ? (
          <div className="rounded-lg border border-black/5 bg-white px-2.5 py-2">
            <p className="text-xs uppercase tracking-wide text-[#666]">Leaks</p>
            {leaks.length === 0 ? <p className="mt-1 text-xs">No leaks detected.</p> : null}
            {leaks.map((item, idx) => (
              <p key={idx} className="mt-1 text-xs leading-5">• {formatValue(item)}</p>
            ))}
            {savings !== null ? <p className="mt-2 text-xs font-medium">Estimated monthly savings: ${savings}</p> : null}
          </div>
        ) : null}

        {insights ? (
          <div className="rounded-lg border border-black/5 bg-white px-2.5 py-2">
            <p className="text-xs uppercase tracking-wide text-[#666]">Insights</p>
            <p className="mt-1 text-xs leading-5">{insights}</p>
          </div>
        ) : null}

        {!leaks && !insights ? (
          <div className="rounded-lg border border-black/5 bg-white px-2.5 py-2">
            {Object.entries(data).map(([key, value]) => (
              <div key={key} className="grid grid-cols-[120px_1fr] gap-2 border-b border-black/5 py-1 last:border-b-0">
                <span className="text-xs font-medium text-[#555]">{key}</span>
                <span className="text-xs text-[#444] break-words">{formatValue(value)}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </details>
  );
}
