'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { Message } from '@/app/store/app-store';
import { ResponseRenderer } from '@/components/chat/ResponseRenderer';
import { KivoLiveSteps } from './live-steps/KivoLiveSteps';
import { KivoWebSourceCards } from './KivoWebSourceCards';

const STREAMING_LABELS = [
  'Analyzing',
  'Reasoning',
  'Processing',
  'Preparing answer',
  'Working',
];

function StreamingState() {
  const [labelIndex, setLabelIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setLabelIndex((current) => (current + 1) % STREAMING_LABELS.length);
    }, 1700);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="mb-3.5 overflow-hidden py-1">
      <div className="relative inline-block overflow-hidden text-[15px] font-normal tracking-[-0.018em] text-[#a1a1aa]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={STREAMING_LABELS[labelIndex]}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="relative z-10 inline-block"
          >
            {STREAMING_LABELS[labelIndex]}
          </motion.span>
        </AnimatePresence>
        <span className="pointer-events-none absolute inset-y-0 left-0 w-16 -translate-x-full animate-[kivoTextShimmer_1.8s_linear_infinite] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.95),transparent)]" />
      </div>
      <style jsx>{`@keyframes kivoTextShimmer{100%{transform:translateX(190px)}}`}</style>
    </div>
  );
}

function safeRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function getWebSources(message: Message): Array<{ url?: string; title?: string }> {
  const structuredData = safeRecord(message.structuredData);
  const metadata = safeRecord(message.agentMetadata);
  const metadataStructuredData = safeRecord(metadata?.structuredData);
  const candidates = [structuredData?.webSources, metadataStructuredData?.webSources];

  for (const value of candidates) {
    if (!Array.isArray(value)) continue;

    const normalized = value
      .filter((item) => item && typeof item === 'object')
      .map((item) => {
        const source = item as Record<string, unknown>;
        return {
          url: typeof source.url === 'string' ? source.url : undefined,
          title: typeof source.title === 'string' ? source.title : undefined,
        };
      })
      .filter((item) => item.url || item.title);

    if (normalized.length) return normalized;
  }

  return [];
}

export function KivoAssistantMessage({
  message,
  latestUserContent,
}: {
  message: Message;
  latestUserContent: string;
}) {
  const isStreaming = Boolean(message.isStreaming);
  const showStreamingOnly = isStreaming && !message.content.trim();
  const webSources = getWebSources(message);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
      className="w-full max-w-[760px]"
    >
      <AnimatePresence initial={false}>{isStreaming ? <StreamingState /> : null}</AnimatePresence>
      <KivoLiveSteps message={message} latestUserContent={latestUserContent} />

      {!showStreamingOnly ? (
        <motion.div layout className="max-w-[720px] px-0 py-0">
          <div className="text-[16px] leading-[1.62] tracking-[-0.018em] text-[#1f2933] [&>*+*]:mt-3.5 [&_li+li]:mt-1.5 [&_ol]:pl-5 [&_ul]:pl-5">
            <ResponseRenderer
              message={message}
              latestUserContent={latestUserContent}
            />
          </div>

          <KivoWebSourceCards sources={webSources} />
        </motion.div>
      ) : null}
    </motion.div>
  );
}

export default KivoAssistantMessage;
