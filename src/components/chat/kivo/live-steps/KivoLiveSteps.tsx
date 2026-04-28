'use client';

import { AnimatePresence, motion } from 'framer-motion';
import type { Message } from '@/app/store/app-store';
import { KivoLiveStepCard } from './KivoLiveStepCard';
import { mapStreamEventsToLiveSteps } from './live-steps-mapper';
import { getVisibleLiveSteps, shouldShowLiveSteps } from './live-steps-rules';
import { summarizeLiveSteps } from './live-steps-summary';
import type { LiveStepContext, LiveStepStreamEvent } from './live-steps-types';

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asEvents(value: unknown): LiveStepStreamEvent[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && typeof item === 'object')
    .map((item) => item as LiveStepStreamEvent)
    .filter((item) => typeof item.type === 'string');
}

function readContext(message: Message, latestUserContent: string): LiveStepContext {
  const metadata = asRecord(message.agentMetadata);
  const structured = asRecord(message.structuredData) || asRecord(metadata?.structuredData);
  const liveSteps = asRecord(structured?.liveSteps);
  const toolsUsed = Array.isArray(structured?.toolsUsed) ? structured?.toolsUsed as string[] : undefined;
  const startedAt = typeof liveSteps?.startedAt === 'number' ? liveSteps.startedAt : undefined;

  return {
    isStreaming: Boolean(message.isStreaming),
    elapsedMs: startedAt ? Date.now() - startedAt : undefined,
    reasoningDepth: typeof structured?.reasoningDepth === 'string' ? structured.reasoningDepth : undefined,
    toolsUsed,
    memoryUsed: metadata?.memoryUsed === true,
    taskDepth: typeof structured?.taskDepth === 'string' ? structured.taskDepth as LiveStepContext['taskDepth'] : undefined,
    mode: typeof metadata?.mode === 'string' ? metadata.mode : 'agent',
    contentLength: message.content.trim().length,
    latestUserContent,
  };
}

function extractEvents(message: Message): LiveStepStreamEvent[] {
  const metadata = asRecord(message.agentMetadata);
  const structured = asRecord(message.structuredData) || asRecord(metadata?.structuredData);
  const liveSteps = asRecord(structured?.liveSteps);
  return asEvents(liveSteps?.events);
}

export function KivoLiveSteps({ message, latestUserContent }: { message: Message; latestUserContent: string }) {
  const context = readContext(message, latestUserContent);
  const allSteps = mapStreamEventsToLiveSteps(extractEvents(message));
  const shouldShow = shouldShowLiveSteps(allSteps, context);
  if (!shouldShow) return null;

  const visibleSteps = getVisibleLiveSteps(allSteps, 4);
  const summary = !message.isStreaming ? summarizeLiveSteps(allSteps) : null;

  return (
    <motion.div layout className="mb-3.5 space-y-2">
      <AnimatePresence initial={false}>
        {visibleSteps.map((step) => (
          <KivoLiveStepCard key={step.id} step={step} />
        ))}
      </AnimatePresence>
      {summary ? <p className="px-1 pt-0.5 text-[12px] text-[#8b94a3]">{summary}</p> : null}
    </motion.div>
  );
}

export default KivoLiveSteps;
