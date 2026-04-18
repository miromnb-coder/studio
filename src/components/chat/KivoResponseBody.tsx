'use client';

import { ArrowUpRight, Check, Globe, ShieldCheck, Sparkles } from 'lucide-react';
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
      answer.plainText,
  );
}

export function KivoResponseBody({ answer }: KivoResponseBodyProps) {
  if (!hasRenderableContent(answer)) return null;

  const visibleSources = answer.sources?.filter((source) => source.used) ?? [];

  return (
    <div className="rounded-[28px] border border-[rgba(222,229,238,0.78)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,250,253,0.96))] p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:p-6">
      <div className="mb-5 flex flex-wrap items-center gap-2.5">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#dde6f0] bg-[#f9fbfe] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#718096]">
          <Sparkles className="h-3.5 w-3.5" />
          Kivo
        </span>

        {visibleSources.length ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d7eadc] bg-[#f4fbf6] px-3 py-1.5 text-[11px] font-semibold text-[#3c6c4a]">
            <ShieldCheck className="h-3.5 w-3.5" />
            Grounded answer
          </span>
        ) : null}
      </div>

      {answer.title ? (
        <h3 className="text-[26px] font-semibold leading-[1.08] tracking-[-0.045em] text-[#1f2937] sm:text-[30px]">
          {answer.title}
        </h3>
      ) : null}

      {answer.lead ? (
        <p className="mt-4 max-w-[780px] text-[20px] leading-[1.58] tracking-[-0.026em] text-[#2b3441]">
          {answer.lead}
        </p>
      ) : null}

      {answer.summary ? (
        <p className="mt-4 max-w-[780px] text-[16.8px] leading-[1.74] tracking-[-0.012em] text-[#435062]">
          {answer.summary}
        </p>
      ) : null}

      {answer.highlights?.length ? (
        <div className="mt-5 space-y-3 rounded-[22px] border border-[#e8edf4] bg-[linear-gradient(180deg,#fbfcfe,#f7fafe)] p-4">
          {answer.highlights.map((highlight, index) => {
            const tone = highlight.tone ?? 'default';

            const iconTone =
              tone === 'important'
                ? 'bg-[#fff3da] text-[#8a651a]'
                : tone === 'success'
                  ? 'bg-[#ecf8ef] text-[#326644]'
                  : tone === 'warning'
                    ? 'bg-[#fff1f1] text-[#8a4a4a]'
                    : 'bg-[#edf5ff] text-[#58759a]';

            const textTone =
              tone === 'important'
                ? 'text-[#5b4312]'
                : tone === 'success'
                  ? 'text-[#2f5c3f]'
                  : tone === 'warning'
                    ? 'text-[#7b3c3c]'
                    : 'text-[#334155]';

            return (
              <div key={`${highlight.text}-${index}`} className="flex gap-3">
                <span
                  className={`mt-1.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${iconTone}`}
                >
                  <Check className="h-3.5 w-3.5" />
                </span>
                <p className={`text-[15px] leading-[1.68] ${textTone}`}>
                  {highlight.text}
                </p>
              </div>
            );
          })}
        </div>
      ) : null}

      {answer.nextStep ? (
        <div className="mt-5 rounded-[22px] border border-[#e8edf4] bg-white/80 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#96a0af]">
            Next step
          </div>
          <p className="mt-2 max-w-[760px] text-[15px] leading-[1.68] tracking-[-0.012em] text-[#334155]">
            {answer.nextStep}
          </p>
        </div>
      ) : null}

      {visibleSources.length ? (
        <div className="mt-5 border-t border-[#edf2f7] pt-4">
          <div className="mb-3 flex items-center gap-2 text-[12px] text-[#7a8598]">
            <span className="font-medium text-[#8e99ab]">Built from</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e7edf4] bg-[#fbfdff] px-2.5 py-1 font-medium">
              <Globe className="h-3.5 w-3.5" />
              Sources
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {visibleSources.map((source) => (
              <a
                key={source.id}
                href={source.url || '#'}
                target="_blank"
                rel="noreferrer"
                className="group rounded-[20px] border border-[#e7edf5] bg-[linear-gradient(180deg,#ffffff,#fbfdff)] p-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)] transition duration-200 hover:-translate-y-[1px] hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#97a1af]">
                      Source
                    </p>
                    <h4 className="mt-2 line-clamp-2 text-[16px] font-semibold leading-[1.35] tracking-[-0.018em] text-[#243041]">
                      {source.label}
                    </h4>
                  </div>

                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e2e8f0] bg-white text-[#6c7a8f] transition group-hover:text-[#253244]">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </div>

                {source.snippet ? (
                  <p className="mt-3 line-clamp-3 text-[13px] leading-[1.65] text-[#5d697a]">
                    {source.snippet}
                  </p>
                ) : null}
              </a>
            ))}
          </div>
        </div>
      ) : null}

      {!answer.title &&
      !answer.lead &&
      !answer.summary &&
      !answer.highlights?.length &&
      !answer.nextStep &&
      !visibleSources.length &&
      answer.plainText ? (
        <p className="mt-4 max-w-[780px] whitespace-pre-wrap text-[16.8px] leading-[1.74] tracking-[-0.012em] text-[#435062]">
          {answer.plainText}
        </p>
      ) : null}
    </div>
  );
}
