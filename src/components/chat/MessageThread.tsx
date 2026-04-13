'use client';

import { useEffect, useRef } from 'react';
import type { Message } from '@/app/store/app-store';
import { AttachmentPreview } from './AttachmentPreview';

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

    const distanceFromBottom = node.scrollHeight - node.scrollTop - node.clientHeight;
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
    const distanceFromBottom = node.scrollHeight - node.scrollTop - node.clientHeight;
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
    <div ref={listRef} onScroll={handleScroll} className="min-h-0 flex-1 overflow-y-auto px-4 pb-[196px] pt-4 sm:px-6">
      <div className="space-y-3">
        {messages.map((message) => {
          const isUser = message.role === 'user';
          const isError = Boolean(message.error);

          return (
            <div key={message.id} className={`message-appear flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <article
                className={`max-w-[88%] rounded-[20px] border px-3.5 py-3 text-[14px] leading-6 ${
                  isUser
                    ? 'border-[#d5dae2] bg-[#f7f8fb] text-[#424a59]'
                    : 'border-[#d9dde4] bg-[#f2f3f7] text-[#586170]'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content || (message.isStreaming ? 'Thinking…' : '')}</p>
                {message.attachments?.length ? <AttachmentPreview attachments={message.attachments} /> : null}
                {isError ? <p className="mt-2 text-xs text-[#9b4d4d]">{message.error}</p> : null}
              </article>
            </div>
          );
        })}

        {pending ? <p className="px-1 text-xs text-[#8791a0]">Assistant is responding…</p> : null}
      </div>
    </div>
  );
}
