"use client";

type Props = {
  rows: Array<{
    label: string;
    value: string;
  }>;
};

export function KivoDataTable({
  rows,
}: Props) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-center justify-between border-b border-white/5 px-4 py-3 last:border-b-0"
        >
          <span className="text-xs uppercase tracking-[0.2em] text-white/50">
            {row.label}
          </span>

          <span className="text-sm text-white">
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}
