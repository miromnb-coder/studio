'use client';

import { useEffect, useMemo, useRef } from 'react';
import { CircleDashed } from 'lucide-react';
import type { Message } from '@/app/store/app-store';
import { AttachmentPreview } from './AttachmentPreview';
import { AgentResponseMessage } from './AgentResponseMessage';

type MessageThreadProps = {
  messages: Message[];
  pending: boolean;
};

const BOTTOM_THRESHOLD_PX = 120;

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

export function MessageThread({ messages, pending }: MessageThreadProps) {
  const listRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(true);

  const rows = useMemo(() => buildThreadRows(messages), [messages]);

  useEffect(() => {
    const node = listRef.current;
    if (!node) return;

    const distanceFromBottom =
      node.scrollHeight - node.scrollTop - node.clientHeight;
    shouldAutoScrollRef.current = distanceFromBottom < BOTTOM_THRESHOLD_PX;
  }, []);

  useEffect(() => {
    const node = listRef.current;
    if (!node || !shouldAutoScrollRef.current) return;
    node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' });
  }, [messages, pending]);

  const handleScroll = () => {
    const node = listRef.current;
    if (!node) return;
    const distanceFromBottom =
      node.scrollHeight - node.scrollTop - node.clientHeight;
    shouldAutoScrollRef.current = distanceFromBottom < BOTTOM_THRESHOLD_PX;
  };

  if (messages.length === 0) {
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
    <div
      ref={listRef}
      onScroll={handleScroll}
      className="min-h-0 flex-1 overflow-y-auto px-4 pb-[196px] pt-5 sm:px-6"
    >
      <div className="mx-auto w-full max-w-[920px] space-y-6">
        {rows.map((row) => {
          if (row.type === 'divider') {
            return (
              <div key={row.id} className="flex items-center gap-3 py-1.5">
                <div className="h-px flex-1 bg-[#e8ecf2]" />
                <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#9ca4b2]">
                  {row.label}
                </span>
                <div className="h-px flex-1 bg-[#e8ecf2]" />
              </div>
            );
          }

          const { message, index } = row;
          const isUser = message.role === 'user';
          const isError = Boolean(message.error);
          const latestUserContent =
            [...messages]
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
                  isUser ? 'max-w-[78%] sm:max-w-[70%]' : 'max-w-full sm:max-w-[92%]'
                }`}
              >
                {isUser ? (
                  <div className="rounded-[26px] border border-[#dde2ea] bg-[linear-gradient(180deg,rgba(247,248,251,0.96),rgba(243,245,248,0.98))] px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                    <p className="whitespace-pre-wrap text-[15px] leading-[1.65] tracking-[-0.016em] text-[#424a59]">
                      {message.content}
                    </p>

                    {message.attachments?.length ? (
                      <div className="mt-3">
                        <AttachmentPreview attachments={message.attachments} />
                      </div>
                    ) : null}

                    <div className="mt-3 flex items-center justify-end">
                      <span className="text-[11px] font-medium tracking-[0.01em] text-[#98a1af]">
                        {formatMessageTime(message.createdAt)}
                      </span>
                    </div>

                    {isError ? (
                      <p className="mt-2 text-xs text-[#9b4d4d]">{message.error}</p>
                    ) : null}
                  </div>
                ) : (
                  <div className="px-0.5 py-1">
                    <AgentResponseMessage
                      message={message}
                      latestUserContent={latestUserContent}
                      liveSteps={
                        message.isStreaming
                          ? (message.agentMetadata?.steps ?? [])
                          : undefined
                      }
                    />

                    {message.attachments?.length ? (
                      <div className="mt-4">
                        <AttachmentPreview attachments={message.attachments} />
                      </div>
                    ) : null}

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#a0a8b5]">
                        Assistant
                      </div>
                      <span className="text-[11px] font-medium tracking-[0.01em] text-[#98a1af]">
                        {formatMessageTime(message.createdAt)}
                      </span>
                    </div>

                    {isError ? (
                      <p className="mt-2 text-xs text-[#9b4d4d]">{message.error}</p>
                    ) : null}
                  </div>
                )}
              </article>
            </div>
          );
        })}

        {pending ? (
          <div className="flex justify-start">
            <div className="rounded-full border border-[#e0e5ec] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(247,249,252,0.96))] px-3.5 py-1.5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
              <div className="inline-flex items-center gap-2.5 text-[12px] font-medium tracking-[-0.01em] text-[#727c8d]">
                <CircleDashed className="h-4 w-4 animate-spin" />
                Assistant is responding…
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
