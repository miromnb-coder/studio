'use client';

import { motion, AnimatePresence } from 'framer-motion';
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
          Premium
        </span>
      </div>
    </div>
  );
}

function StreamingState() {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span className="absolute inset-0 rounded-full bg-[#4f7cff]/25 animate-ping" />
        <span className="relative h-2.5 w-2.5 rounded-full bg-[#4f7cff]" />
      </span>

      <span className="text-[14px] tracking-[-0.01em] text-[#7b8494]">
        Thinking...
      </span>
    </div>
  );
}

function ToolCard({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-black/[0.06] bg-white/72 px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.04)] backdrop-blur-xl"
    >
      <div className="text-[11px] uppercase tracking-[0.18em] text-[#8a94a6]">
        Tool Activity
      </div>

      <div className="mt-1 text-[14px] font-medium text-[#2d3440]">
        {title}
      </div>

      <div className="mt-1 text-[12px] text-[#7a8493]">
        {subtitle}
      </div>
    </motion.div>
  );
}

function getToolCards(message: Message) {
  const metadata = message.agentMetadata as any;
  const execution = metadata?.execution;

  if (!execution) return [];

  const cards = [];

  if (execution.usedMemory) {
    cards.push({
      title: 'Memory Retrieved',
      subtitle: 'Used previous context to improve answer',
    });
  }

  if (execution.usedTools) {
    cards.push({
      title: 'Tools Used',
      subtitle: 'External capabilities were used during generation',
    });
  }

  if (execution.verified) {
    cards.push({
      title: 'Verified Output',
      subtitle: 'Response was checked before delivery',
    });
  }

  return cards;
}

export function KivoAssistantMessage({
  message,
  latestUserContent,
}: {
  message: Message;
  latestUserContent: string;
}) {
  const isStreaming = Boolean(message.isStreaming);
  const showStreamingOnly =
    isStreaming && !message.content.trim();

  const toolCards = getToolCards(message);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
      className="w-full max-w-[840px]"
    >
      <KivoBrandHeader />

      <AnimatePresence initial={false}>
        {isStreaming ? <StreamingState /> : null}
      </AnimatePresence>

      {toolCards.length > 0 ? (
        <div className="mb-4 space-y-3">
          {toolCards.map((card, index) => (
            <ToolCard
              key={`${card.title}-${index}`}
              title={card.title}
              subtitle={card.subtitle}
            />
          ))}
        </div>
      ) : null}

      {!showStreamingOnly ? (
        <motion.div
          layout
          className="max-w-[760px] rounded-[28px] border border-black/[0.05] bg-white/70 px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)] backdrop-blur-xl"
        >
          <div className="text-[#1b1b1f]">
            <ResponseRenderer
              message={message}
              latestUserContent={latestUserContent}
            />
          </div>
        </motion.div>
      ) : null}
    </motion.div>
  );
}

export default KivoAssistantMessage;
