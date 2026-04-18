'use client';

import type { StructuredAnswer } from '@/agent/vNext/types';
import { StructuredActionRow } from './StructuredActionRow';
import { StructuredOutcome } from './StructuredOutcome';
import { StructuredSection } from './StructuredSection';
import { StructuredSourceRow } from './StructuredSourceRow';

type StructuredAnswerViewProps = {
  answer: StructuredAnswer;
};

export function StructuredAnswerView({ answer }: StructuredAnswerViewProps) {
  return (
    <div className="space-y-5">
      {answer.title ? (
        <h3 className="text-[24px] font-semibold leading-[1.2] tracking-[-0.035em] text-[#202938]">
          {answer.title}
        </h3>
      ) : null}

      {answer.summary ? (
        <p className="max-w-[760px] text-[16px] leading-[1.72] tracking-[-0.015em] text-[#4f5d72]">
          {answer.summary}
        </p>
      ) : null}

      {answer.sections?.length ? (
        <div className="space-y-3">
          {answer.sections.map((section, index) => (
            <StructuredSection
              key={`${section.label ?? 'section'}-${index}`}
              section={section}
            />
          ))}
        </div>
      ) : null}

      {answer.bullets?.length ? (
        <ul className="space-y-2.5 text-[15px] leading-[1.7] tracking-[-0.01em] text-[#37465b]">
          {answer.bullets.map((bullet, index) => (
            <li key={`${bullet}-${index}`} className="flex gap-3">
              <span className="mt-[2px] text-[#8d98a8]">•</span>
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {answer.sources?.length ? (
        <div className="pt-1">
          <StructuredSourceRow sources={answer.sources} />
        </div>
      ) : null}

      {answer.actions?.length ? (
        <div className="pt-1">
          <StructuredActionRow actions={answer.actions} />
        </div>
      ) : null}

      {answer.outcome ? (
        <div className="pt-1">
          <StructuredOutcome outcome={answer.outcome} />
        </div>
      ) : null}
    </div>
  );
}
