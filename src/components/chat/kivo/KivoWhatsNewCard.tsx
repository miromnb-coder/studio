'use client';

import type { ReactNode } from 'react';
import {
  BrainCircuit,
  ChevronRight,
  Grid2X2,
  Play,
  ShieldCheck,
  X,
  Zap,
} from 'lucide-react';

type Props = {
  onPlay: () => void;
  onOpen: () => void;
};

export function KivoWhatsNewCard({ onPlay, onOpen }: Props) {
  return (
    <div className="mb-4 grid grid-cols-[1.05fr_0.95fr] overflow-hidden rounded-[28px] border border-black/[0.045] bg-white shadow-[0_16px_40px_rgba(15,23,42,0.045)]">
      <button
        type="button"
        onClick={onPlay}
        className="relative min-h-[300px] overflow-hidden bg-[#F4F4F4]"
        aria-label="Play Kivo update video"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(255,255,255,0.98),rgba(244,244,246,0.94)_48%,rgba(232,232,236,0.9)_100%)]" />
        <div className="absolute left-1/2 top-1/2 h-[210px] w-[210px] -translate-x-1/2 -translate-y-1/2">
          <KivoDotMark />
        </div>
        <div className="absolute bottom-9 left-1/2 h-3 w-28 -translate-x-1/2 rounded-full bg-black/[0.08] blur-md" />

        <div className="absolute left-1/2 top-1/2 z-20 flex h-[76px] w-[76px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#111318] text-white shadow-[0_18px_42px_rgba(0,0,0,0.22)]">
          <Play className="ml-1 h-8 w-8 fill-white" />
        </div>
      </button>

      <div className="flex flex-col p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="inline-flex rounded-full bg-[#6D5DF6]/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6D5DF6]">
            New update
          </div>
          <div className="pt-1 text-[14px] text-black/42">08:12</div>
        </div>

        <h3 className="mt-8 font-serif text-[34px] leading-[0.98] tracking-[-0.065em] text-[#111318]">
          Kivo Operator just got smarter
        </h3>

        <p className="mt-5 text-[17px] leading-[1.42] text-black/48">
          Smarter reasoning, real-time results, and better tool execution.
        </p>

        <button
          type="button"
          onClick={onOpen}
          className="mt-auto inline-flex w-full items-center justify-center gap-4 rounded-[18px] bg-white px-5 py-4 text-[16px] font-semibold tracking-[-0.02em] text-[#111318] shadow-[0_12px_26px_rgba(15,23,42,0.07)]"
        >
          See what’s new
          <ChevronRight className="h-5 w-5" strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}

export function KivoWhatsNewModal({
  onClose,
  onTry,
}: {
  onClose: () => void;
  onTry: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-black/40 p-4 backdrop-blur-sm">
      <div className="mx-auto flex min-h-full max-w-xl items-center justify-center">
        <div className="w-full overflow-hidden rounded-[32px] bg-white text-[#111318] shadow-[0_34px_90px_rgba(0,0,0,0.22)]">
          <div className="relative min-h-[320px] overflow-hidden bg-[#F4F4F4]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(255,255,255,0.98),rgba(244,244,246,0.94)_48%,rgba(232,232,236,0.9)_100%)]" />
            <div className="absolute left-1/2 top-1/2 h-[230px] w-[230px] -translate-x-1/2 -translate-y-1/2">
              <KivoDotMark />
            </div>
            <div className="absolute bottom-9 left-1/2 h-3 w-32 -translate-x-1/2 rounded-full bg-black/[0.08] blur-md" />

            <button
              type="button"
              onClick={onClose}
              className="absolute right-5 top-5 z-20 rounded-full bg-white/80 p-3 text-[#111318] shadow-[0_10px_26px_rgba(15,23,42,0.08)] hover:bg-white"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <button
              type="button"
              className="absolute left-1/2 top-1/2 z-20 flex h-[84px] w-[84px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#111318] text-white shadow-[0_20px_48px_rgba(0,0,0,0.24)]"
              aria-label="Play update video"
            >
              <Play className="ml-1 h-9 w-9 fill-white" />
            </button>
          </div>

          <div className="px-6 pb-6 pt-6">
            <div className="inline-flex rounded-full bg-[#6D5DF6]/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6D5DF6]">
              New update
            </div>

            <h2 className="mt-4 font-serif text-[42px] leading-[1.02] tracking-[-0.065em]">
              Kivo Operator just got smarter
            </h2>

            <p className="mt-4 text-[17px] leading-[1.5] text-black/55">
              Our biggest update yet. Smarter reasoning, deeper context, and real-time
              results built to help you move faster.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-black/[0.08] pt-6">
              <Feature icon={<BrainCircuit />} title="Smarter reasoning" desc="Better multi-step understanding" />
              <Feature icon={<Zap />} title="Real-time results" desc="Faster answers with live data" />
              <Feature icon={<Grid2X2 />} title="More tools" desc="Seamless integrations" />
              <Feature icon={<ShieldCheck />} title="Better memory" desc="Remembers useful context" />
            </div>

            <button
              type="button"
              onClick={onTry}
              className="mt-7 flex w-full items-center justify-center gap-3 rounded-[18px] bg-[#111318] py-4 text-[15px] font-semibold text-white"
            >
              Try in chat
              <ChevronRight className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full rounded-[18px] bg-black/[0.045] py-4 text-[15px] font-semibold text-[#111318]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function KivoDotMark() {
  const dots = Array.from({ length: 168 }, (_, index) => {
    const ring = Math.floor(index / 21);
    const position = index % 21;
    const angle = position * 17.14 + ring * 18;
    const radius = 28 + ring * 9.6 + Math.sin(position * 0.9 + ring) * 4;
    const size = 3.2 + ((position + ring) % 5) * 1.7;
    const opacity = 0.96 - Math.abs(position - 10) * 0.018;

    return { index, angle, radius, size, opacity };
  });

  return (
    <div className="relative h-full w-full">
      {dots.map((dot) => (
        <span
          key={dot.index}
          className="absolute left-1/2 top-1/2 block rounded-full bg-black"
          style={{
            width: dot.size,
            height: dot.size,
            opacity: dot.opacity,
            transform: `translate(-50%, -50%) rotate(${dot.angle}deg) translateX(${dot.radius}px)`,
          }}
        />
      ))}
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
  return (
    <div>
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-[14px] bg-black/[0.045] text-[#111318] [&>svg]:h-5 [&>svg]:w-5">
        {icon}
      </div>
      <div className="text-[15px] font-semibold">{title}</div>
      <p className="mt-1 text-[13px] leading-[1.35] text-black/48">{desc}</p>
    </div>
  );
}
