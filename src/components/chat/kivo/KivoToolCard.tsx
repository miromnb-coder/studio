"use client";

type Props = {
  title: string;
  subtitle?: string;
};

export function KivoToolCard({
  title,
  subtitle,
}: Props) {
  return (
    <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/5 p-4">
      <div className="text-[11px] uppercase tracking-[0.25em] text-cyan-300/80">
        Tool Activity
      </div>

      <div className="mt-2 text-sm text-white">
        {title}
      </div>

      {subtitle && (
        <div className="mt-1 text-xs text-white/60">
          {subtitle}
        </div>
      )}
    </div>
  );
}
