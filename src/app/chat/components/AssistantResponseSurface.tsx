'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import FinanceResultCard from '@/components/chat/FinanceResultCard';
import FinanceActionResultCard from '@/components/chat/FinanceActionResultCard';
import type { Message } from '@/app/store/app-store';
import type { FinanceActionType } from '@/lib/finance/types';

type AssistantResponseSurfaceProps = {
  message: Message;
  isPremium: boolean;
  actionLoading: FinanceActionType | null;
  onAction: (actionType: FinanceActionType) => void;
  onPremiumRequired: () => void;
};

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

  const surfaceBlocks = [
    metadata?.structuredData?.finance ? 'finance' : null,
    metadata?.structuredData?.actionResult ? 'actionResult' : null,
    operatorModules.length ? 'modules' : null,
    hasToolDetails ? 'details' : null,
  ].filter(Boolean);

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
      className="max-w-[96%] space-y-3.5"
    >
      <div className="px-0.5">
        <div className="space-y-2 text-[15px] leading-8 tracking-[-0.01em] text-zinc-100/95">
          {message.content || (message.isStreaming ? ' ' : '')}
        </div>
      </div>

      <AnimatePresence>
        {metadata && showOperatorDetails ? (
          <motion.div
            key={`${message.id}-meta`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-2.5"
          >
            {metadata.suggestedActions?.length ? (
              <div className="flex flex-wrap gap-2 pt-0.5">
                {metadata.suggestedActions.slice(0, 3).map((item) => {
                  const actionType = item.payload?.actionType;
                  if (!isFinanceAction(actionType)) return null;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onAction(actionType)}
                      className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium tracking-[0.01em] text-zinc-200 transition-all duration-200 hover:-translate-y-[1px] hover:border-white/[0.12] hover:bg-white/[0.055]"
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
                    className="rounded-[20px] border border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.018))] px-4 py-3.5 shadow-[0_10px_28px_rgba(0,0,0,0.2)] backdrop-blur-[18px]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
                          {module.title}
                        </p>
                        <p className="mt-1.5 text-[14px] leading-6 text-zinc-100/92">
                          {module.summary}
                        </p>
                      </div>

                      {module.impactLabel ? (
                        <span className="shrink-0 rounded-full border border-emerald-300/10 bg-emerald-300/10 px-2 py-1 text-[10px] font-medium text-emerald-300">
                          {module.impactLabel}
                        </span>
                      ) : null}
                    </div>

                    {module.recommendationId ? (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          disabled={savingOutcomeFor === module.id}
                          onClick={() => void saveOutcome(module, 'completed')}
                          className="rounded-full border border-white/[0.1] bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium text-zinc-300 transition hover:border-white/[0.14] hover:bg-white/[0.05]"
                        >
                          Done
                        </button>
                        <button
                          type="button"
                          disabled={savingOutcomeFor === module.id}
                          onClick={() => void saveOutcome(module, 'postponed')}
                          className="rounded-full border border-white/[0.1] bg-white/[0.02] px-2.5 py-1 text-[10px] font-medium text-zinc-300 transition hover:border-white/[0.14] hover:bg-white/[0.045]"
                        >
                          Later
                        </button>
                        <button
                          type="button"
                          disabled={savingOutcomeFor === module.id}
                          onClick={() => void saveOutcome(module, 'ignored')}
                          className="rounded-full border border-white/[0.08] bg-transparent px-2.5 py-1 text-[10px] font-medium text-zinc-500 transition hover:border-white/[0.12] hover:text-zinc-400"
                        >
                          Ignore
                        </button>
                      </div>
                    ) : null}
                  </motion.div>
                ))}
              </div>
            ) : null}

            {surfaceBlocks.length > 0 ? (
              <div className="space-y-2">
                {metadata.structuredData?.finance ? (
                  <details className="group rounded-[18px] border border-white/[0.05] bg-white/[0.018] px-3.5 py-2.5 shadow-[0_8px_22px_rgba(0,0,0,0.16)] backdrop-blur-[16px]">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[11px] font-medium tracking-[0.11em] text-zinc-500 transition-colors marker:content-none hover:text-zinc-300">
                      <span>DATA / ANALYSIS</span>
                      <span className="text-[10px] text-zinc-600 transition group-open:text-zinc-400">
                        Expand
                      </span>
                    </summary>
                    <div className="mt-3 border-t border-white/[0.05] pt-3">
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
                  <details className="group rounded-[18px] border border-white/[0.05] bg-white/[0.018] px-3.5 py-2.5 shadow-[0_8px_22px_rgba(0,0,0,0.16)] backdrop-blur-[16px]">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[11px] font-medium tracking-[0.11em] text-zinc-500 transition-colors marker:content-none hover:text-zinc-300">
                      <span>DETAILED RESULT</span>
                      <span className="text-[10px] text-zinc-600 transition group-open:text-zinc-400">
                        Expand
                      </span>
                    </summary>
                    <div className="mt-3 border-t border-white/[0.05] pt-3">
                      <FinanceActionResultCard result={metadata.structuredData.actionResult} />
                    </div>
                  </details>
                ) : null}

                {hasToolDetails ? (
                  <details className="group rounded-[18px] border border-white/[0.05] bg-white/[0.018] px-3.5 py-2.5 shadow-[0_8px_22px_rgba(0,0,0,0.16)] backdrop-blur-[16px]">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[11px] font-medium tracking-[0.11em] text-zinc-500 transition-colors marker:content-none hover:text-zinc-300">
                      <span>ACTIONS TAKEN</span>
                      <span className="text-[10px] text-zinc-600 transition group-open:text-zinc-400">
                        Expand
                      </span>
                    </summary>

                    <div className="mt-3 border-t border-white/[0.05] pt-3 text-xs text-zinc-300">
                      {metadata.plan ? (
                        <p className="mb-2 leading-6 text-zinc-400">
                          {metadata.plan}
                        </p>
                      ) : null}

                      {metadata.steps?.length ? (
                        <ul className="space-y-1.5">
                          {metadata.steps.map((step, index) => (
                            <li key={`${step.action}-${index}`} className="leading-5 text-zinc-400">
                              <span className="text-zinc-300">• {step.action}</span>
                              {step.summary || step.status ? ` — ${step.summary || step.status}` : ''}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  </details>
                ) : null}
              </div>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.section>
  );
}
