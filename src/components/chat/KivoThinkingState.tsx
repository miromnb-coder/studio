'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useMemo } from 'react';

export type KivoThinkingVisualState = 'thinking' | 'gmail';

export type KivoThinkingStateProps = {
  status?: string;
  visible?: boolean;
  className?: string;
  visualState?: KivoThinkingVisualState;
};

const FALLBACK_STATUS = 'Thinking...';

function getShapeFrames(state: KivoThinkingVisualState) {
  if (state === 'gmail') {
    return [
      '50% 50% 50% 50% / 50% 50% 50% 50%',
      '57% 43% 54% 46% / 44% 56% 42% 58%',
      '45% 55% 42% 58% / 58% 42% 56% 44%',
      '52% 48% 55% 45% / 46% 54% 44% 56%',
      '50% 50% 50% 50% / 50% 50% 50% 50%',
    ];
  }

  return [
    '50% 50% 50% 50% / 50% 50% 50% 50%',
    '53% 47% 55% 45% / 45% 55% 44% 56%',
    '46% 54% 43% 57% / 57% 43% 55% 45%',
    '51% 49% 54% 46% / 47% 53% 45% 55%',
    '50% 50% 50% 50% / 50% 50% 50% 50%',
  ];
}

export function KivoThinkingState({
  status,
  visible = true,
  className = '',
  visualState = 'thinking',
}: KivoThinkingStateProps) {
  const text = useMemo(() => status?.trim() || FALLBACK_STATUS, [status]);
  const shapeFrames = useMemo(() => getShapeFrames(visualState), [visualState]);

  return (
    <AnimatePresence initial={false}>
      {visible ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className={`flex items-center gap-5 ${className}`}
          aria-live="polite"
          aria-label={text}
        >
          <div className="relative h-[124px] w-[124px] shrink-0">
            <motion.div
              className="absolute inset-0 blur-[20px]"
              style={{
                background:
                  'radial-gradient(circle, rgba(117,197,255,0.20) 0%, rgba(99,163,255,0.10) 48%, rgba(99,163,255,0) 78%)',
              }}
              animate={{
                scale: [0.94, 1.03, 0.97, 1],
                opacity: [0.55, 0.8, 0.62, 0.7],
              }}
              transition={{
                duration: 4.6,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            <motion.div
              className="absolute inset-[10px]"
              animate={{ rotate: 360 }}
              transition={{
                duration: visualState === 'gmail' ? 6 : 7.4,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              <motion.div
                className="relative h-full w-full"
                animate={{
                  borderRadius: shapeFrames,
                  scale: [1, 1.015, 0.992, 1.008, 1],
                }}
                transition={{
                  duration: 5.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                style={{
                  background:
                    'conic-gradient(from 210deg, rgba(208,247,255,0.98), rgba(148,231,255,1), rgba(79,198,255,1), rgba(50,113,255,1), rgba(139,232,255,0.98), rgba(208,247,255,0.98))',
                  boxShadow:
                    '0 0 0 1px rgba(192,234,255,0.12), 0 10px 26px rgba(92,146,255,0.10), 0 0 24px rgba(106,194,255,0.14)',
                }}
              >
                <div className="absolute inset-[14px] rounded-full bg-[rgba(243,247,251,0.94)]" />
                <div className="absolute inset-[7px] rounded-full border border-white/25" />
              </motion.div>
            </motion.div>
          </div>

          <div className="min-w-0">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={text}
                initial={{ opacity: 0, filter: 'blur(5px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, filter: 'blur(5px)' }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="text-[64px] font-normal leading-none tracking-[-0.045em] text-[#787882]"
                style={{
                  fontFamily:
                    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                }}
              >
                {text}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
