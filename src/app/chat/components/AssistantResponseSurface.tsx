'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AgentStrategyCard } from './AgentStrategyCard';
import { StructuredResultCard } from './StructuredResultCard';
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

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
      className="overflow-hidden rounded-[26px] border border-black/[0.07] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(245,247,252,0.88))] p-3 shadow-[0_14px_34px_rgba(0,0,0,0.06)] backdrop-blur-xl"
    >
      <div className="rounded-2xl border border-white/70 bg-white/75 px-3.5 py-3 text-[15px] leading-7 text-[#1e1e1e]">
        {message.content || (message.isStreaming ? ' ' : '')}
      </div>

      <AnimatePresence>
        {metadata ? (
          <motion.div
            key={`${message.id}-meta`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.22 }}
            className="mt-2 space-y-2"
          >
            <AgentStrategyCard metadata={metadata} />
            {metadata.structuredData?.finance ? (
              <FinanceResultCard
                data={metadata.structuredData.finance}
                onAction={onAction}
                actionLoading={actionLoading}
                isPremium={isPremium}
                onPremiumRequired={onPremiumRequired}
              />
            ) : (
              <StructuredResultCard data={metadata.structuredData} />
            )}
            {metadata.structuredData?.actionResult ? <FinanceActionResultCard result={metadata.structuredData.actionResult} /> : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.article>
  );
}
