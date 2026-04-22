"use client";

type Props = {
  text: string;
};

export function KivoMemoryCard({
  text,
}: Props) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <div className="text-[11px] uppercase tracking-[0.25em] text-white/60">
        Memory
      </div>

      <div className="mt-2 text-sm text-white/85">
        {text}
      </div>
    </div>
  );
}
