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
      <div className="flex min-h-0 flex-1 items-center justify-center px-8 pb-[196px] pt-10">
        <p
          className="max-w-[320px] text-center text-[18px] font-normal leading-[1.18] tracking-[-0.02em] text-[#525968]"
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
      className="min-h-0 flex-1 overflow-y-auto px-5 pb-[210px] pt-5 sm:px-6"
    >
      <div className="mx-auto flex w-full max-w-[760px] flex-col gap-5">
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
              <article
                className={`w-full ${
                  isUser ? 'max-w-[78%] sm:max-w-[72%]' : 'max-w-[92%]'
                }`}
              >
                {isUser ? (
                  <div className="rounded-[28px] border border-[#d8dde7] bg-[rgba(255,255,255,0.72)] px-5 py-4 text-[15px] leading-7 text-[#454d5b] shadow-[0_10px_28px_rgba(44,52,68,0.05)] backdrop-blur-[10px]">
                    <p className="whitespace-pre-wrap break-words">
                      {message.content}
                    </p>

                    {message.attachments?.length ? (
                      <div className="mt-3">
                        <AttachmentPreview attachments={message.attachments} />
                      </div>
                    ) : null}

                    {isError ? (
                      <p className="mt-2 text-xs text-[#9b4d4d]">
                        {message.error}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <div className="px-1">
                    <div className="mb-3 flex items-center gap-2.5 pl-0.5">
                      <div className="flex h-9 items-center gap-2 text-[#1f2430]">
                        <span
                          className="text-[24px] font-semibold tracking-[-0.03em]"
                          style={{ fontFamily: 'ui-serif, Georgia, Times, serif' }}
                        >
                          Kivo
                        </span>
                        <span className="rounded-full border border-[#d8dde5] bg-white/75 px-2 py-0.5 text-[12px] font-medium text-[#8b94a3] shadow-[0_2px_8px_rgba(40,48,64,0.04)]">
                          Lite
                        </span>
                      </div>
                    </div>

                    <div className="text-[17px] leading-[1.78] tracking-[-0.015em] text-[#49515f]">
                      <AgentResponseMessage
                        message={message}
                        latestUserContent={latestUserContent}
                      />
                    </div>

                    {message.attachments?.length ? (
                      <div className="mt-3">
                        <AttachmentPreview attachments={message.attachments} />
                      </div>
                    ) : null}

                    {isError ? (
                      <p className="mt-2 text-xs text-[#9b4d4d]">
                        {message.error}
                      </p>
                    ) : null}
                  </div>
                )}
              </article>
            </div>
          );
        })}

        {pending ? (
          <div className="flex justify-start">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-[#dbe1ea] bg-[rgba(255,255,255,0.72)] px-3.5 py-2 text-[12px] font-medium text-[#7e8796] shadow-[0_8px_24px_rgba(44,52,68,0.05)] backdrop-blur-[10px]">
              <CircleDashed className="h-3.5 w-3.5 animate-spin" />
              Kivo is responding…
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
