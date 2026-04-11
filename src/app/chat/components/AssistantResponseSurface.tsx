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
  const isFinanceAction = (value: unknown): value is FinanceActionType =>
    value === 'create_savings_plan' || value === 'find_alternatives' || value === 'draft_cancellation';
  const operatorModules = metadata?.operatorModules || [];

  const saveOutcome = async (module: NonNullable<typeof metadata>['operatorModules'][number], status: 'accepted' | 'ignored' | 'postponed' | 'completed') => {
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

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
      className="max-w-[96%] space-y-3"
    >
      <div className="px-0.5 text-[15px] leading-8 tracking-[-0.01em] text-zinc-100/95">
        {message.content || (message.isStreaming ? ' ' : '')}
      </div>

      <AnimatePresence>
        {metadata && showOperatorDetails ? (
          <motion.div
            key={`${message.id}-meta`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="space-y-2"
          >
            {metadata.suggestedActions?.length ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {metadata.suggestedActions.slice(0, 3).map((item) => {
                  const actionType = item.payload?.actionType;
                  if (!isFinanceAction(actionType)) return null;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onAction(actionType)}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium tracking-[0.01em] text-zinc-200 transition-all duration-200 hover:-translate-y-[1px] hover:bg-white/[0.08]"
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            ) : null}
            {operatorModules.length ? (
              <div className="space-y-2">
                {operatorModules.slice(0, 4).map((module) => (
                  <div key={module.id} className="rounded-2xl border border-white/10 bg-[linear-gradient(160deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))] px-3.5 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-400">{module.title}</p>
                      {module.impactLabel ? <span className="text-[10px] text-emerald-300">{module.impactLabel}</span> : null}
                    </div>
                    <p className="mt-1 text-sm leading-6 text-zinc-100/90">{module.summary}</p>
                    {module.recommendationId ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <button type="button" disabled={savingOutcomeFor === module.id} onClick={() => void saveOutcome(module, 'completed')} className="rounded-full border border-white/15 px-2.5 py-1 text-[10px] text-zinc-300">Done</button>
                        <button type="button" disabled={savingOutcomeFor === module.id} onClick={() => void saveOutcome(module, 'postponed')} className="rounded-full border border-white/15 px-2.5 py-1 text-[10px] text-zinc-300">Later</button>
                        <button type="button" disabled={savingOutcomeFor === module.id} onClick={() => void saveOutcome(module, 'ignored')} className="rounded-full border border-white/15 px-2.5 py-1 text-[10px] text-zinc-500">Ignore</button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}

            {hasToolDetails ? (
              <details className="rounded-2xl border border-white/8 bg-white/[0.025] px-3.5 py-2.5">
                <summary className="cursor-pointer list-none text-[11px] font-medium tracking-[0.11em] text-zinc-400 transition-colors hover:text-zinc-200">TOIMENPITEET</summary>
                <div className="mt-2 space-y-2 text-xs text-zinc-300">
                  {metadata.plan ? <p>{metadata.plan}</p> : null}
                  {metadata.steps?.length ? (
                    <ul className="space-y-1">
                      {metadata.steps.map((step, index) => (
                        <li key={`${step.action}-${index}`}>• {step.action}: {step.summary || step.status}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </details>
            ) : null}

            {metadata.structuredData?.finance ? (
              <details className="rounded-2xl border border-white/8 bg-white/[0.025] px-3.5 py-2.5">
                <summary className="cursor-pointer list-none text-[11px] font-medium tracking-[0.11em] text-zinc-400 transition-colors hover:text-zinc-200">DATA / ANALYYSI</summary>
                <div className="mt-2">
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
              <details className="rounded-2xl border border-white/8 bg-white/[0.025] px-3.5 py-2.5">
                <summary className="cursor-pointer list-none text-[11px] font-medium tracking-[0.11em] text-zinc-400 transition-colors hover:text-zinc-200">TARKEMMAT TIEDOT</summary>
                <div className="mt-2">
                  <FinanceActionResultCard result={metadata.structuredData.actionResult} />
                </div>
              </details>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.section>
  );
}
