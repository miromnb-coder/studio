'use client';

import { useEffect, useMemo, useRef } from 'react';
import {
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  CircleDashed,
  Database,
  Hammer,
  Sparkles,
} from 'lucide-react';
import type { Message } from '@/app/store/app-store';
import { AttachmentPreview } from './AttachmentPreview';

type MessageThreadProps = {
  messages: Message[];
  pending: boolean;
};

type AgentStepView = {
  action?: string;
  title?: string;
  summary?: string;
  status?: 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | string;
  tool?: string;
};

type ExtendedMessage = Message & {
  metadata?: {
    intent?: string;
    steps?: AgentStepView[];
    suggestedActions?: string[];
    memoryUsed?: boolean;
    structuredData?: {
      route?: { confidence?: number };
      evaluation?: { score?: number };
      toolResults?: Array<{ tool?: string; ok?: boolean }>;
      memory?: { items?: unknown[] };
    };
  };
};

const BOTTOM_THRESHOLD_PX = 120;

function confidenceLabel(value?: number) {
  if (typeof value !== 'number') return null;
  if (value >= 0.8) return 'High confidence';
  if (value >= 0.6) return 'Medium confidence';
  return 'Low confidence';
}

function stepIcon(status?: string) {
  if (status === 'completed') return <CheckCircle2 className="h-3.5 w-3.5" />;
  if (status === 'failed') return <CircleAlert className="h-3.5 w-3.5" />;
  if (status === 'running') return <CircleDashed className="h-3.5 w-3.5 animate-spin" />;
  return <CircleDashed className="h-3.5 w-3.5" />;
}

function stepTone(status?: string) {
  if (status === 'completed') return 'text-[#5d7d67] bg-[#eef7f1] border-[#d7e7dc]';
  if (status === 'failed') return 'text-[#9a5a5a] bg-[#fbefef] border-[#efd8d8]';
  if (status === 'running') return 'text-[#66708a] bg-[#f1f4fb] border-[#dce3ef]';
  return 'text-[#798291] bg-[#f7f8fb] border-[#e5e8ee]';
}

function AgentDetailsCard({ message }: { message: ExtendedMessage }) {
  const metadata = message.metadata;
  const steps = metadata?.steps ?? [];
  const suggestedActions = metadata?.suggestedActions ?? [];
  const confidence =
    metadata?.structuredData?.route?.confidence ??
    (typeof metadata?.structuredData?.evaluation?.score === 'number'
      ? metadata.structuredData.evaluation.score / 100
      : undefined);

  const tools = useMemo(() => {
    const fromResults =
      metadata?.structuredData?.toolResults
        ?.map((item) => item.tool)
        .filter((tool): tool is string => Boolean(tool)) ?? [];

    const fromSteps =
      steps
        .map((step) => step.tool)
        .filter((tool): tool is string => Boolean(tool)) ?? [];

    return [...new Set([...fromResults, ...fromSteps])];
  }, [metadata?.structuredData?.toolResults, steps]);

  const memoryCount = Array.isArray(metadata?.structuredData?.memory?.items)
    ? metadata?.structuredData?.memory?.items?.length
    : undefined;

  if (
    !steps.length &&
    !tools.length &&
    !suggestedActions.length &&
    !metadata?.memoryUsed &&
    typeof confidence !== 'number'
  ) {
    return null;
  }

  return (
    <details className="mt-2.5 overflow-hidden rounded-[18px] border border-[#dde2ea] bg-[#f8f9fc]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3.5 py-2.5 text-[12px] font-medium text-[#556070] [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5" />
          Agent details
        </span>
        <span className="flex items-center gap-1 text-[#8a94a3]">
          <ChevronDown className="details-open:hidden h-3.5 w-3.5" />
          <ChevronUp className="hidden h-3.5 w-3.5 details-open:block" />
        </span>
      </summary>

      <div className="space-y-3 border-t border-[#e6e9ef] px-3.5 py-3">
        {(typeof confidence === 'number' || metadata?.memoryUsed || tools.length > 0) && (
          <div className="flex flex-wrap gap-2">
            {typeof confidence === 'number' ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#dbe2eb] bg-white px-2.5 py-1 text-[11px] text-[#5d6675]">
                <Brain className="h-3.5 w-3.5" />
                {confidenceLabel(confidence)}
              </span>
            ) : null}

            {metadata?.memoryUsed ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#dbe2eb] bg-white px-2.5 py-1 text-[11px] text-[#5d6675]">
                <Database className="h-3.5 w-3.5" />
                Memory used{typeof memoryCount === 'number' ? ` (${memoryCount})` : ''}
              </span>
            ) : null}

            {tools.length > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#dbe2eb] bg-white px-2.5 py-1 text-[11px] text-[#5d6675]">
                <Hammer className="h-3.5 w-3.5" />
                {tools.join(', ')}
              </span>
            ) : null}
          </div>
        )}

        {steps.length > 0 ? (
          <section>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8a94a3]">
              Steps
            </p>
            <div className="space-y-2">
              {steps.slice(0, 6).map((step, index) => (
                <div
                  key={`${step.title || step.action || 'step'}-${index}`}
                  className={`rounded-[14px] border px-2.5 py-2 text-[12px] ${stepTone(step.status)}`}
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0">{stepIcon(step.status)}</span>
                    <div className="min-w-0">
                      <p className="font-medium text-[#404958]">
                        {step.title || step.action || `Step ${index + 1}`}
                      </p>
                      {step.summary ? (
                        <p className="mt-0.5 text-[#6f7887]">{step.summary}</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {suggestedActions.length > 0 ? (
          <section>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8a94a3]">
              Suggested actions
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedActions.slice(0, 4).map((action, index) => (
                <span
                  key={`${action}-${index}`}
                  className="rounded-full border border-[#dde2ea] bg-white px-2.5 py-1 text-[11px] text-[#5d6675]"
                >
                  {action}
                </span>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </details>
  );
}

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
        {messages.map((rawMessage) => {
          const message = rawMessage as ExtendedMessage;
          const isUser = message.role === 'user';
          const isError = Boolean(message.error);

          return (
            <div
              key={message.id}
              className={`message-appear flex ${
                isUser ? 'justify-end' : 'justify-start'
              }`}
            >
              <article className="max-w-[88%]">
                <div
                  className={`rounded-[20px] border px-3.5 py-3 text-[14px] leading-6 ${
                    isUser
                      ? 'border-[#d5dae2] bg-[#f7f8fb] text-[#424a59]'
                      : 'border-[#d9dde4] bg-[#f2f3f7] text-[#586170]'
                  }`}
                >
                  <p className="whitespace-pre-wrap">
                    {message.content || (message.isStreaming ? 'Thinking…' : '')}
                  </p>

                  {message.attachments?.length ? (
                    <AttachmentPreview attachments={message.attachments} />
                  ) : null}

                  {isError ? (
                    <p className="mt-2 text-xs text-[#9b4d4d]">{message.error}</p>
                  ) : null}
                </div>

                {!isUser ? <AgentDetailsCard message={message} /> : null}
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
