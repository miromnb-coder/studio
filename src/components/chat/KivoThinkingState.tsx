'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useMemo } from 'react';

export type KivoThinkingVisualState =
  | 'thinking'
  | 'gmail'
  | 'calendar'
  | 'memory'
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

type VisualConfig = {
  rotateDuration: number;
  pulseDuration: number;
  textColor: string;
  glowOpacity: number[];
  scale: number[];
};

function getVisualConfig(state: KivoThinkingVisualState): VisualConfig {
  switch (state) {
    case 'gmail':
      return {
        rotateDuration: 8.5,
        pulseDuration: 4.2,
        textColor: '#7a7a82',
        glowOpacity: [0.08, 0.16, 0.1, 0.13],
        scale: [1, 1.015, 0.995, 1.008, 1],
      };
    case 'calendar':
      return {
        rotateDuration: 10.5,
        pulseDuration: 5.2,
        textColor: '#7d7d85',
        glowOpacity: [0.05, 0.1, 0.07, 0.09],
        scale: [1, 1.01, 0.997, 1.004, 1],
      };
    case 'memory':
      return {
        rotateDuration: 11.5,
        pulseDuration: 5.6,
        textColor: '#7b7b83',
        glowOpacity: [0.06, 0.12, 0.08, 0.1],
        scale: [1, 1.01, 0.996, 1.004, 1],
      };
    case 'planning':
      return {
        rotateDuration: 9.2,
        pulseDuration: 4.8,
        textColor: '#7a7a82',
        glowOpacity: [0.07, 0.14, 0.09, 0.11],
        scale: [1, 1.012, 0.996, 1.006, 1],
      };
    case 'writing':
      return {
        rotateDuration: 7.8,
        pulseDuration: 4.0,
        textColor: '#777780',
        glowOpacity: [0.08, 0.15, 0.1, 0.12],
        scale: [1, 1.014, 0.994, 1.008, 1],
      };
    case 'finalizing':
      return {
        rotateDuration: 12.5,
        pulseDuration: 6,
        textColor: '#81818a',
        glowOpacity: [0.03, 0.07, 0.04, 0.06],
        scale: [1, 1.006, 0.998, 1.002, 1],
      };
    case 'thinking':
    default:
      return {
        rotateDuration: 9.6,
        pulseDuration: 4.8,
        textColor: '#7b7b84',
        glowOpacity: [0.06, 0.13, 0.08, 0.1],
        scale: [1, 1.012, 0.996, 1.006, 1],
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
            animate={{ scale: config.scale }}
            transition={{
              duration: config.pulseDuration,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <motion.div
              className="absolute inset-[-7px] rounded-full blur-[10px]"
              style={{
                background:
                  'radial-gradient(circle, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.06) 45%, rgba(255,255,255,0) 75%)',
              }}
              animate={{ opacity: config.glowOpacity }}
              transition={{
                duration: config.pulseDuration,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            <motion.svg
              viewBox="0 0 100 100"
              className="relative h-full w-full overflow-visible"
              animate={{ rotate: 360 }}
              transition={{
                duration: config.rotateDuration,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              <defs>
                <linearGradient id="kivo-fold-grad-a" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
                  <stop offset="18%" stopColor="rgba(230,230,232,0.82)" />
                  <stop offset="46%" stopColor="rgba(64,64,70,0.82)" />
                  <stop offset="76%" stopColor="rgba(10,10,14,0.96)" />
                  <stop offset="100%" stopColor="rgba(245,245,247,0.92)" />
                </linearGradient>

                <linearGradient id="kivo-fold-grad-b" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.94)" />
                  <stop offset="20%" stopColor="rgba(210,210,214,0.78)" />
                  <stop offset="52%" stopColor="rgba(38,38,44,0.88)" />
                  <stop offset="100%" stopColor="rgba(248,248,250,0.9)" />
                </linearGradient>

                <filter id="kivo-fold-blur" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="1.6" />
                </filter>
              </defs>

              <motion.g
                animate={{
                  scale: [1, 1.012, 0.996, 1.006, 1],
                  rotate: [0, 2, -2, 1, 0],
                }}
                transition={{
                  duration: 7.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <path
                  d="M49 9
                     C63 9, 77 16, 84 29
                     C89 39, 88 49, 80 57
                     C74 63, 65 66, 57 64
                     C50 62, 46 57, 45 51
                     C44 44, 47 38, 53 33
                     C59 28, 64 23, 64 18
                     C64 12, 58 9, 49 9 Z"
                  fill="url(#kivo-fold-grad-a)"
                  filter="url(#kivo-fold-blur)"
                />
                <path
                  d="M80 57
                     C75 70, 64 81, 49 85
                     C38 88, 28 85, 21 77
                     C16 71, 15 62, 19 55
                     C23 48, 30 45, 36 45
                     C43 45, 49 48, 53 54
                     C57 60, 61 65, 66 66
                     C72 67, 77 64, 80 57 Z"
                  fill="url(#kivo-fold-grad-b)"
                  filter="url(#kivo-fold-blur)"
                />
                <path
                  d="M21 77
                     C11 70, 8 57, 10 42
                     C12 31, 18 22, 28 16
                     C36 11, 46 11, 53 15
                     C60 19, 63 26, 63 32
                     C63 40, 59 46, 53 50
                     C47 54, 41 58, 39 63
                     C37 69, 40 74, 47 78
                     C37 82, 28 82, 21 77 Z"
                  fill="url(#kivo-fold-grad-a)"
                  filter="url(#kivo-fold-blur)"
                />

                <circle cx="50" cy="50" r="20.5" fill="rgba(0,0,0,0.96)" />

                <path
                  d="M49 10
                     C62 10, 76 17, 83 29"
                  fill="none"
                  stroke="rgba(255,255,255,0.22)"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
                <path
                  d="M80 57
                     C74 70, 63 80, 49 84"
                  fill="none"
                  stroke="rgba(255,255,255,0.18)"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
                <path
                  d="M21 77
                     C12 70, 9 58, 10 44"
                  fill="none"
                  stroke="rgba(255,255,255,0.14)"
                  strokeWidth="1.1"
                  strokeLinecap="round"
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
