"use client";

type Props = {
  title: string;
  reason?: string;
};

export function KivoSourceCard({
  title,
  reason,
}: Props) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
      <div className="text-[11px] uppercase tracking-[0.25em] text-cyan-300/80">
        Source
      </div>

      <div className="mt-2 text-sm text-white">
        {title}
      </div>

      {reason && (
        <div className="mt-1 text-xs text-white/60">
          {reason}
        </div>
      )}
    </div>
  );
}
