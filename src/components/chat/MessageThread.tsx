'use client';

import type { Message } from '@/app/store/app-store';
import { AttachmentPreview } from './AttachmentPreview';

type MessageThreadProps = {
  messages: Message[];
  pending: boolean;
};

export function MessageThread({ messages, pending }: MessageThreadProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-8 pb-[166px] pt-8">
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
    <div className="flex-1 overflow-y-auto px-4 pb-[168px] pt-4 sm:px-6">
      <div className="space-y-3">
        {messages.map((message) => {
          const isUser = message.role === 'user';
          const isError = Boolean(message.error);

          return (
            <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
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
