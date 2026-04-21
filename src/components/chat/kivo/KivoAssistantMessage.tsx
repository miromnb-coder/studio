'use client';

import type { Message } from '@/app/store/app-store';
import { ResponseRenderer } from '@/components/chat/ResponseRenderer';
import { getExecutionPresentation } from './execution/get-execution-presentation';
import { KivoExecutionCard } from './execution/KivoExecutionCard';
import { KivoThinkingState as KivoExecutionThinkingState } from './execution/KivoThinkingState';
import type { KivoExecutionInput } from './execution/types';

function inferExecutionInput(message: Message): KivoExecutionInput | undefined {
  const metadata = message.agentMetadata as Record<string, unknown> | undefined;
  const structured = message.structuredData as Record<string, unknown> | undefined;

  const source =
    (structured?.execution as Record<string, unknown> | undefined) ??
    (metadata?.execution as Record<string, unknown> | undefined);

  if (!source) return undefined;

  return {
    intent:
      typeof source.intent === 'string'
        ? (source.intent as KivoExecutionInput['intent'])
        : undefined,
    introText:
      typeof source.introText === 'string' ? source.introText : undefined,
    statusText:
      typeof source.statusText === 'string' ? source.statusText : undefined,
    activeStepId:
      typeof source.activeStepId === 'string' ? source.activeStepId : undefined,
    doneStepIds: Array.isArray(source.doneStepIds)
      ? source.doneStepIds.filter((item): item is string => typeof item === 'string')
      : undefined,
    errorStepIds: Array.isArray(source.errorStepIds)
      ? source.errorStepIds.filter((item): item is string => typeof item === 'string')
      : undefined,
    forceMode:
      typeof source.forceMode === 'string'
        ? (source.forceMode as KivoExecutionInput['forceMode'])
        : undefined,
    toolCount:
      typeof source.toolCount === 'number' ? source.toolCount : undefined,
  };
}

function KivoBrandHeader() {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-8 w-8 items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-7 w-7 text-[#171717]"
            fill="none"
          >
            <circle cx="16.5" cy="7.5" r="2.1" fill="currentColor" />
            <path
              d="M6.5 15.2c1.3-3.8 4.2-6.1 7.9-6.1 2.6 0 4.2.8 5.8 2.5"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
            />
            <path
              d="M4.6 12.7c1.1 5 4.7 7.7 9.4 7.7 3.1 0 5.3-1 7.2-3"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
            />
          </svg>
        </span>

        <span
          className="text-[26px] font-semibold tracking-[-0.03em] text-[#171717]"
          style={{ fontFamily: 'ui-serif, Georgia, Times, serif' }}
        >
          Kivo
        </span>

        <span className="inline-flex items-center rounded-[10px] border border-black/[0.08] bg-white px-2 py-0.5 text-[13px] font-medium text-[#8e8e93] shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          Lite
        </span>
      </div>
    </div>
  );
}

export function KivoAssistantMessage({
  message,
  latestUserContent,
}: {
  message: Message;
  latestUserContent: string;
}) {
  const executionInput = inferExecutionInput(message);
  const presentation = getExecutionPresentation(executionInput);

  const hasExecutionCard = presentation.mode === 'execution';
  const hasThinkingChip =
    presentation.mode === 'thinking' || presentation.mode === 'status';

  return (
    <div className="w-full max-w-[840px]">
      <KivoBrandHeader />

      {presentation.introText ? (
        <div className="mb-3 max-w-[680px] text-[18px] leading-[1.28] tracking-[-0.025em] text-[#1b1b1f] sm:text-[20px]">
          {presentation.introText}
        </div>
      ) : null}

      {hasThinkingChip ? (
        <div className="mb-4 pl-[2px]">
          <KivoExecutionThinkingState
            text={presentation.statusText ?? 'Thinking'}
          />
        </div>
      ) : null}

      {hasExecutionCard ? (
        <div className="mb-4">
          <KivoExecutionCard presentation={presentation} />
        </div>
      ) : null}

      <div className="max-w-[760px] text-[#1b1b1f]">
        <ResponseRenderer
          message={message}
          latestUserContent={latestUserContent}
        />
      </div>
    </div>
  );
}

export default KivoAssistantMessage;
