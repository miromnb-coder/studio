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
    <div className="space-y-4.5">
      {answer.title ? (
        <h3 className="text-[23px] font-semibold leading-[1.25] tracking-[-0.03em] text-[#1f2a3a]">
          {answer.title}
        </h3>
      ) : null}

      {answer.summary ? (
        <p className="max-w-[780px] text-[16px] leading-[1.65] tracking-[-0.015em] text-[#4b5a70]">
          {answer.summary}
        </p>
      ) : null}

      {answer.sections?.length ? (
        <div className="space-y-2.5">
          {answer.sections.map((section, index) => (
            <StructuredSection
              key={`${section.label ?? 'section'}-${index}`}
              section={section}
            />
          ))}
        </div>
      ) : null}

      {answer.bullets?.length ? (
        <ul className="space-y-2 text-[15px] leading-[1.65] text-[#37465b]">
          {answer.bullets.map((bullet, index) => (
            <li key={`${bullet}-${index}`} className="flex gap-2.5">
              <span className="mt-[1px] text-[#7c8ca2]">•</span>
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {answer.sources?.length ? <StructuredSourceRow sources={answer.sources} /> : null}

      {answer.actions?.length ? <StructuredActionRow actions={answer.actions} /> : null}

      <StructuredOutcome outcome={answer.outcome} />
    </div>
  );
}
