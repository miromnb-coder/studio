'use client';

import { useEffect, useRef } from 'react';
import { CircleDashed } from 'lucide-react';
import type { Message } from '@/app/store/app-store';
import { AttachmentPreview } from './AttachmentPreview';
import { AgentResponseMessage } from './AgentResponseMessage';

type MessageThreadProps = {
  messages: Message[];
  pending: boolean;
};

const BOTTOM_THRESHOLD_PX = 120;

export function MessageThread({ messages, pending }: MessageThreadProps) {
  const listRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(true);

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
          className="max-w-[310px] text-center text-[18px] font-normal leading-[1.18] tracking-[-0.015em] text-[#474d5a]"
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
      className="min-h-0 flex-1 overflow-y-auto px-4 pb-[196px] pt-4 sm:px-6"
    >
      <div className="space-y-3">
        {messages.map((message, index) => {
          const isUser = message.role === 'user';
          const isError = Boolean(message.error);
          const latestUserContent =
            [...messages]
              .slice(0, index)
              .reverse()
              .find((item) => item.role === 'user')?.content ?? '';

          return (
            <div
              key={message.id}
              className={`message-appear flex ${
                isUser ? 'justify-end' : 'justify-start'
              }`}
            >
              <article className="max-w-[88%]">
                {isUser ? (
                  <div className="rounded-[20px] border border-[#d5dae2] bg-[#f7f8fb] px-3.5 py-3 text-[14px] leading-6 text-[#424a59]">
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    {message.attachments?.length ? (
                      <AttachmentPreview attachments={message.attachments} />
                    ) : null}
                    {isError ? (
                      <p className="mt-2 text-xs text-[#9b4d4d]">{message.error}</p>
                    ) : null}
                  </div>
                ) : (
                  <div className="px-1 py-1 text-[#586170]">
                    <AgentResponseMessage
                      message={message}
                      latestUserContent={latestUserContent}
                    />

                    {message.attachments?.length ? (
                      <AttachmentPreview attachments={message.attachments} />
                    ) : null}

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
          <div className="px-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#dde2ea] bg-[#f7f8fb] px-3 py-1.5 text-xs text-[#7f8897]">
              <CircleDashed className="h-3.5 w-3.5 animate-spin" />
              Assistant is responding…
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
