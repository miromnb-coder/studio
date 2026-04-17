'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useId, useMemo } from 'react';

export type KivoThinkingVisualState =
  | 'thinking'
  | 'gmail'
  | 'calendar'
  | 'planning'
  | 'memory'
  | 'finalizing';

export type KivoThinkingStateProps = {
  status?: string;
  visible?: boolean;
  className?: string;
  visualState?: KivoThinkingVisualState;
};

const FALLBACK_STATUS = 'Thinking...';

type VisualConfig = {
  rotateDuration: number;
  textColor: string;
  glowOpacity: number[];
  orbScale: number[];
  gradient: string;
  shapeFrames: string[];
};

function getVisualConfig(state: KivoThinkingVisualState): VisualConfig {
  switch (state) {
    case 'gmail':
      return {
        rotateDuration: 5.8,
        textColor: '#7b7c85',
        glowOpacity: [0.5, 0.78, 0.58, 0.68],
        orbScale: [1, 1.01, 0.996, 1.004, 1],
        gradient:
          'conic-gradient(from 208deg, rgba(224,250,255,0.98), rgba(171,240,255,0.98), rgba(112,220,255,0.98), rgba(69,136,255,0.98), rgba(156,234,255,0.98), rgba(224,250,255,0.98))',
        shapeFrames: [
          '50% 50% 50% 50% / 50% 50% 50% 50%',
          '57% 43% 54% 46% / 44% 56% 42% 58%',
          '45% 55% 42% 58% / 58% 42% 56% 44%',
          '52% 48% 55% 45% / 46% 54% 44% 56%',
          '50% 50% 50% 50% / 50% 50% 50% 50%',
        ],
      };

    case 'calendar':
      return {
        rotateDuration: 7.8,
        textColor: '#7d7e87',
        glowOpacity: [0.42, 0.64, 0.5, 0.56],
        orbScale: [1, 1.008, 0.997, 1.003, 1],
        gradient:
          'conic-gradient(from 208deg, rgba(227,250,255,0.98), rgba(186,242,255,0.98), rgba(130,225,255,0.98), rgba(89,158,255,0.98), rgba(172,237,255,0.98), rgba(227,250,255,0.98))',
        shapeFrames: [
          '50% 50% 50% 50% / 50% 50% 50% 50%',
          '54% 46% 55% 45% / 45% 55% 44% 56%',
          '46% 54% 43% 57% / 57% 43% 55% 45%',
          '51% 49% 54% 46% / 47% 53% 45% 55%',
          '50% 50% 50% 50% / 50% 50% 50% 50%',
        ],
      };

    case 'planning':
      return {
        rotateDuration: 8.8,
        textColor: '#7c7d86',
        glowOpacity: [0.38, 0.56, 0.46, 0.52],
        orbScale: [1, 1.006, 0.998, 1.002, 1],
        gradient:
          'conic-gradient(from 208deg, rgba(221,248,255,0.98), rgba(171,237,255,0.98), rgba(114,216,255,0.98), rgba(76,132,255,0.98), rgba(154,231,255,0.98), rgba(221,248,255,0.98))',
        shapeFrames: [
          '50% 50% 50% 50% / 50% 50% 50% 50%',
          '53% 47% 55% 45% / 45% 55% 44% 56%',
          '47% 53% 44% 56% / 56% 44% 54% 46%',
          '51% 49% 53% 47% / 47% 53% 45% 55%',
          '50% 50% 50% 50% / 50% 50% 50% 50%',
        ],
      };

    case 'memory':
      return {
        rotateDuration: 8.2,
        textColor: '#7c7d86',
        glowOpacity: [0.4, 0.6, 0.48, 0.54],
        orbScale: [1, 1.007, 0.997, 1.003, 1],
        gradient:
          'conic-gradient(from 208deg, rgba(224,249,255,0.98), rgba(178,239,255,0.98), rgba(121,221,255,0.98), rgba(84,145,255,0.98), rgba(164,234,255,0.98), rgba(224,249,255,0.98))',
        shapeFrames: [
          '50% 50% 50% 50% / 50% 50% 50% 50%',
          '55% 45% 54% 46% / 46% 54% 43% 57%',
          '46% 54% 42% 58% / 57% 43% 55% 45%',
          '52% 48% 54% 46% / 47% 53% 44% 56%',
          '50% 50% 50% 50% / 50% 50% 50% 50%',
        ],
      };

    case 'finalizing':
      return {
        rotateDuration: 10.4,
        textColor: '#81828b',
        glowOpacity: [0.3, 0.46, 0.38, 0.42],
        orbScale: [1, 1.004, 0.999, 1.001, 1],
        gradient:
          'conic-gradient(from 208deg, rgba(229,251,255,0.98), rgba(191,243,255,0.98), rgba(140,227,255,0.98), rgba(97,163,255,0.98), rgba(181,239,255,0.98), rgba(229,251,255,0.98))',
        shapeFrames: [
          '50% 50% 50% 50% / 50% 50% 50% 50%',
          '52% 48% 53% 47% / 47% 53% 45% 55%',
          '48% 52% 46% 54% / 54% 46% 52% 48%',
          '50% 50% 50% 50% / 50% 50% 50% 50%',
        ],
      };

    case 'thinking':
    default:
      return {
        rotateDuration: 6.9,
        textColor: '#7b7c85',
        glowOpacity: [0.46, 0.7, 0.54, 0.62],
        orbScale: [1, 1.01, 0.996, 1.004, 1],
        gradient:
          'conic-gradient(from 208deg, rgba(223,250,255,0.98), rgba(178,239,255,0.98), rgba(118,221,255,0.98), rgba(72,131,255,0.98), rgba(159,234,255,0.98), rgba(223,250,255,0.98))',
        shapeFrames: [
          '50% 50% 50% 50% / 50% 50% 50% 50%',
          '53% 47% 55% 45% / 45% 55% 44% 56%',
          '46% 54% 43% 57% / 57% 43% 55% 45%',
          '51% 49% 54% 46% / 47% 53% 45% 55%',
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
  const id = useId();

  const glowId = `${id}-glow`;
  const blurId = `${id}-blur`;
  const ringMaskId = `${id}-ring-mask`;
  const innerGlowId = `${id}-inner-glow`;

  return (
    <AnimatePresence initial={false}>
      {visible ? (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className={`flex items-center gap-3.5 px-0 py-0 bg-transparent shadow-none border-0 rounded-none ${className}`}
          aria-live="polite"
          aria-label={text}
        >
          <motion.div
            className="relative h-[42px] w-[42px] shrink-0"
            animate={{ scale: config.orbScale }}
            transition={{
              duration: 4.8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <motion.div
              className="absolute inset-[-7px] pointer-events-none"
              animate={{ opacity: config.glowOpacity }}
              transition={{
                duration: 4.8,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <svg viewBox="0 0 48 48" className="h-full w-full overflow-visible">
                <defs>
                  <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#8edfff" stopOpacity="0.22" />
                    <stop offset="55%" stopColor="#6c97ff" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#6c97ff" stopOpacity="0" />
                  </radialGradient>
                  <filter id={blurId} x="-60%" y="-60%" width="220%" height="220%">
                    <feGaussianBlur stdDeviation="4" />
                  </filter>
                </defs>
                <circle
                  cx="24"
                  cy="24"
                  r="15.5"
                  fill={`url(#${glowId})`}
                  filter={`url(#${blurId})`}
                />
              </svg>
            </motion.div>

            <motion.svg
              viewBox="0 0 48 48"
              className="relative h-full w-full"
              animate={{ rotate: 360 }}
              transition={{
                duration: config.rotateDuration,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              <defs>
                <radialGradient id={innerGlowId} cx="50%" cy="50%" r="58%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.99" />
                  <stop offset="72%" stopColor="#f1f6fb" stopOpacity="0.96" />
                  <stop offset="100%" stopColor="#edf3f8" stopOpacity="0.92" />
                </radialGradient>

                <mask id={ringMaskId}>
                  <rect width="48" height="48" fill="black" />
                  <g transform="translate(24 24)">
                    <path
                      d="M 0 -16.5
                         C 6.8 -16.5, 13.2 -10.8, 15.1 -2
                         C 16.1 3.7, 13.3 9.5, 8.8 13.1
                         C 5.2 16, 1.2 17.1, -2 16.4
                         C -5.3 15.7, -7.4 13.4, -7.6 10.3
                         C -7.8 6.5, -5.9 3.2, -2 1.1
                         C 1.9 -1, 4.8 -4, 5.7 -7.7
                         C 6.4 -10.7, 4.8 -13.8, 0 -16.5 Z"
                      fill="white"
                    />
                    <g transform="rotate(120)">
                      <path
                        d="M 0 -16.5
                           C 6.8 -16.5, 13.2 -10.8, 15.1 -2
                           C 16.1 3.7, 13.3 9.5, 8.8 13.1
                           C 5.2 16, 1.2 17.1, -2 16.4
                           C -5.3 15.7, -7.4 13.4, -7.6 10.3
                           C -7.8 6.5, -5.9 3.2, -2 1.1
                           C 1.9 -1, 4.8 -4, 5.7 -7.7
                           C 6.4 -10.7, 4.8 -13.8, 0 -16.5 Z"
                        fill="white"
                      />
                    </g>
                    <g transform="rotate(240)">
                      <path
                        d="M 0 -16.5
                           C 6.8 -16.5, 13.2 -10.8, 15.1 -2
                           C 16.1 3.7, 13.3 9.5, 8.8 13.1
                           C 5.2 16, 1.2 17.1, -2 16.4
                           C -5.3 15.7, -7.4 13.4, -7.6 10.3
                           C -7.8 6.5, -5.9 3.2, -2 1.1
                           C 1.9 -1, 4.8 -4, 5.7 -7.7
                           C 6.4 -10.7, 4.8 -13.8, 0 -16.5 Z"
                        fill="white"
                      />
                    </g>
                  </g>
                  <circle cx="24" cy="24" r="10.2" fill="black" />
                </mask>
              </defs>

              <motion.g
                animate={{ scale: [1, 1.008, 0.997, 1.003, 1] }}
                transition={{
                  duration: 5.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <rect
                  x="4"
                  y="4"
                  width="40"
                  height="40"
                  rx="20"
                  fill={config.gradient}
                  mask={`url(#${ringMaskId})`}
                />
                <circle cx="24" cy="24" r="10.5" fill={`url(#${innerGlowId})`} />
                <circle
                  cx="24"
                  cy="24"
                  r="17"
                  fill="none"
                  stroke="rgba(255,255,255,0.16)"
                  strokeWidth="0.8"
                />
              </motion.g>
            </motion.svg>
          </motion.div>

          <div className="min-w-0">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`${visualState}-${text}`}
                initial={{ opacity: 0, y: 2, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -2, filter: 'blur(4px)' }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="text-[18px] font-normal leading-none tracking-[-0.03em] bg-transparent"
                style={{
                  color: config.textColor,
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
