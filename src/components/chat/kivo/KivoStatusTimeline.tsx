"use client";

const STEPS = [
  "starting",
  "building_context",
  "calling_model",
  "finalizing",
  "completed",
];

type Props = {
  current?: string;
};

export function KivoStatusTimeline({
  current,
}: Props) {
  const activeIndex =
    STEPS.indexOf(current || "");

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
      <div className="mb-3 text-[11px] uppercase tracking-[0.25em] text-cyan-300/80">
        Agent Progress
      </div>

      <div className="space-y-3">
        {STEPS.map((step, index) => {
          const active =
            index <= activeIndex;

          return (
            <div
              key={step}
              className="flex items-center gap-3"
            >
              <div
                className={`h-2.5 w-2.5 rounded-full ${
                  active
                    ? "bg-cyan-300"
                    : "bg-white/20"
                }`}
              />

              <div
                className={`text-xs uppercase tracking-[0.2em] ${
                  active
                    ? "text-white"
                    : "text-white/35"
                }`}
              >
                {step.replaceAll(
                  "_",
                  " ",
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
