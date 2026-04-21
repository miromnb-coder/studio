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
      {presentation.introText ? (
        <div className="mb-3 rounded-[24px] border border-black/[0.06] bg-white px-4 py-3 text-[15px] leading-7 tracking-[-0.015em] text-[#141419] shadow-[0_10px_24px_rgba(0,0,0,0.035)]">
          {presentation.introText}
        </div>
      ) : null}

      {hasThinkingChip ? (
        <div className="mb-3">
          <KivoExecutionThinkingState
            text={presentation.statusText ?? 'Thinking...'}
          />
        </div>
      ) : null}

      {hasExecutionCard ? (
        <div className="mb-3">
          <KivoExecutionCard presentation={presentation} />
        </div>
      ) : null}

      <ResponseRenderer
        message={message}
        latestUserContent={latestUserContent}
      />
    </div>
  );
}

export default KivoAssistantMessage;
