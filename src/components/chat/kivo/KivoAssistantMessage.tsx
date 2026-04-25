'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import type { Message } from '@/app/store/app-store';
import { ResponseRenderer } from '@/components/chat/ResponseRenderer';
import { KivoWebSourceCards } from './KivoWebSourceCards';
import { KivoExecutionTimeline } from './execution/KivoExecutionTimeline';

function KivoBrandHeader() {
  return (
    <div className="mb-2.5 flex items-center gap-2">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center overflow-hidden rounded-[8px] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.08)]">
          <Image src="/icon.svg" alt="Kivo" width={24} height={24} className="h-6 w-6 object-contain" priority />
        </span>
        <span className="text-[23px] font-semibold tracking-[-0.028em] text-[#171717]" style={{ fontFamily: 'ui-serif, Georgia, Times, serif' }}>Kivo</span>
        <span className="inline-flex items-center rounded-[10px] border border-black/[0.08] bg-white px-2 py-0.5 text-[12px] font-medium text-[#8e8e93] shadow-[0_1px_2px_rgba(0,0,0,0.03)]">Premium</span>
      </div>
    </div>
  );
}

function StreamingState() {
  return <div className="mb-3.5 flex items-center gap-2"><span className="relative flex h-2 w-2 shrink-0"><span className="absolute inset-0 rounded-full bg-[#4f7cff]/25 animate-ping" /><span className="relative h-2 w-2 rounded-full bg-[#4f7cff]" /></span><span className="text-[13px] tracking-[-0.01em] text-[#7b8494]">Thinking...</span></div>;
}

function safeRecord(value: unknown): Record<string, unknown> | null { if (!value || typeof value !== 'object' || Array.isArray(value)) return null; return value as Record<string, unknown>; }
function getWebSources(message: Message): Array<{ url?: string; title?: string }> { const structuredData = safeRecord(message.structuredData); const metadata = safeRecord(message.agentMetadata); const metadataStructuredData = safeRecord(metadata?.structuredData); const candidates = [structuredData?.webSources, metadataStructuredData?.webSources]; for (const value of candidates) { if (!Array.isArray(value)) continue; const normalized = value.filter((item) => item && typeof item === 'object').map((item) => { const source = item as Record<string, unknown>; return { url: typeof source.url === 'string' ? source.url : undefined, title: typeof source.title === 'string' ? source.title : undefined }; }).filter((item) => item.url || item.title); if (normalized.length) return normalized; } return []; }

export function KivoAssistantMessage({ message, latestUserContent }: { message: Message; latestUserContent: string; }) {
  const isStreaming = Boolean(message.isStreaming);
  const showStreamingOnly = isStreaming && !message.content.trim();
  const webSources = getWebSources(message);
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24, ease: 'easeOut' }} className="w-full max-w-[840px]">
      <KivoBrandHeader />
      <AnimatePresence initial={false}>{isStreaming ? <StreamingState /> : null}</AnimatePresence>
      <KivoExecutionTimeline toolResults={message.toolResults as Array<Record<string, unknown>>} isStreaming={isStreaming} />
      {!showStreamingOnly ? <motion.div layout className="max-w-[760px] rounded-[26px] border border-black/[0.05] bg-white/70 px-4 py-3.5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] backdrop-blur-xl"><div className="text-[15px] leading-[1.56] tracking-[-0.01em] text-[#1b1b1f]"><ResponseRenderer message={message} latestUserContent={latestUserContent} /></div><KivoWebSourceCards sources={webSources} /></motion.div> : null}
    </motion.div>
  );
}

export default KivoAssistantMessage;
