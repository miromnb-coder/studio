'use client';

import type { FinanceActionResult } from '@/lib/finance/types';

type Props = {
  result: FinanceActionResult;
};

export default function FinanceActionResultCard({ result }: Props) {
  return (
    <section className="mt-2 rounded-2xl border border-black/10 bg-[#fafafa] p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5d5d5d]">{result.type.replace('_', ' ')}</p>
      <h4 className="mt-1 text-sm font-semibold text-[#1f1f1f]">{result.title}</h4>
      <p className="mt-1 text-sm text-[#444]">{result.summary}</p>
      {Object.keys(result.data || {}).length > 0 ? (
        <pre className="mt-2 overflow-x-auto rounded-xl border border-black/5 bg-white p-2 text-xs text-[#4b4b4b]">{JSON.stringify(result.data, null, 2)}</pre>
      ) : null}
    </section>
  );
}
