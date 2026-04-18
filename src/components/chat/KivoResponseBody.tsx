'use client';

import type { StructuredAnswer } from '@/agent/vNext/types';

type KivoResponseBodyProps = {
  answer: StructuredAnswer;
};

function hasRenderableContent(answer: StructuredAnswer) {
  return Boolean(
    answer.title ||
      answer.lead ||
      answer.summary ||
      answer.highlights?.length ||
      answer.nextStep ||
      answer.sources?.some((source) => source.used) ||
      answer.plainText
  );
}

export function KivoResponseBody({ answer }: KivoResponseBodyProps) {
  if (!hasRenderableContent(answer)) return null;

  const visibleSources = answer.sources?.filter((source) => source.used) ?? [];

  return (
    <div className="space-y-5">
      {answer.title ? (
        <h3 className="text-[24px] font-semibold leading-[1.18] tracking-[-0.035em] text-[#202938]">
          {answer.title}
        </h3>
      ) : null}

      {answer.lead ? (
        <p className="max-w-[760px] text-[17px] font-normal leading-[1.68] tracking-[-0.016em] text-[#334155]">
          {answer.lead}
        </p>
      ) : null}

      {answer.summary ? (
        <p className="max-w-[760px] text-[15px] leading-[1.72] tracking-[-0.012em] text-[#556274]">
          {answer.summary}
        </p>
      ) : null}

      {answer.highlights?.length ? (
        <div className="space-y-3">
          {answer.highlights.map((highlight, index) => {
            const tone = highlight.tone ?? 'default';

            const dotColor =
              tone === 'important'
                ? 'bg-[#e0b04b]'
                : tone === 'success'
                ? 'bg-[#7fb08d]'
                : tone === 'warning'
                  ? 'bg-[#d79a9a]'
                  : 'bg-[#c9d2df]';

            const textColor =
              tone === 'important'
                ? 'text-[#5a3b09]'
                : tone === 'success'
                  ? 'text-[#214d33]'
                  : tone === 'warning'
                    ? 'text-[#6a2b2b]'
                    : 'text-[#334155]';

            return (
              <div key={`${highlight.text}-${index}`} className="flex gap-3">
                <span
                  className={`mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full ${dotColor}`}
                />
                <p
                  className={`text-[15px] leading-[1.7] tracking-[-0.012em] ${textColor}`}
                >
                  {highlight.text}
                </p>
              </div>
            );
          })}
        </div>
      ) : null}

      {answer.nextStep ? (
        <div className="space-y-1.5 pt-1">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#96a0af]">
            Next step
          </div>
          <p className="max-w-[760px] text-[15px] leading-[1.68] tracking-[-0.012em] text-[#334155]">
            {answer.nextStep}
          </p>
        </div>
      ) : null}

      {visibleSources.length ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-[12px] leading-6">
          <span className="font-medium tracking-[-0.01em] text-[#97a1af]">
            Built from
          </span>

          {visibleSources.map((source) => (
            <span
              key={source.id}
              className="inline-flex items-center gap-1.5 font-medium tracking-[-0.01em] text-[#5f6c80]"
            >
              <span className="text-[#5fa271]">✓</span>
              <span>{source.label}</span>
            </span>
          ))}
        </div>
      ) : null}

      {!answer.title &&
      !answer.lead &&
      !answer.summary &&
      !answer.highlights?.length &&
      !answer.nextStep &&
      !visibleSources.length &&
      answer.plainText ? (
        <p className="max-w-[760px] whitespace-pre-wrap text-[15px] leading-[1.72] tracking-[-0.012em] text-[#334155]">
          {answer.plainText}
        </p>
      ) : null}
    </div>
  );
}
