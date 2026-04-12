'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { Check, CircleAlert, Loader2 } from 'lucide-react';
import FinanceResultCard from '@/components/chat/FinanceResultCard';
import FinanceActionResultCard from '@/components/chat/FinanceActionResultCard';
import type { Message } from '@/app/store/app-store';
import type { FinanceActionType } from '@/lib/finance/types';
import type { AgentResponseStep } from '@/types/agent-response';

type AssistantResponseSurfaceProps = {
  message: Message;
  isPremium: boolean;
  actionLoading: FinanceActionType | null;
  onAction: (actionType: FinanceActionType) => void;
  onPremiumRequired: () => void;
};

type ResponseSection = {
  key: string;
  title: string;
  body: string;
};

const DEFAULT_SECTION_ORDER = [
  'What matters most now',
  'Best recommendation',
  'Why this matters',
  'Next move',
  'Deeper detail',
] as const;

function cleanLine(value: string) {
  return value
    .replace(/^[-*]\s+/, '')
    .replace(/^[0-9]+\.\s+/, '')
    .trim();
}

function normalizeText(value: string) {
  return value.replace(/\r\n/g, '\n').trim();
}

function splitIntoParagraphs(value: string) {
  return normalizeText(value)
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function getReadingMinutes(text: string) {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 180));
}

function titleFromChunk(chunk: string, index: number) {
  const explicitMatch = chunk.match(
    /^(what matters most now|best recommendation|why this matters|next move|deeper detail|tärkein nyt|paras suositus|miksi tämä on tärkeää|seuraava askel|lisätiedot)\s*:?\s*/i,
  );

  if (explicitMatch) {
    return {
      title: explicitMatch[1],
      body: chunk.replace(explicitMatch[0], '').trim(),
    };
  }

  return {
    title: DEFAULT_SECTION_ORDER[Math.min(index, DEFAULT_SECTION_ORDER.length - 1)],
    body: cleanLine(chunk),
  };
}

function buildResponseSections(text: string) {
  const paragraphs = splitIntoParagraphs(text);

  if (!paragraphs.length) {
    return {
      mainInsight: '',
      sections: [] as ResponseSection[],
      fallbackLines: [] as string[],
    };
  }

  const mainInsight = cleanLine(paragraphs[0]);
  const sections = paragraphs
    .slice(1)
    .map((chunk, index) => {
      const { title, body } = titleFromChunk(chunk, index + 1);
      return {
        key: `${title}-${index}`,
        title,
        body,
      };
    })
    .filter((section) => section.body.length > 0);

  return {
    mainInsight,
    sections,
    fallbackLines: normalizeText(text).split('\n').map((line) => line.trim()).filter(Boolean),
  };
}

function stepStateIcon(status: AgentResponseStep['status']) {
  if (status === 'completed') return <Check className="h-2.5 w-2.5 text-emerald-200" />;
  if (status === 'failed') return <CircleAlert className="h-2.5 w-2.5 text-rose-200" />;
  return <Loader2 className="h-2.5 w-2.5 animate-spin text-sky-200" />;
}

function statusCopy(status: AgentResponseStep['status']) {
  if (status === 'completed') return 'Done';
  if (status === 'failed') return 'Issue';
  if (status === 'running') return 'Working';
  return 'Queued';
}

function statusBadgeClasses(status: AgentResponseStep['status']) {
  if (status === 'completed') {
    return 'border-emerald-300/18 bg-emerald-300/10 text-emerald-200';
  }
  if (status === 'failed') {
    return 'border-rose-300/22 bg-rose-300/10 text-rose-200';
  }
  if (status === 'running') {
    return 'border-sky-300/22 bg-sky-300/10 text-sky-200';
  }
  return 'border-white/[0.08] bg-white/[0.02] text-zinc-500';
}

function iconWrapClasses(status: AgentResponseStep['status']) {
  if (status === 'completed') return 'border-emerald-300/16 bg-emerald-300/8';
  if (status === 'failed') return 'border-rose-300/16 bg-rose-300/8';
  if (status === 'running') return 'border-sky-300/16 bg-sky-300/8';
  return 'border-white/[0.08] bg-white/[0.03]';
}

export function AssistantResponseSurface({
  message,
  isPremium,
  actionLoading,
  onAction,
  onPremiumRequired,
}: AssistantResponseSurfaceProps) {
  const [savingOutcomeFor, setSavingOutcomeFor] = useState<string | null>(null);

  const metadata = message.agentMetadata;
  const isFinanceIntent = metadata?.intent === 'finance';
  const isGmailIntent = metadata?.intent === 'gmail';
  const hasFinanceVisuals = Boolean(metadata?.structuredData?.finance || metadata?.structuredData?.actionResult);
  const hasToolDetails = Boolean(metadata?.steps?.length || metadata?.plan);
  const showOperatorDetails = isFinanceIntent || isGmailIntent || hasFinanceVisuals;
  const operatorModules = metadata?.operatorModules || [];

  const isFinanceAction = (value: unknown): value is FinanceActionType =>
    value === 'create_savings_plan' ||
    value === 'find_alternatives' ||
    value === 'draft_cancellation';

  const saveOutcome = async (
    module: NonNullable<typeof metadata>['operatorModules'][number],
    status: 'accepted' | 'ignored' | 'postponed' | 'completed',
  ) => {
    if (!module?.recommendationId) return;

    setSavingOutcomeFor(module.id);

    await fetch('/api/operator/outcomes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recommendationId: module.recommendationId,
        recommendedAction: module.summary,
        status,
      }),
    }).catch(() => null);

    setSavingOutcomeFor(null);
  };

  const normalizedText = normalizeText(message.content || '');
  const readingMinutes = useMemo(() => getReadingMinutes(normalizedText), [normalizedText]);

  const responseSections = useMemo(() => buildResponseSections(normalizedText), [normalizedText]);

  const timelineSteps = useMemo(() => {
    if (!metadata?.steps?.length) return [];
    return metadata.steps.map((step, index) => ({
      id: `${message.id}-step-${index}`,
      label: step.action,
      status: step.status,
      summary: step.summary || step.error,
    }));
  }, [message.id, metadata?.steps]);

  const stagedLines = useMemo(() => {
    const prefixes = ['Observation:', 'Interpretation:', 'Next focus:', 'Recommendation:'];
    return responseSections.fallbackLines.filter((line) =>
      prefixes.some((prefix) => line.startsWith(prefix)),
    );
  }, [responseSections.fallbackLines]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
      className="max-w-[96%] space-y-3"
    >
      {timelineSteps.length ? (
        <div className="rounded-[22px] border border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))] p-3 shadow-[0_12px_28px_rgba(0,0,0,0.2)] backdrop-blur-[14px]">
          <div className="mb-2 flex items-center justify-between gap-3 px-0.5">
            <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-zinc-500">
              Work completed
            </p>
            <p className="text-[10px] text-zinc-500">
              {timelineSteps.filter((step) => step.status === 'completed').length}/{timelineSteps.length}
            </p>
          </div>

          <ul className="space-y-2">
            {timelineSteps.map((step) => (
              <li
                key={step.id}
                className="rounded-[18px] border border-white/[0.06] bg-white/[0.02] px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${iconWrapClasses(step.status)}`}
                  >
                    {stepStateIcon(step.status)}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[13px] leading-5 tracking-[-0.012em] text-zinc-100/95">
                        {step.label}
                      </p>
                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusBadgeClasses(step.status)}`}
                      >
                        {statusCopy(step.status)}
                      </span>
                    </div>

                    {step.summary ? (
                      <p className="mt-1 text-[11px] leading-[1.15rem] text-zinc-500">
                        {step.summary}
                      </p>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="rounded-[22px] border border-white/[0.07] bg-[linear-gradient(170deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] px-4 py-3.5 shadow-[0_16px_34px_rgba(0,0,0,0.22)] backdrop-blur-xl">
        <div className="mb-3 flex items-center justify-between border-b border-white/[0.05] pb-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
            Kivo assistant
          </p>
          <p className="text-[10px] text-zinc-500">
            ~{readingMinutes} min read
          </p>
        </div>

        {responseSections.mainInsight ? (
          <div className="space-y-3">
            <div className="rounded-[18px] border border-white/[0.06] bg-white/[0.024] px-3.5 py-3">
              <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-zinc-500">
                What matters most now
              </p>
              <p className="mt-1.5 text-[15px] leading-6 tracking-[-0.012em] text-zinc-100/95">
                {responseSections.mainInsight}
              </p>
            </div>

            {responseSections.sections.length ? (
              <div className="space-y-2">
                {responseSections.sections.map((section, index) => (
                  <motion.div
                    key={`${message.id}-${section.key}`}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.12) }}
                    className="rounded-[16px] border border-white/[0.05] bg-white/[0.016] px-3.5 py-3"
                  >
                    <p className="text-[10px] font-medium uppercase tracking-[0.07em] text-zinc-500">
                      {section.title}
                    </p>
                    <p className="mt-1.5 whitespace-pre-wrap text-[13.5px] leading-6 text-zinc-200/92">
                      {section.body}
                    </p>
                  </motion.div>
                ))}
              </div>
            ) : null}

            {!responseSections.sections.length && stagedLines.length ? (
              <div className="space-y-2">
                {stagedLines.map((line, idx) => (
                  <div
                    key={`${message.id}-staged-${idx}`}
                    className="rounded-[16px] border border-white/[0.05] bg-white/[0.016] px-3.5 py-2.5"
                  >
                    <p className="text-[13px] leading-6 text-zinc-200/92">{line}</p>
                  </div>
                ))}
              </div>
            ) : null}

            {message.isStreaming ? (
              <span className="inline-block h-5 w-1.5 animate-pulse rounded bg-zinc-400/65" />
            ) : null}
          </div>
        ) : (
          <div className="space-y-2 text-[15px] leading-7 tracking-[-0.01em] text-zinc-100/94">
            {message.isStreaming ? (
              <span className="inline-block h-5 w-1.5 animate-pulse rounded bg-zinc-400/65" />
            ) : null}
          </div>
        )}
      </div>

      <AnimatePresence>
        {metadata && showOperatorDetails ? (
          <motion.div
            key={`${message.id}-meta`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-2"
          >
            {metadata.suggestedActions?.length ? (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {metadata.suggestedActions.slice(0, 3).map((item) => {
                  const actionType = item.payload?.actionType;
                  if (!isFinanceAction(actionType)) return null;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onAction(actionType)}
                      className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-zinc-200 transition-all duration-200 hover:border-white/[0.14] hover:bg-white/[0.05]"
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {operatorModules.length ? (
              <div className="space-y-2">
                {operatorModules.slice(0, 4).map((module, index) => (
                  <motion.div
                    key={module.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, delay: index * 0.03 }}
                    className="rounded-[18px] border border-white/[0.05] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012))] px-3.5 py-3 shadow-[0_8px_22px_rgba(0,0,0,0.14)] backdrop-blur-[14px]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10.5px] font-medium tracking-[0.02em] text-zinc-500">
                          {module.title}
                        </p>
                        <p className="mt-1 text-[13.5px] leading-6 text-zinc-100/90">
                          {module.summary}
                        </p>
                      </div>

                      {module.impactLabel ? (
                        <span className="shrink-0 rounded-full border border-emerald-300/8 bg-emerald-300/8 px-2 py-1 text-[10px] font-medium text-emerald-300/90">
                          {module.impactLabel}
                        </span>
                      ) : null}
                    </div>

                    {module.recommendationId ? (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          disabled={savingOutcomeFor === module.id}
                          onClick={() => void saveOutcome(module, 'completed')}
                          className="rounded-full border border-white/[0.07] bg-white/[0.02] px-2.5 py-1 text-[10px] font-medium text-zinc-300 transition hover:border-white/[0.1] hover:bg-white/[0.036]"
                        >
                          Done
                        </button>
                        <button
                          type="button"
                          disabled={savingOutcomeFor === module.id}
                          onClick={() => void saveOutcome(module, 'postponed')}
                          className="rounded-full border border-white/[0.07] bg-white/[0.015] px-2.5 py-1 text-[10px] font-medium text-zinc-300 transition hover:border-white/[0.1] hover:bg-white/[0.03]"
                        >
                          Later
                        </button>
                        <button
                          type="button"
                          disabled={savingOutcomeFor === module.id}
                          onClick={() => void saveOutcome(module, 'ignored')}
                          className="rounded-full border border-white/[0.06] bg-transparent px-2.5 py-1 text-[10px] font-medium text-zinc-500 transition hover:border-white/[0.09] hover:text-zinc-400"
                        >
                          Ignore
                        </button>
                      </div>
                    ) : null}
                  </motion.div>
                ))}
              </div>
            ) : null}

            <div className="space-y-1.5">
              {metadata.structuredData?.finance ? (
                <details className="group rounded-[16px] border border-white/[0.045] bg-white/[0.016] px-3.5 py-2 shadow-[0_7px_20px_rgba(0,0,0,0.12)] backdrop-blur-[12px]">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[10.5px] font-medium tracking-[0.01em] text-zinc-400 transition-colors marker:content-none hover:text-zinc-200">
                    <span>Data analysis</span>
                    <span className="text-[10px] text-zinc-600 transition group-open:text-zinc-400">
                      Expand
                    </span>
                  </summary>
                  <div className="mt-2.5 border-t border-white/[0.03] pt-2.5">
                    <FinanceResultCard
                      data={metadata.structuredData.finance}
                      onAction={onAction}
                      actionLoading={actionLoading}
                      isPremium={isPremium}
                      onPremiumRequired={onPremiumRequired}
                    />
                  </div>
                </details>
              ) : null}

              {metadata.structuredData?.actionResult ? (
                <details className="group rounded-[16px] border border-white/[0.045] bg-white/[0.016] px-3.5 py-2 shadow-[0_7px_20px_rgba(0,0,0,0.12)] backdrop-blur-[12px]">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[10.5px] font-medium tracking-[0.01em] text-zinc-400 transition-colors marker:content-none hover:text-zinc-200">
                    <span>Detailed result</span>
                    <span className="text-[10px] text-zinc-600 transition group-open:text-zinc-400">
                      Expand
                    </span>
                  </summary>
                  <div className="mt-2.5 border-t border-white/[0.03] pt-2.5">
                    <FinanceActionResultCard result={metadata.structuredData.actionResult} />
                  </div>
                </details>
              ) : null}

              {hasToolDetails ? (
                <details className="group rounded-[16px] border border-white/[0.045] bg-white/[0.016] px-3.5 py-2 shadow-[0_7px_20px_rgba(0,0,0,0.12)] backdrop-blur-[12px]">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[10.5px] font-medium tracking-[0.01em] text-zinc-400 transition-colors marker:content-none hover:text-zinc-200">
                    <span>Actions taken</span>
                    <span className="text-[10px] text-zinc-600 transition group-open:text-zinc-400">
                      Expand
                    </span>
                  </summary>

                  <div className="mt-2.5 border-t border-white/[0.03] pt-2.5 text-xs text-zinc-300">
                    {metadata.plan ? (
                      <p className="mb-2 leading-6 text-zinc-400">
                        {metadata.plan}
                      </p>
                    ) : null}

                    {metadata.steps?.length ? (
                      <ul className="space-y-1.5">
                        {metadata.steps.map((step, index) => (
                          <li key={`${step.action}-${index}`} className="leading-5 text-zinc-400">
                            <span className="text-zinc-200">• {step.action}</span>
                            {step.summary || step.status ? ` — ${step.summary || step.status}` : ''}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </details>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.section>
  );
}
