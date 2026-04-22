"use client";

type Props = {
  title: string;
  body: string;
};

export function KivoArtifactCard({
  title,
  body,
}: Props) {
  return (
    <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/5 p-4">
      <div className="text-[11px] uppercase tracking-[0.25em] text-cyan-300/80">
        Artifact
      </div>

      <div className="mt-2 text-sm text-white">
        {title}
      </div>

      <div className="mt-2 whitespace-pre-wrap text-xs text-white/70">
        {body}
      </div>
    </div>
  );
}
