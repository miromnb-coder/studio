'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useMemo } from 'react';

export type KivoThinkingVisualState =
  | 'thinking'
  | 'memory'
  | 'gmail'
  | 'calendar'
  | 'planning'
  | 'writing'
  | 'finalizing';

export type KivoThinkingStateProps = {
  status?: string;
  visible?: boolean;
  className?: string;
  visualState?: KivoThinkingVisualState;
};

const FALLBACK_STATUS = 'Thinking...';

function getVisualConfig(state: KivoThinkingVisualState) {
  switch (state) {
    case 'memory':
      return {
        rotateDuration: 8.5,
        glowOpacity: [0.5, 0.8, 0.58, 0.72],
        scale: [1, 1.02, 0.985, 1.01, 1],
        borderRadius: [
          '50% 50% 50% 50% / 50% 50% 50% 50%',
          '56% 44% 60% 40% / 42% 58% 46% 54%',
          '48% 52% 44% 56% / 58% 42% 52% 48%',
          '50% 50% 50% 50% / 50% 50% 50% 50%',
        ],
      };

    case 'gmail':
      return {
        rotateDuration: 5.8,
        glowOpacity: [0.56, 0.92, 0.66, 0.84],
        scale: [1, 1.035, 0.99, 1.018, 1],
        borderRadius: [
          '50% 50% 50% 50% / 50% 50% 50% 50%',
          '60% 40% 58% 42% / 44% 56% 40% 60%',
          '46% 54% 40% 60% / 60% 40% 54% 46%',
          '54% 46% 57% 43% / 48% 52% 44% 56%',
          '50% 50% 50% 50% / 50% 50% 50% 50%',
        ],
      };

    case 'calendar':
      return {
        rotateDuration: 6.6,
        glowOpacity: [0.54, 0.88, 0.64, 0.78],
        scale: [1, 1.028, 0.988, 1.014, 1],
        borderRadius: [
          '50% 50% 50% 50% / 50% 50% 50% 50%',
          '58% 42% 62% 38% / 40% 60% 44% 56%',
          '42% 58% 44% 56% / 60% 40% 58% 42%',
          '52% 48% 56% 44% / 48% 52% 42% 58%',
          '50% 50% 50% 50% / 50% 50% 50% 50%',
        ],
      };

    case 'planning':
      return {
        rotateDuration: 7.2,
        glowOpacity: [0.52, 0.84, 0.62, 0.74],
        scale: [1, 1.025, 0.99, 1.012, 1],
        borderRadius: [
          '50% 50% 50% 50% / 50% 50% 50% 50%',
          '55% 45% 61% 39% / 45% 55% 43% 57%',
          '47% 53% 41% 59% / 58% 42% 56% 44%',
          '53% 47% 55% 45% / 49% 51% 45% 55%',
          '50% 50% 50% 50% / 50% 50% 50% 50%',
        ],
      };

    case 'writing':
      return {
        rotateDuration: 9.5,
        glowOpacity: [0.48, 0.76, 0.56, 0.68],
        scale: [1, 1.016, 0.994, 1.008, 1],
        borderRadius: [
          '50% 50% 50% 50% / 50% 50% 50% 50%',
          '54% 46% 58% 42% / 44% 56% 46% 54%',
          '48% 52% 45% 55% / 56% 44% 52% 48%',
          '50% 50% 50% 50% / 50% 50% 50% 50%',
        ],
      };

    case 'finalizing':
      return {
        rotateDuration: 10.5,
        glowOpacity: [0.42, 0.68, 0.48, 0.58],
        scale: [1, 1.01, 0.996, 1.004, 1],
        borderRadius: [
          '50% 50% 50% 50% / 50% 50% 50% 50%',
          '52% 48% 54% 46% / 48% 52% 46% 54%',
          '50% 50% 50% 50% / 50% 50% 50% 50%',
        ],
      };

    case 'thinking':
    default:
      return {
        rotateDuration: 7,
        glowOpacity: [0.55, 0.9, 0.65, 0.8],
        scale: [1, 1.03, 0.985, 1.015, 1],
        borderRadius: [
          '50% 50% 50% 50% / 50% 50% 50% 50%',
          '58% 42% 61% 39% / 43% 57% 45% 55%',
          '46% 54% 40% 60% / 60% 40% 56% 44%',
          '53% 47% 57% 43% / 47% 53% 42% 58%',
          '50% 50% 50% 50% / 50% 50% 50% 50%',
        ],
      };
  }
}

export function KivoThinkingState({
  status,
  visible = true,
  className = '',
  visualState = 'thinking',
}: KivoThinkingStateProps) {
  const text = useMemo(() => status?.trim() || FALLBACK_STATUS, [status]);
  const config = useMemo(() => getVisualConfig(visualState), [visualState]);

  return (
    <AnimatePresence initial={false}>
      {visible ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className={`flex items-center gap-3 px-4 py-3 ${className}`}
          aria-live="polite"
          aria-label={text}
        >
          <div className="relative h-11 w-11 shrink-0">
            <motion.div
              className="absolute inset-0 rounded-full blur-[12px]"
              style={{
                background:
                  'radial-gradient(circle, rgba(109,191,255,0.34) 0%, rgba(83,145,255,0.16) 48%, rgba(83,145,255,0) 78%)',
              }}
              animate={{
                scale: [0.92, 1.06, 0.96, 1],
                opacity: config.glowOpacity,
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            <motion.div
              className="absolute inset-[2px]"
              animate={{ rotate: 360 }}
              transition={{
                duration: config.rotateDuration,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              <motion.div
                className="h-full w-full"
                style={{
                  background:
                    'conic-gradient(from 210deg, rgba(198,245,255,0.98), rgba(120,215,255,1), rgba(66,128,255,1), rgba(136,232,255,0.96), rgba(198,245,255,0.98))',
                  boxShadow:
                    '0 0 0 1px rgba(180,226,255,0.20), 0 10px 28px rgba(72,124,255,0.12), 0 0 26px rgba(101,191,255,0.26)',
                }}
                animate={{
                  borderRadius: config.borderRadius,
                  scale: config.scale,
                }}
                transition={{
                  duration: 5.4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </motion.div>

            <div className="absolute inset-[10px] rounded-full bg-white/90 shadow-[inset_0_1px_2px_rgba(255,255,255,0.95)]" />

            <motion.div
              className="absolute inset-[14px] rounded-full"
              style={{
                background:
                  'radial-gradient(circle, rgba(255,255,255,0.98) 0%, rgba(241,247,255,0.94) 58%, rgba(227,238,255,0.82) 100%)',
              }}
              animate={{
                scale: [0.96, 1.05, 0.98, 1.02, 0.96],
                opacity: [0.94, 1, 0.96, 0.98, 0.94],
              }}
              transition={{
                duration: 3.6,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </div>

          <div className="min-w-0">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={text}
                initial={{ opacity: 0, y: 4, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -4, filter: 'blur(4px)' }}
                transition={{ duration: 0.24, ease: 'easeOut' }}
                className="text-[17px] font-medium tracking-[-0.02em] text-[#6b6f79]"
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
