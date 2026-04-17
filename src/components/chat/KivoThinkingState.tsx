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
  outerA: string;
  outerB: string;
  outerC: string;
};

function getVisualConfig(state: KivoThinkingVisualState): VisualConfig {
  switch (state) {
    case 'gmail':
      return {
        rotateDuration: 5.6,
        textColor: '#7a7b84',
        glowOpacity: [0.52, 0.8, 0.6, 0.7],
        orbScale: [1, 1.015, 0.995, 1.008, 1],
        outerA: '#dff8ff',
        outerB: '#7bdcff',
        outerC: '#397bff',
      };

    case 'calendar':
      return {
        rotateDuration: 7.8,
        textColor: '#7d7e87',
        glowOpacity: [0.44, 0.66, 0.52, 0.58],
        orbScale: [1, 1.008, 0.997, 1.004, 1],
        outerA: '#e5f9ff',
        outerB: '#97e7ff',
        outerC: '#5c9fff',
      };

    case 'planning':
      return {
        rotateDuration: 8.6,
        textColor: '#7c7d86',
        glowOpacity: [0.4, 0.58, 0.48, 0.54],
        orbScale: [1, 1.006, 0.998, 1.003, 1],
        outerA: '#dff7ff',
        outerB: '#8edfff',
        outerC: '#4e8bff',
      };

    case 'memory':
      return {
        rotateDuration: 8.2,
        textColor: '#7c7d86',
        glowOpacity: [0.42, 0.62, 0.5, 0.56],
        orbScale: [1, 1.007, 0.997, 1.003, 1],
        outerA: '#e2f8ff',
        outerB: '#90e4ff',
        outerC: '#5b95ff',
      };

    case 'finalizing':
      return {
        rotateDuration: 10.2,
        textColor: '#80818a',
        glowOpacity: [0.32, 0.48, 0.4, 0.44],
        orbScale: [1, 1.004, 0.999, 1.002, 1],
        outerA: '#e7faff',
        outerB: '#a4e9ff',
        outerC: '#78b7ff',
      };

    case 'thinking':
    default:
      return {
        rotateDuration: 6.8,
        textColor: '#7b7c85',
        glowOpacity: [0.48, 0.72, 0.56, 0.64],
        orbScale: [1, 1.012, 0.996, 1.006, 1],
        outerA: '#e0f8ff',
        outerB: '#86e2ff',
        outerC: '#4d86ff',
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

  const gradientId = `${id}-orb-gradient`;
  const glowId = `${id}-orb-glow`;
  const innerGlowId = `${id}-orb-inner-glow`;
  const blurId = `${id}-orb-blur`;

  return (
    <AnimatePresence initial={false}>
      {visible ? (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className={`flex items-center gap-3.5 ${className}`}
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
              className="absolute inset-[-6px]"
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
                    <stop offset="0%" stopColor={config.outerB} stopOpacity="0.24" />
                    <stop offset="55%" stopColor={config.outerC} stopOpacity="0.12" />
                    <stop offset="100%" stopColor={config.outerC} stopOpacity="0" />
                  </radialGradient>
                  <filter id={blurId} x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3.5" />
                  </filter>
                </defs>
                <circle
                  cx="24"
                  cy="24"
                  r="16"
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
                <linearGradient id={gradientId} x1="10%" y1="10%" x2="90%" y2="90%">
                  <stop offset="0%" stopColor={config.outerA} />
                  <stop offset="42%" stopColor={config.outerB} />
                  <stop offset="78%" stopColor={config.outerC} />
                  <stop offset="100%" stopColor={config.outerA} />
                </linearGradient>

                <radialGradient id={innerGlowId} cx="50%" cy="50%" r="55%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
                  <stop offset="70%" stopColor="#f2f7fb" stopOpacity="0.94" />
                  <stop offset="100%" stopColor="#edf3f9" stopOpacity="0.9" />
                </radialGradient>

                <mask id={`${id}-ring-mask`}>
                  <rect width="48" height="48" fill="black" />
                  <g transform="translate(24 24)">
                    <path
                      d="M 0 -17
                         C 7 -17, 14 -11, 16 -2
                         C 17 4, 14 10, 9 14
                         C 5 17, 1 18, -2 17
                         C -6 16, -8 13, -8 10
                         C -8 6, -6 3, -2 1
                         C 2 -1, 5 -4, 6 -8
                         C 6 -11, 4 -14, 0 -17 Z"
                      fill="white"
                    />
                    <g transform="rotate(120)">
                      <path
                        d="M 0 -17
                           C 7 -17, 14 -11, 16 -2
                           C 17 4, 14 10, 9 14
                           C 5 17, 1 18, -2 17
                           C -6 16, -8 13, -8 10
                           C -8 6, -6 3, -2 1
                           C 2 -1, 5 -4, 6 -8
                           C 6 -11, 4 -14, 0 -17 Z"
                        fill="white"
                      />
                    </g>
                    <g transform="rotate(240)">
                      <path
                        d="M 0 -17
                           C 7 -17, 14 -11, 16 -2
                           C 17 4, 14 10, 9 14
                           C 5 17, 1 18, -2 17
                           C -6 16, -8 13, -8 10
                           C -8 6, -6 3, -2 1
                           C 2 -1, 5 -4, 6 -8
                           C 6 -11, 4 -14, 0 -17 Z"
                        fill="white"
                      />
                    </g>
                  </g>
                  <circle cx="24" cy="24" r="10.1" fill="black" />
                </mask>
              </defs>

              <motion.g
                animate={{
                  scale: [1, 1.01, 0.996, 1.004, 1],
                }}
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
                  fill={`url(#${gradientId})`}
                  mask={`url(#${id}-ring-mask)`}
                />

                <circle
                  cx="24"
                  cy="24"
                  r="10.5"
                  fill={`url(#${innerGlowId})`}
                />

                <circle
                  cx="24"
                  cy="24"
                  r="17.2"
                  fill="none"
                  stroke="rgba(255,255,255,0.18)"
                  strokeWidth="0.9"
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
                className="text-[18px] font-normal leading-none tracking-[-0.03em]"
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
