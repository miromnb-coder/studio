import { AnimatePresence, motion } from 'framer-motion';

type KivoChatScreenScrollToLatestButtonProps = {
  show: boolean;
  bottom: number;
  onClick: () => void;
};

export function KivoChatScreenScrollToLatestButton({
  show,
  bottom,
  onClick,
}: KivoChatScreenScrollToLatestButtonProps) {
  return (
    <AnimatePresence initial={false}>
      {show ? (
        <motion.button
          key="scroll-to-latest"
          type="button"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          onClick={onClick}
          className="fixed right-5 z-30 inline-flex items-center rounded-full border border-black/[0.08] bg-white/90 px-3 py-2 text-[12px] font-medium tracking-[-0.01em] text-[#495264] shadow-[0_10px_24px_rgba(15,23,42,0.09)] backdrop-blur-md transition-all duration-150 hover:bg-white"
          style={{
            bottom: `${bottom}px`,
          }}
        >
          Latest
        </motion.button>
      ) : null}
    </AnimatePresence>
  );
}
