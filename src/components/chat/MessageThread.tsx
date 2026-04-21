'use client';

import { motion } from 'framer-motion';
import type { Message } from '@/app/store/app-store';
import { AttachmentPreview } from './AttachmentPreview';
import { KivoAssistantMessage } from './kivo/KivoAssistantMessage';

type MessageThreadProps = {
  messages: Message[];
  pending: boolean;
};

type ThreadRow =
  | { type: 'divider'; id: string; label: string }
  | { type: 'message'; id: string; message: Message; index: number };

function normalizeResponseType(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  return normalized || null;
}

function getStructuredDataRecord(
  value: unknown,
): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function getExplicitStructuredResponseType(message: Message): string | null {
  const structuredData = getStructuredDataRecord(message.structuredData);
  const metadata = getStructuredDataRecord(message.agentMetadata);
  const metadataStructuredData = getStructuredDataRecord(metadata?.structuredData);

  return (
    normalizeResponseType(structuredData?.responseType) ??
    normalizeResponseType(structuredData?.response_type) ??
    normalizeResponseType(metadataStructuredData?.responseType) ??
    normalizeResponseType(metadataStructuredData?.response_type)
  );
}

function hasExplicitStructuredResponseType(message: Message): boolean {
  return Boolean(getExplicitStructuredResponseType(message));
}

function hasExecutionPayload(message: Message): boolean {
  const structuredData = getStructuredDataRecord(message.structuredData);
  const metadata = getStructuredDataRecord(message.agentMetadata);

  const structuredExecution = getStructuredDataRecord(structuredData?.execution);
  const metadataExecution = getStructuredDataRecord(metadata?.execution);

  return Boolean(structuredExecution || metadataExecution);
}

function isRichAssistantMessage(message: Message): boolean {
  return hasExplicitStructuredResponseType(message) || hasExecutionPayload(message);
}

function normalizeComparableText(text: string): string {
  return text.replace(/\s+/g, ' ').trim().toLowerCase();
}

function isNearDuplicateAssistantContent(a: string, b: string): boolean {
  const left = normalizeComparableText(a);
  const right = normalizeComparableText(b);

  if (!left || !right) return false;
  if (left === right) return true;

  const shorter = left.length <= right.length ? left : right;
  const longer = left.length > right.length ? left : right;

  if (shorter.length >= 32 && longer.includes(shorter)) return true;

  const overlapRatio = shorter.length / longer.length;
  if (overlapRatio >= 0.82) {
    const prefixLength = Math.min(shorter.length, 220);
    if (longer.slice(0, prefixLength) === shorter.slice(0, prefixLength)) {
      return true;
    }
  }

  return false;
}

function compactDuplicateAssistantMessages(messages: Message[]): Message[] {
  if (messages.length < 2) return messages;

  const visible: Message[] = [];

  for (const message of messages) {
    const previous = visible[visible.length - 1];

    if (!previous) {
      visible.push(message);
      continue;
    }

    const shouldReplacePreviousPlainAssistant =
      previous.role === 'assistant' &&
      message.role === 'assistant' &&
      !previous.isStreaming &&
      !message.isStreaming &&
      !isRichAssistantMessage(previous) &&
      isRichAssistantMessage(message) &&
      isNearDuplicateAssistantContent(previous.content, message.content);

    if (shouldReplacePreviousPlainAssistant) {
      visible[visible.length - 1] = message;
      continue;
    }

    const shouldDropLaterPlainDuplicate =
      previous.role === 'assistant' &&
      message.role === 'assistant' &&
      isRichAssistantMessage(previous) &&
      !isRichAssistantMessage(message) &&
      !previous.isStreaming &&
      !message.isStreaming &&
      isNearDuplicateAssistantContent(previous.content, message.content);

    if (shouldDropLaterPlainDuplicate) {
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

function buildThreadRows(messages: Message[]): ThreadRow[] {
  const rows: ThreadRow[] = [];

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

function getLatestUserContentBeforeIndex(
  messages: Message[],
  index: number,
): string {
  for (let i = index - 1; i >= 0; i -= 1) {
    if (messages[i]?.role === 'user') {
      return messages[i]?.content ?? '';
    }
  }
  return '';
}

export function MessageThread({ messages }: MessageThreadProps) {
  const renderedMessages = compactDuplicateAssistantMessages(messages);
  const rows = buildThreadRows(renderedMessages);

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
          const latestUserContent = getLatestUserContentBeforeIndex(
            renderedMessages,
            index,
          );

          return (
            <div
              key={row.id}
              className={`message-appear flex ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <article
                className={`w-full ${
                  isUser ? 'max-w-[82%] sm:max-w-[70%]' : 'max-w-full'
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
                    <motion.div
                      layout
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                      className="w-full max-w-[840px]"
                    >
                      <KivoAssistantMessage
                        message={message}
                        latestUserContent={latestUserContent}
                      />
                    </motion.div>

                    {message.attachments?.length ? (
                      <div className="mt-4">
                        <AttachmentPreview attachments={message.attachments} />
                      </div>
                    ) : null}

                    <div className="mt-4 flex items-center justify-end px-1">
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
      </div>
    </div>
  );
}
