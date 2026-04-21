'use client';

export function KivoThinkingState({
  text = 'Thinking...',
}: {
  text?: string;
}) {
  return (
    <div className="inline-flex items-center gap-3">
      <span className="relative flex h-5 w-5 items-center justify-center">
        <span className="absolute h-5 w-5 rounded-full bg-blue-500/16 blur-[10px] animate-[kivoCoreHalo_3.2s_ease-in-out_infinite]" />
        <span className="absolute h-4 w-4 rounded-full bg-cyan-400/10 blur-[5px] animate-[kivoCoreAura_2.8s_ease-in-out_infinite]" />

        <span className="absolute flex h-3.5 w-3.5 items-center justify-center animate-[kivoCoreRotate_5.8s_linear_infinite]">
          <span className="relative block h-[13px] w-[11px] bg-gradient-to-br from-sky-300 via-blue-500 to-indigo-600 shadow-[0_0_18px_rgba(59,130,246,0.45)] animate-[kivoCoreMorph_3.1s_ease-in-out_infinite]" />
          <span className="absolute left-[2px] top-[2px] h-[3px] w-[3px] rounded-full bg-white/80 blur-[0.4px] animate-[kivoCoreHighlight_3.1s_ease-in-out_infinite]" />
        </span>
      </span>

      <span className="text-[15px] font-medium tracking-[-0.01em] text-[#8A8F98] animate-[kivoThinkingText_2.8s_ease-in-out_infinite]">
        {text}
      </span>

      <style jsx>{`
        @keyframes kivoCoreRotate {
          0% {
            transform: rotate(0deg);
          }
          50% {
            transform: rotate(180deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes kivoCoreMorph {
          0%,
          100% {
            border-radius: 42% 58% 52% 48% / 46% 42% 58% 54%;
            transform: scale(0.96, 1.02) rotate(0deg);
            opacity: 0.94;
          }
          25% {
            border-radius: 50% 50% 48% 52% / 50% 50% 50% 50%;
            transform: scale(1.05, 0.97) rotate(8deg);
            opacity: 1;
          }
          50% {
            border-radius: 50% 50% 50% 50% / 50% 50% 50% 50%;
            transform: scale(1, 1) rotate(0deg);
            opacity: 1;
          }
          75% {
            border-radius: 56% 44% 46% 54% / 42% 56% 44% 58%;
            transform: scale(0.98, 1.06) rotate(-10deg);
            opacity: 0.96;
          }
        }

        @keyframes kivoCoreHalo {
          0%,
          100% {
            transform: scale(0.88);
            opacity: 0.2;
          }
          50% {
            transform: scale(1.25);
            opacity: 0.42;
          }
        }

        @keyframes kivoCoreAura {
          0%,
          100% {
            transform: scale(0.95);
            opacity: 0.18;
          }
          50% {
            transform: scale(1.18);
            opacity: 0.3;
          }
        }

        @keyframes kivoCoreHighlight {
          0%,
          100% {
            transform: translate(0px, 0px);
            opacity: 0.72;
          }
          50% {
            transform: translate(0.5px, -0.5px);
            opacity: 0.95;
          }
        }

        @keyframes kivoThinkingText {
          0%,
          100% {
            opacity: 0.72;
          }
          50% {
            opacity: 0.98;
          }
        }
      `}</style>
    </div>
  );
}
