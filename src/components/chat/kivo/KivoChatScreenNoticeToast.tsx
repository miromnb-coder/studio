import { AnimatePresence, motion } from 'framer-motion';

export type KivoChatNotice = {
  title: string;
  detail: string;
};

type KivoChatScreenNoticeToastProps = {
  notice: KivoChatNotice | null;
};

export function KivoChatScreenNoticeToast({ notice }: KivoChatScreenNoticeToastProps) {
  return (
    <AnimatePresence initial={false}>
      {notice ? (
        <motion.div
          key="notice"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="pointer-events-none fixed inset-x-0 top-[88px] z-40 mx-auto w-full max-w-[560px] px-5"
        >
          <div className="pointer-events-auto ml-auto w-fit max-w-[320px] rounded-[18px] border border-black/[0.05] bg-white/92 px-4 py-3 shadow-[0_14px_30px_rgba(15,23,42,0.08)] backdrop-blur">
            <p className="text-[13px] font-semibold tracking-[-0.01em] text-[#364152]">
              {notice.title}
            </p>
            <p className="mt-1 text-[12px] leading-5 text-[#6a7382]">{notice.detail}</p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
