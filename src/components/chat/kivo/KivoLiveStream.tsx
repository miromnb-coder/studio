"use client";

type Props = {
  text: string;
};

export function KivoLiveStream({
  text,
}: Props) {
  return (
    <div className="whitespace-pre-wrap text-sm leading-7 text-white/90">
      {text}
      <span className="ml-1 inline-block h-4 w-2 animate-pulse rounded bg-cyan-300/70" />
    </div>
  );
}
