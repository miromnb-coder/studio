'use client';

export function KivoExecutionStatus({
  text,
}: {
  text: string;
}) {
  return (
    <div className="inline-flex max-w-[640px] items-center gap-2.5 pl-[2px]">
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span className="absolute inline-flex h-full w-full rounded-full bg-[#4f7cff]/25 animate-[kivoStatusPulse_2.4s_ease-in-out_infinite]" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#4f7cff]" />
      </span>

      <p className="text-[15px] leading-[1.45] tracking-[-0.015em] text-[#6e6e73]">
        {text}
      </p>

      <style jsx>{`
        @keyframes kivoStatusPulse {
          0%,
          100% {
            transform: scale(0.9);
            opacity: 0.2;
          }
          50% {
            transform: scale(1.35);
            opacity: 0.42;
          }
        }
      `}</style>
    </div>
  );
}
