'use client';

import { AnimatePresence, motion } from 'framer-motion';
import type { Message } from '@/app/store/app-store';
import type { ResponseMode } from '@/agent/types/response-mode';
import { mapAgentStepsToThinkingState } from '@/lib/mapAgentEventToThinkingState';
import { AttachmentPreview } from './AttachmentPreview';
import { KivoThinkingState } from './KivoThinkingState';
import { ResponseRenderer } from './ResponseRenderer';

type MessageThreadProps = {
  messages: Message[];
  pending: boolean;
};

function normalizeResponseType(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  return normalized || null;
}

function hasExplicitStructuredResponseType(message: Message): boolean {
  const structuredData = (message.structuredData ?? null) as
    | Record<string, unknown>
    | null;

  const responseType =
    normalizeResponseType(structuredData?.responseType) ??
    normalizeResponseType(structuredData?.response_type) ??
    normalizeResponseType(
      (message.agentMetadata?.structuredData as Record<string, unknown> | undefined)
        ?.responseType,
    ) ??
    normalizeResponseType(
      (message.agentMetadata?.structuredData as Record<string, unknown> | undefined)
        ?.response_type,
    );

  return Boolean(responseType);
}

function compactDuplicateAssistantText(messages: Message[]): Message[] {
  if (messages.length < 2) return messages;

  const visible: Message[] = [];

  for (const message of messages) {
    const previous = visible[visible.length - 1];
    const messageText = message.content.trim();
    const previousText = previous?.content.trim() ?? '';

    const shouldReplacePreviousPlainAssistant =
      Boolean(previous) &&
      previous.role === 'assistant' &&
      message.role === 'assistant' &&
      !previous.isStreaming &&
      !hasExplicitStructuredResponseType(previous) &&
      hasExplicitStructuredResponseType(message) &&
      Boolean(previousText) &&
      previousText === messageText;

    if (shouldReplacePreviousPlainAssistant) {
      visible[visible.length - 1] = message;
      continue;
    }

    visible.push(message);
  }

  return visible;
}

function isSameDay(a: string, b: string): boolean {
  const da = new Date(a);
  const db = new Date(b);

  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

function formatDateDivider(iso: string): string {
  const date = new Date(iso);
  const now = new Date();

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  if (isSameDay(iso, now.toISOString())) return 'Today';
  if (isSameDay(iso, yesterday.toISOString())) return 'Yesterday';

  return date.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
  });
}

function formatMessageTime(iso: string): string {
  const date = new Date(iso);

  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function buildThreadRows(messages: Message[]) {
  const rows: Array<
    | { type: 'divider'; id: string; label: string }
    | { type: 'message'; id: string; message: Message; index: number }
  > = [];

  messages.forEach((message, index) => {
    const previous = messages[index - 1];
    const needsDivider =
      !previous || !isSameDay(previous.createdAt, message.createdAt);

    if (needsDivider) {
      rows.push({
        type: 'divider',
        id: `divider-${message.id}`,
        label: formatDateDivider(message.createdAt),
      });
    }

    rows.push({
      type: 'message',
      id: message.id,
      message,
      index,
    });
  });

  return rows;
}

function resolveResponseMode(messages: Message[]): ResponseMode {
  const streamingAssistant = [...messages]
    .reverse()
    .find((message) => message.role === 'assistant' && message.isStreaming);
  const metadata = streamingAssistant?.agentMetadata;

  if (
    metadata?.responseMode === 'casual' ||
    metadata?.responseMode === 'fast' ||
    metadata?.responseMode === 'operator' ||
    metadata?.responseMode === 'tool' ||
    metadata?.responseMode === 'fallback'
  ) {
    return metadata.responseMode;
  }

  const structuredMode =
    metadata?.structuredData && typeof metadata.structuredData === 'object'
      ? (metadata.structuredData.response_mode as string | undefined)
      : undefined;

  if (
    structuredMode === 'casual' ||
    structuredMode === 'fast' ||
    structuredMode === 'operator' ||
    structuredMode === 'tool' ||
    structuredMode === 'fallback'
  ) {
    return structuredMode;
  }

  return 'fallback';
}

function getThinkingState(messages: Message[], pending: boolean) {
  const latestAssistant = [...messages]
    .reverse()
    .find((message) => message.role === 'assistant');

  return mapAgentStepsToThinkingState({
    isStreaming: pending || Boolean(latestAssistant?.isStreaming),
    steps: latestAssistant?.agentMetadata?.steps,
  });
}

export function MessageThread({ messages, pending }: MessageThreadProps) {
  const renderedMessages = compactDuplicateAssistantText(messages);
  const rows = buildThreadRows(renderedMessages);
  const pendingMode = resolveResponseMode(renderedMessages);
  const thinkingState = getThinkingState(renderedMessages, pending);
  const latestAssistant = [...renderedMessages]
    .reverse()
    .find((message) => message.role === 'assistant');
  const assistantHasVisibleStreamContent = Boolean(
    latestAssistant?.isStreaming && latestAssistant.content.trim().length > 0,
  );

  const showThinkingState =
    pending &&
    pendingMode !== 'casual' &&
    Boolean(thinkingState) &&
    !assistantHasVisibleStreamContent;

  if (renderedMessages.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center px-8 pb-[188px] pt-8">
        <p
          className="max-w-[340px] text-center text-[20px] font-normal leading-[1.18] tracking-[-0.02em] text-[#4a5160]"
          style={{ fontFamily: 'ui-serif, Georgia, Times, serif' }}
        >
          What can I do for you?
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 px-4 pb-8 pt-6 sm:px-6">
      <div className="mx-auto w-full max-w-[980px] space-y-8">
        {rows.map((row) => {
          if (row.type === 'divider') {
            return (
              <div key={row.id} className="flex items-center gap-4 py-1">
                <div className="h-px flex-1 bg-[rgba(158,168,184,0.18)]" />
                <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#9aa3b0]">
                  {row.label}
                </span>
                <div className="h-px flex-1 bg-[rgba(158,168,184,0.18)]" />
              </div>
            );
          }

          const { message, index } = row;
          const isUser = message.role === 'user';
          const isError = Boolean(message.error);
          const latestUserContent =
            [...renderedMessages]
              .slice(0, index)
              .reverse()
              .find((item) => item.role === 'user')?.content ?? '';

          return (
            <div
              key={row.id}
              className={`message-appear flex ${
                isUser ? 'justify-end' : 'justify-start'
              }`}
            >
              <article
                className={`w-full ${
                  isUser
                    ? 'max-w-[82%] sm:max-w-[70%]'
                    : 'max-w-full'
                }`}
              >
                {isUser ? (
                  <div className="rounded-[28px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(247,249,252,0.94))] px-4 py-3.5 shadow-[0_12px_28px_rgba(15,23,42,0.05)] backdrop-blur-xl">
                    <p className="whitespace-pre-wrap text-[15px] leading-[1.68] tracking-[-0.016em] text-[#414958]">
                      {message.content}
                    </p>

                    {message.attachments?.length ? (
                      <div className="mt-3.5">
                        <AttachmentPreview attachments={message.attachments} />
                      </div>
                    ) : null}

                    <div className="mt-3 flex items-center justify-end">
                      <span className="text-[11px] font-medium tracking-[0.01em] text-[#98a1af]">
                        {formatMessageTime(message.createdAt)}
                      </span>
                    </div>

                    {isError ? (
                      <p className="mt-2.5 text-xs text-[#9b4d4d]">
                        {message.error}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <motion.div
                    layout
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="w-full px-1 py-1"
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-[rgba(126,136,153,0.72)]" />
                      <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#8f98a8]">
                        Kivo
                      </span>
                    </div>

                    <motion.div
                      layout
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                      className="w-full max-w-[840px]"
                    >
                      <ResponseRenderer
                        message={message}
                        latestUserContent={latestUserContent}
                      />
                    </motion.div>

                    {message.attachments?.length ? (
                      <div className="mt-4">
                        <AttachmentPreview attachments={message.attachments} />
                      </div>
                    ) : null}

                    <div className="mt-4 flex items-center justify-between gap-3 px-1">
                      <div className="text-[11px] font-medium tracking-[0.01em] text-[#a0a8b5]">
                        Assistant
                      </div>
                      <span className="text-[11px] font-medium tracking-[0.01em] text-[#98a1af]">
                        {formatMessageTime(message.createdAt)}
                      </span>
                    </div>

                    {isError ? (
                      <p className="mt-2.5 px-1 text-xs text-[#9b4d4d]">
                        {message.error}
                      </p>
                    ) : null}
                  </motion.div>
                )}
              </article>
            </div>
          );
        })}

        <AnimatePresence initial={false} mode="wait">
          {showThinkingState && thinkingState ? (
            <motion.div
              key="kivo-thinking"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="flex justify-start"
            >
              <KivoThinkingState
                status={thinkingState.status}
                visualState={thinkingState.visualState}
                className="max-w-[760px]"
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
