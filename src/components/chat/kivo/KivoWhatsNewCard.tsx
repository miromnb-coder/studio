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
    <div className="mb-4 grid grid-cols-[1.08fr_0.92fr] overflow-hidden rounded-[28px] border border-black/[0.045] bg-white shadow-[0_16px_40px_rgba(15,23,42,0.055)]">
      <div className="relative min-h-[250px] overflow-hidden bg-[#080914] p-6 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(154,117,255,0.48),transparent_34%),radial-gradient(circle_at_50%_100%,rgba(146,120,255,0.34),transparent_40%)]" />
        <div className="absolute left-1/2 top-[36px] h-32 w-32 -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_35%_28%,#B8A4FF,#3B2B74_55%,#090A15_100%)] shadow-[0_0_60px_rgba(152,117,255,0.45)]" />

        <div className="relative z-10 flex items-center justify-between">
          <div className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/80">
            New update
          </div>
          <div className="text-[13px] text-white/55">08:12</div>
        </div>

        <div className="relative z-10 mt-14 text-center text-[30px] font-semibold tracking-[0.24em] text-white/80">
          KIVO
        </div>

        <button
          onClick={onPlay}
          className="absolute left-1/2 top-1/2 z-20 flex h-18 w-18 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/80 text-white shadow-[0_18px_44px_rgba(0,0,0,0.35)] ring-1 ring-white/20"
        >
          <Play className="h-8 w-8 fill-white" />
        </button>
      </div>

      <div className="p-7">
        <div className="inline-flex rounded-full bg-[#6D5DF6]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6D5DF6]">
          New update
        </div>

        <h3 className="mt-4 font-serif text-[31px] leading-[1.02] tracking-[-0.06em]">
          Kivo Operator just got smarter
        </h3>

        <p className="mt-5 text-[16px] leading-[1.45] text-black/55">
          Smarter reasoning, real-time results, and better tool execution.
        </p>

        <button
          onClick={onOpen}
          className="mt-6 inline-flex items-center gap-3 rounded-[15px] bg-white px-5 py-3 text-[14px] font-semibold shadow-[0_10px_24px_rgba(15,23,42,0.07)]"
        >
          See what’s new
          <ChevronRight className="h-4 w-4" />
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
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-black/55 p-4 backdrop-blur-sm">
      <div className="mx-auto flex min-h-full max-w-xl items-center justify-center">
        <div className="w-full overflow-hidden rounded-[32px] bg-[#090A12] text-white shadow-[0_34px_90px_rgba(0,0,0,0.35)]">
          <div className="relative min-h-[310px] overflow-hidden p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(154,117,255,0.55),transparent_34%),radial-gradient(circle_at_50%_100%,rgba(146,120,255,0.38),transparent_40%)]" />
            <div className="absolute left-1/2 top-[72px] h-40 w-40 -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_35%_28%,#B8A4FF,#3B2B74_55%,#090A15_100%)] shadow-[0_0_70px_rgba(152,117,255,0.55)]" />

            <button
              onClick={onClose}
              className="absolute right-5 top-5 z-20 rounded-full bg-white/10 p-3 text-white hover:bg-white/15"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="relative z-10 flex justify-between">
              <IconBubble icon={<BrainCircuit className="h-6 w-6" />} />
              <IconBubble icon={<ShieldCheck className="h-6 w-6" />} />
            </div>

            <button className="absolute left-1/2 top-[145px] z-20 flex h-20 w-20 -translate-x-1/2 items-center justify-center rounded-full bg-black/80 shadow-[0_20px_50px_rgba(0,0,0,0.4)] ring-1 ring-white/20">
              <Play className="h-9 w-9 fill-white" />
            </button>
          </div>

          <div className="px-6 pb-6">
            <div className="inline-flex rounded-full bg-[#6D5DF6] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]">
              New update
            </div>

            <h2 className="mt-4 font-serif text-[40px] leading-[1.02] tracking-[-0.06em]">
              Kivo Operator just got smarter
            </h2>

            <p className="mt-4 text-[16px] leading-[1.55] text-white/68">
              Our biggest update yet. Smarter reasoning, deeper context, and real-time
              results built to handle more.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
              <Feature icon={<BrainCircuit />} title="Smarter reasoning" desc="Better multi-step understanding" />
              <Feature icon={<Zap />} title="Real-time results" desc="Faster answers with live data" />
              <Feature icon={<Grid2X2 />} title="More tools" desc="Seamless integrations" />
              <Feature icon={<ShieldCheck />} title="Better memory" desc="Remembers useful context" />
            </div>

            <button
              onClick={onTry}
              className="mt-7 flex w-full items-center justify-center gap-3 rounded-[17px] bg-white py-4 text-[15px] font-semibold text-[#111318]"
            >
              Try in chat
              <ChevronRight className="h-5 w-5" />
            </button>

            <button
              onClick={onClose}
              className="mt-3 w-full rounded-[17px] bg-white/10 py-4 text-[15px] font-semibold text-white"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function IconBubble({ icon }: { icon: ReactNode }) {
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-[18px] border border-white/15 bg-white/10 text-white shadow-[0_12px_32px_rgba(0,0,0,0.2)]">
      {icon}
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
  return (
    <div>
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-[14px] bg-white/10 text-white [&>svg]:h-5 [&>svg]:w-5">
        {icon}
      </div>
      <div className="text-[15px] font-semibold">{title}</div>
      <p className="mt-1 text-[13px] leading-[1.35] text-white/55">{desc}</p>
    </div>
  );
}
