import type { RefObject } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { MessageThread } from '@/components/chat/MessageThread';
import type { Message } from '@/app/store/app-store-types';

type KivoChatScreenMainContentProps = {
  mainScrollRef: RefObject<HTMLDivElement | null>;
  scrollBottomPadding: number;
  streamError: string;
  refinedStreamError: string;
  hasMessages: boolean;
  isAgentResponding: boolean;
  isSending: boolean;
  messages: Message[];
  lastMessageSafetySpacer: number;
};

export function KivoChatScreenMainContent(props: KivoChatScreenMainContentProps) {
  const { mainScrollRef, scrollBottomPadding, streamError, refinedStreamError, hasMessages, isAgentResponding, isSending, messages, lastMessageSafetySpacer } = props;
  return (
    <main
      ref={mainScrollRef}
      className={`relative flex-1 min-h-0 flex flex-col overscroll-contain [scrollbar-gutter:stable] [-webkit-overflow-scrolling:touch] ${hasMessages ? 'overflow-y-auto touch-pan-y' : 'overflow-hidden'}`}
      style={{ paddingBottom: scrollBottomPadding }}
    >
      <AnimatePresence initial={false}>
        {streamError ? <motion.div key="stream-error" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="px-6 pt-4"><div className="flex items-start gap-2 rounded-[18px] border border-black/[0.07] bg-white/88 px-4 py-3 text-sm text-[#5f6877] shadow-[0_12px_28px_rgba(15,23,42,0.06)] backdrop-blur-xl"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#7a8598]" /><span>{refinedStreamError}</span></div></motion.div> : null}
      </AnimatePresence>
      <AnimatePresence mode="wait" initial={false}>
        {!hasMessages ? (
          <motion.div key="empty-state" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10, scale: 0.985 }} transition={{ duration: 0.22, ease: 'easeOut' }} className="flex min-h-0 flex-1 items-start justify-center px-8 pt-[16vh]">
            <div className="flex max-w-[360px] flex-col items-center text-center">
              <h2 className="text-center text-[30px] font-normal leading-[1.04] tracking-[-0.045em] text-[#353b45] sm:text-[35px]" style={{ fontFamily: 'ui-serif, Georgia, Times, serif' }}>What needs your attention today?</h2>
              <p className="mt-3.5 max-w-[300px] text-balance text-[14px] font-normal leading-[1.42] tracking-[-0.018em] text-[#6b7280] sm:text-[15px]">Plan, decide, and move faster.</p>
            </div>
          </motion.div>
        ) : (
          <motion.div key="message-state" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.24, ease: 'easeOut' }} className="flex min-h-0 flex-1 flex-col px-1 pt-3">
            <MessageThread messages={messages} pending={isAgentResponding || isSending} />
          </motion.div>
        )}
      </AnimatePresence>
      <div aria-hidden="true" className="w-full shrink-0" style={{ height: lastMessageSafetySpacer }} />
    </main>
  );
}
