'use client';

export function KivoThinkingState({
  text = 'Thinking',
}: {
  text?: string;
}) {
  return (
    <div className="inline-flex items-center gap-3 pl-[2px]">
      <span className="relative flex h-[18px] w-[18px] items-center justify-center">
        <span className="absolute h-[18px] w-[18px] rounded-full bg-[#4f7cff]/[0.14] blur-[7px] animate-[kivoCoreHalo_3s_ease-in-out_infinite]" />
        <span className="absolute h-[14px] w-[14px] rounded-full bg-[#5f8dff]/[0.12] blur-[3.5px] animate-[kivoCoreAura_2.6s_ease-in-out_infinite]" />

        <span className="absolute flex h-[12px] w-[12px] items-center justify-center animate-[kivoCoreRotate_5.4s_linear_infinite]">
          <span className="relative block h-[11px] w-[9px] bg-[linear-gradient(135deg,#76a4ff_0%,#4f7cff_52%,#315cff_100%)] shadow-[0_0_14px_rgba(79,124,255,0.34)] animate-[kivoCoreMorph_3s_ease-in-out_infinite]" />
          <span className="absolute left-[1.7px] top-[1.5px] h-[2.4px] w-[2.4px] rounded-full bg-white/80 blur-[0.25px] animate-[kivoCoreHighlight_3s_ease-in-out_infinite]" />
        </span>
      </span>

      <span className="text-[15px] font-medium tracking-[-0.01em] text-[#b1b1b7] animate-[kivoThinkingText_2.8s_ease-in-out_infinite]">
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
            transform: scale(0.96, 1.03) rotate(0deg);
            opacity: 0.95;
          }
          24% {
            border-radius: 48% 52% 49% 51% / 49% 49% 51% 51%;
            transform: scale(1.05, 0.97) rotate(7deg);
            opacity: 1;
          }
          50% {
            border-radius: 50%;
            transform: scale(1, 1) rotate(0deg);
            opacity: 1;
          }
          76% {
            border-radius: 56% 44% 46% 54% / 42% 56% 44% 58%;
            transform: scale(0.98, 1.06) rotate(-8deg);
            opacity: 0.97;
          }
        }

        @keyframes kivoCoreHalo {
          0%,
          100% {
            transform: scale(0.9);
            opacity: 0.18;
          }
          50% {
            transform: scale(1.22);
            opacity: 0.36;
          }
        }

        @keyframes kivoCoreAura {
          0%,
          100% {
            transform: scale(0.94);
            opacity: 0.16;
          }
          50% {
            transform: scale(1.14);
            opacity: 0.26;
          }
        }

        @keyframes kivoCoreHighlight {
          0%,
          100% {
            transform: translate(0px, 0px);
            opacity: 0.7;
          }
          50% {
            transform: translate(0.4px, -0.4px);
            opacity: 0.95;
          }
        }

        @keyframes kivoThinkingText {
          0%,
          100% {
            opacity: 0.68;
          }
          50% {
            opacity: 0.96;
          }
        }
      `}</style>
    </div>
  );
}
