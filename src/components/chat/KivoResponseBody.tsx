'use client';

import type { StructuredAnswer } from '@/agent/vNext/types';

type KivoResponseBodyProps = {
  answer: StructuredAnswer;
};

function hasRenderableContent(answer: StructuredAnswer) {
  return Boolean(
    answer.title ||
      answer.summary ||
      answer.sections?.length ||
      answer.bullets?.length ||
      answer.plainText
  );
}

export function KivoResponseBody({ answer }: KivoResponseBodyProps) {
  if (!hasRenderableContent(answer)) return null;

  return (
    <div className="space-y-5">
      {answer.title ? (
        <h3 className="text-[24px] font-semibold leading-[1.18] tracking-[-0.035em] text-[#202938]">
          {answer.title}
        </h3>
      ) : null}

      {answer.summary ? (
        <p className="max-w-[760px] text-[16px] leading-[1.72] tracking-[-0.015em] text-[#4f5d72]">
          {answer.summary}
        </p>
      ) : null}

      {answer.sections?.length ? (
        <div className="space-y-4">
          {answer.sections.map((section, index) => {
            const tone = section.tone ?? 'default';

            const labelColor =
              tone === 'important'
                ? 'text-[#b8871a]'
                : tone === 'success'
                ? 'text-[#5f9770]'
                : tone === 'warning'
                ? 'text-[#c17a7a]'
                : 'text-[#8f98a7]';

            const textColor =
              tone === 'important'
                ? 'text-[#5b3c0d]'
                : tone === 'success'
                ? 'text-[#1f5132]'
                : tone === 'warning'
                ? 'text-[#6a2b2b]'
                : 'text-[#334155]';

            return (
              <section key={`${section.label ?? 'section'}-${index}`} className="space-y-1.5">
                {section.label ? (
                  <h4
                    className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${labelColor}`}
                  >
                    {section.label}
                  </h4>
                ) : null}

                <p
                  className={`text-[15px] leading-[1.68] tracking-[-0.012em] ${textColor}`}
                >
                  {section.content}
                </p>
              </section>
            );
          })}
        </div>
      ) : null}

      {answer.bullets?.length ? (
        <ul className="space-y-2.5 text-[15px] leading-[1.7] tracking-[-0.01em] text-[#37465b]">
          {answer.bullets.map((bullet, index) => (
            <li key={`${bullet}-${index}`} className="flex gap-3">
              <span className="mt-[2px] text-[#97a1af]">•</span>
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {!answer.title &&
      !answer.summary &&
      !answer.sections?.length &&
      !answer.bullets?.length &&
      answer.plainText ? (
        <p className="max-w-[760px] whitespace-pre-wrap text-[15px] leading-[1.72] tracking-[-0.012em] text-[#334155]">
          {answer.plainText}
        </p>
      ) : null}
    </div>
  );
}
