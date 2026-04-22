'use client';

import type { Message } from '@/app/store/app-store';
import { ResponseRenderer } from '@/components/chat/ResponseRenderer';

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

function StreamingPulse() {
  return (
    <div className="mb-2 flex items-center gap-2.5 pl-[2px]">
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span className="absolute inline-flex h-full w-full rounded-full bg-[#4f7cff]/25 animate-ping" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#4f7cff]" />
      </span>

      <span className="text-[15px] tracking-[-0.01em] text-[#8e8e93]">...</span>
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
  const showStreamingPulse = Boolean(message.isStreaming && !message.content.trim());

  return (
    <div className="w-full max-w-[840px]">
      <KivoBrandHeader />

      {showStreamingPulse ? <StreamingPulse /> : null}

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
