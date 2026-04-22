"use client";

type Props = {
  title: string;
  subtitle?: string;
  status: "running" | "completed" | "failed";
  output?: string;
};

function getStatusLabel(status: Props["status"]) {
  if (status === "running") return "Running";
  if (status === "failed") return "Failed";
  return "Completed";
}

export function KivoToolEventCard({
  title,
  subtitle,
  status,
  output,
}: Props) {
  return (
    <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] uppercase tracking-[0.25em] text-cyan-300/80">
          Tool Activity
        </div>

        <div className="text-[10px] uppercase tracking-[0.22em] text-white/55">
          {getStatusLabel(status)}
        </div>
      </div>

      <div className="mt-2 text-sm text-white">{title}</div>

      {subtitle && (
        <div className="mt-1 text-xs text-white/60">{subtitle}</div>
      )}

      {output && (
        <div className="mt-3 rounded-2xl bg-black/20 px-3 py-2 text-xs leading-6 text-white/70">
          {output}
        </div>
      )}
    </div>
  );
}
