'use client';

import type { Message } from '@/app/store/app-store';
import { ResponseRenderer } from '@/components/chat/ResponseRenderer';

import { getExecutionPresentation } from './execution/get-execution-presentation';
import { KivoExecutionCard } from './execution/KivoExecutionCard';
import { KivoThinkingState as KivoExecutionThinkingState } from './execution/KivoThinkingState';
import type { KivoExecutionInput } from './execution/types';

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function readStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const filtered = value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  return filtered.length ? filtered : undefined;
}

function inferExecutionInput(message: Message): KivoExecutionInput | undefined {
  const metadata = message.agentMetadata as Record<string, unknown> | undefined;
  const structured = message.structuredData as Record<string, unknown> | undefined;

  const source =
    (structured?.execution as Record<string, unknown> | undefined) ??
    (metadata?.execution as Record<string, unknown> | undefined);

  if (!source) return undefined;

  return {
    intent: readString(source.intent) as KivoExecutionInput['intent'] | undefined,
    introText: readString(source.introText),
    statusText: readString(source.statusText),
    activeStepId: readString(source.activeStepId),
    doneStepIds: readStringArray(source.doneStepIds),
    errorStepIds: readStringArray(source.errorStepIds),
    forceMode: readString(source.forceMode) as KivoExecutionInput['forceMode'] | undefined,
    toolCount: typeof source.toolCount === 'number' ? source.toolCount : undefined,
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

  const hasThinkingChip = presentation.mode === 'thinking' || presentation.mode === 'status';
  const hasExecutionCard = presentation.mode === 'execution';

  return (
    <div className="space-y-3 sm:space-y-4">
      {presentation.introText ? (
        <div className="max-w-[42rem] text-[15px] leading-6 text-neutral-700 sm:text-base">
          {presentation.introText}
        </div>
      ) : null}

      {hasThinkingChip ? (
        <div className="max-w-[42rem]">
          <KivoExecutionThinkingState
            text={presentation.statusText ?? 'Working on it...'}
          />
        </div>
      ) : null}

      {hasExecutionCard ? (
        <div className="max-w-[42rem]">
          <KivoExecutionCard presentation={presentation} />
        </div>
      ) : null}

      <div className="max-w-[42rem]">
        <ResponseRenderer
          content={message.content}
          structuredData={message.structuredData}
          latestUserContent={latestUserContent}
        />
      </div>
    </div>
  );
}

export default KivoAssistantMessage;
