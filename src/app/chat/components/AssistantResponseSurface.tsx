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
      className="max-w-[96%] space-y-2.5"
    >
      <div className="rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-3 text-[15px] leading-7 tracking-[-0.01em] text-zinc-100 shadow-[0_14px_28px_rgba(0,0,0,0.27)] backdrop-blur">
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
              <div className="flex flex-wrap gap-2">
                {metadata.suggestedActions.slice(0, 3).map((item) => {
                  const actionType = item.payload?.actionType;
                  if (!isFinanceAction(actionType)) return null;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onAction(actionType)}
                      className="rounded-full border border-white/16 bg-white/[0.08] px-3 py-1 text-[11px] font-medium text-zinc-200"
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {hasToolDetails ? (
              <details className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
                <summary className="cursor-pointer list-none text-[11px] font-medium tracking-wide text-zinc-400">Execution details</summary>
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
              <details className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
                <summary className="cursor-pointer list-none text-[11px] font-medium tracking-wide text-zinc-400">Financial breakdown</summary>
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
              <details className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
                <summary className="cursor-pointer list-none text-[11px] font-medium tracking-wide text-zinc-400">Result details</summary>
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
