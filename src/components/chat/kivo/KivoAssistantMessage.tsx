'use client';

import { getExecutionPresentation } from './execution/get-execution-presentation';
import { KivoExecutionCard } from './execution/KivoExecutionCard';
import { KivoThinkingState } from './execution/KivoThinkingState';
import type { KivoExecutionInput } from './execution/types';

export function KivoAssistantMessage({
  text,
  execution,
}: {
  text?: string;
  execution?: KivoExecutionInput;
}) {
  const presentation = getExecutionPresentation(execution);

  return (
    <div className="w-full">
      <div className="max-w-[92%] rounded-[28px] rounded-tl-[12px] border border-black/[0.06] bg-white px-4 py-3 text-[#141419] shadow-[0_10px_24px_rgba(0,0,0,0.035)]">
        {text ? (
          <div className="text-[15px] leading-7 tracking-[-0.015em]">
            {text}
          </div>
        ) : null}

        {presentation.mode === 'thinking' ? (
          <div className={text ? 'mt-3' : ''}>
            <KivoThinkingState text={presentation.statusText ?? 'Thinking...'} />
          </div>
        ) : null}

        {presentation.mode === 'status' ? (
          <div className={text ? 'mt-3' : ''}>
            <KivoThinkingState text={presentation.statusText ?? 'Working...'} />
          </div>
        ) : null}
      </div>

      {presentation.mode === 'execution' ? (
        <div className="mt-3 max-w-[92%]">
          <KivoExecutionCard presentation={presentation} />
        </div>
      ) : null}
    </div>
  );
}
