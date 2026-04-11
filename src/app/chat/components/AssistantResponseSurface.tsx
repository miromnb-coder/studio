'use client';

import { AnimatePresence, motion } from 'framer-motion';
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
  const metadata = message.agentMetadata;
  const isFinanceIntent = metadata?.intent === 'finance';
  const isGmailIntent = metadata?.intent === 'gmail';
  const hasFinanceVisuals = Boolean(metadata?.structuredData?.finance || metadata?.structuredData?.actionResult);
  const hasToolDetails = Boolean(metadata?.steps?.length || metadata?.plan);
  const showOperatorDetails = isFinanceIntent || isGmailIntent || hasFinanceVisuals;
  const isFinanceAction = (value: unknown): value is FinanceActionType =>
    value === 'create_savings_plan' || value === 'find_alternatives' || value === 'draft_cancellation';

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
