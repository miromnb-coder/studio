'use client';

import { AnimatePresence, motion } from 'framer-motion';
import type { Message } from '@/app/store/app-store';
import { ResponseRenderer } from '@/components/chat/ResponseRenderer';
import { KivoWebSourceCards } from './KivoWebSourceCards';

function StreamingState() {
  return (
    <div className="mb-3.5 overflow-hidden rounded-2xl border border-black/[0.05] bg-white/60 px-3 py-2 backdrop-blur-xl">
      <div className="relative text-[13px] tracking-[-0.01em] text-[#7b8494]">
        <span className="relative z-10">Thinking</span>
        <span className="pointer-events-none absolute inset-y-0 left-0 w-24 -translate-x-full animate-[kivoShimmer_1.8s_linear_infinite] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.9),transparent)]" />
      </div>
      <style jsx>{`@keyframes kivoShimmer{100%{transform:translateX(320px)}}`}</style>
    </div>
  );
}

function safeRecord(value: unknown): Record<string, unknown> | null { if (!value || typeof value !== 'object' || Array.isArray(value)) return null; return value as Record<string, unknown>; }
function getWebSources(message: Message): Array<{ url?: string; title?: string }> { const structuredData = safeRecord(message.structuredData); const metadata = safeRecord(message.agentMetadata); const metadataStructuredData = safeRecord(metadata?.structuredData); const candidates = [structuredData?.webSources, metadataStructuredData?.webSources]; for (const value of candidates) { if (!Array.isArray(value)) continue; const normalized = value.filter((item) => item && typeof item === 'object').map((item) => { const source = item as Record<string, unknown>; return { url: typeof source.url === 'string' ? source.url : undefined, title: typeof source.title === 'string' ? source.title : undefined }; }).filter((item) => item.url || item.title); if (normalized.length) return normalized; } return []; }

export function KivoAssistantMessage({ message, latestUserContent }: { message: Message; latestUserContent: string; }) {
  const isStreaming = Boolean(message.isStreaming);
  const showStreamingOnly = isStreaming && !message.content.trim();
  const webSources = getWebSources(message);
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24, ease: 'easeOut' }} className="w-full max-w-[840px]">
      <AnimatePresence initial={false}>{isStreaming ? <StreamingState /> : null}</AnimatePresence>
      {!showStreamingOnly ? <motion.div layout className="max-w-[760px] rounded-[26px] border border-black/[0.05] bg-white/70 px-4 py-3.5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] backdrop-blur-xl"><div className="text-[15px] leading-[1.56] tracking-[-0.01em] text-[#1b1b1f]"><ResponseRenderer message={message} latestUserContent={latestUserContent} /></div><KivoWebSourceCards sources={webSources} /></motion.div> : null}
    </motion.div>
  );
}

export default KivoAssistantMessage;
