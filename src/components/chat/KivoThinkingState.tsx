'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useId, useMemo } from 'react';

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
  driftDuration: number;
  textColor: string;
  accent: string;
  secondaryAccent: string;
  glowOpacity: number[];
  haloOpacity: number[];
  scale: number[];
  textLabel: string;
};

function getVisualConfig(state: KivoThinkingVisualState): VisualConfig {
  switch (state) {
    case 'gmail':
      return {
        rotateDuration: 8.2,
        pulseDuration: 4.1,
        driftDuration: 6.8,
        textColor: '#768396',
        accent: 'rgba(124, 156, 214, 0.32)',
        secondaryAccent: 'rgba(255, 255, 255, 0.78)',
        glowOpacity: [0.16, 0.28, 0.18, 0.24],
        haloOpacity: [0.2, 0.32, 0.22, 0.26],
        scale: [1, 1.018, 0.994, 1.008, 1],
        textLabel: 'Checking email...',
      };
    case 'calendar':
      return {
        rotateDuration: 10.2,
        pulseDuration: 5.2,
        driftDuration: 7.8,
        textColor: '#778391',
        accent: 'rgba(138, 169, 214, 0.2)',
        secondaryAccent: 'rgba(255, 255, 255, 0.74)',
        glowOpacity: [0.1, 0.18, 0.12, 0.16],
        haloOpacity: [0.12, 0.2, 0.14, 0.18],
        scale: [1, 1.01, 0.997, 1.004, 1],
        textLabel: 'Reviewing schedule...',
      };
    case 'memory':
      return {
        rotateDuration: 11.8,
        pulseDuration: 5.6,
        driftDuration: 8.4,
        textColor: '#758091',
        accent: 'rgba(154, 164, 192, 0.2)',
        secondaryAccent: 'rgba(255, 255, 255, 0.7)',
        glowOpacity: [0.1, 0.2, 0.13, 0.17],
        haloOpacity: [0.1, 0.18, 0.12, 0.16],
        scale: [1, 1.012, 0.996, 1.004, 1],
        textLabel: 'Checking memory...',
      };
    case 'planning':
      return {
        rotateDuration: 9,
        pulseDuration: 4.5,
        driftDuration: 7.2,
        textColor: '#74808e',
        accent: 'rgba(120, 144, 184, 0.24)',
        secondaryAccent: 'rgba(255, 255, 255, 0.76)',
        glowOpacity: [0.14, 0.24, 0.16, 0.2],
        haloOpacity: [0.14, 0.24, 0.16, 0.2],
        scale: [1, 1.014, 0.995, 1.006, 1],
        textLabel: 'Building a plan...',
      };
    case 'writing':
      return {
        rotateDuration: 7.6,
        pulseDuration: 4,
        driftDuration: 6.2,
        textColor: '#717c89',
        accent: 'rgba(142, 156, 184, 0.22)',
        secondaryAccent: 'rgba(255, 255, 255, 0.8)',
        glowOpacity: [0.16, 0.26, 0.18, 0.22],
        haloOpacity: [0.16, 0.26, 0.18, 0.22],
        scale: [1, 1.016, 0.994, 1.008, 1],
        textLabel: 'Writing response...',
      };
    case 'finalizing':
      return {
        rotateDuration: 12.6,
        pulseDuration: 6.1,
        driftDuration: 8.8,
        textColor: '#7d8795',
        accent: 'rgba(186, 196, 214, 0.16)',
        secondaryAccent: 'rgba(255, 255, 255, 0.68)',
        glowOpacity: [0.08, 0.13, 0.1, 0.12],
        haloOpacity: [0.08, 0.14, 0.09, 0.12],
        scale: [1, 1.008, 0.998, 1.002, 1],
        textLabel: 'Finalizing...',
      };
    case 'thinking':
    default:
      return {
        rotateDuration: 9.4,
        pulseDuration: 4.8,
        driftDuration: 7.2,
        textColor: '#76818f',
        accent: 'rgba(150, 165, 196, 0.22)',
        secondaryAccent: 'rgba(255, 255, 255, 0.76)',
        glowOpacity: [0.12, 0.22, 0.14, 0.18],
        haloOpacity: [0.14, 0.24, 0.16, 0.2],
        scale: [1, 1.014, 0.995, 1.006, 1],
        textLabel: 'Thinking...',
      };
  }
}

function getStatusText(status: string | undefined, fallback: string): string {
  const normalized = status?.trim();
  if (!normalized) return fallback;
  return normalized;
}

export function KivoThinkingState({
  status,
  visible = true,
  className = '',
  visualState = 'thinking',
}: KivoThinkingStateProps) {
  const gradientId = useId();
  const gradientA = `${gradientId}-grad-a`;
  const gradientB = `${gradientId}-grad-b`;
  const blurId = `${gradientId}-blur`;

  const config = useMemo(() => getVisualConfig(visualState), [visualState]);
  const text = useMemo(
    () => getStatusText(status, config.textLabel || FALLBACK_STATUS),
    [status, config.textLabel],
  );

  return (
    <AnimatePresence initial={false}>
      {visible ? (
        <motion.div
          initial={{ opacity: 0, y: 8, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -6, filter: 'blur(6px)' }}
          transition={{ duration: 0.26, ease: 'easeOut' }}
          className={`flex items-center gap-4 ${className}`}
          aria-live="polite"
          aria-label={text}
        >
          <motion.div
            className="relative h-[48px] w-[48px] shrink-0"
            animate={{ scale: config.scale, y: [0, -1, 0, 1, 0] }}
            transition={{
              duration: config.pulseDuration,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <motion.div
              className="absolute inset-[-10px] rounded-full blur-[14px]"
              style={{
                background: `radial-gradient(circle, ${config.accent} 0%, rgba(255,255,255,0.08) 46%, rgba(255,255,255,0) 76%)`,
              }}
              animate={{ opacity: config.glowOpacity, scale: [0.96, 1.08, 0.98, 1.04, 0.96] }}
              transition={{
                duration: config.pulseDuration,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            <motion.div
              className="absolute inset-[-2px] rounded-full blur-[2px]"
              style={{
                border: '1px solid rgba(255,255,255,0.22)',
                background:
                  'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.08), rgba(255,255,255,0.01) 60%, transparent 75%)',
              }}
              animate={{ opacity: config.haloOpacity }}
              transition={{
                duration: config.driftDuration,
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
                <linearGradient id={gradientA} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.98)" />
                  <stop offset="18%" stopColor={config.secondaryAccent} />
                  <stop offset="46%" stopColor="rgba(78,86,100,0.72)" />
                  <stop offset="76%" stopColor="rgba(12,12,16,0.96)" />
                  <stop offset="100%" stopColor="rgba(250,250,252,0.94)" />
                </linearGradient>

                <linearGradient id={gradientB} x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.94)" />
                  <stop offset="24%" stopColor="rgba(214,220,229,0.74)" />
                  <stop offset="56%" stopColor="rgba(42,46,54,0.88)" />
                  <stop offset="100%" stopColor="rgba(248,248,250,0.92)" />
                </linearGradient>

                <filter id={blurId} x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="1.5" />
                </filter>
              </defs>

              <motion.g
                animate={{
                  scale: [1, 1.016, 0.995, 1.008, 1],
                  rotate: [0, 2.2, -2.2, 1.2, 0],
                  x: [0, 0.5, -0.5, 0],
                  y: [0, -0.4, 0.5, 0],
                }}
                transition={{
                  duration: config.driftDuration,
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
                  fill={`url(#${gradientA})`}
                  filter={`url(#${blurId})`}
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
                  fill={`url(#${gradientB})`}
                  filter={`url(#${blurId})`}
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
                  fill={`url(#${gradientA})`}
                  filter={`url(#${blurId})`}
                />

                <circle cx="50" cy="50" r="20.5" fill="rgba(0,0,0,0.97)" />

                <circle
                  cx="50"
                  cy="50"
                  r="11.8"
                  fill="none"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="1"
                />

                <path
                  d="M49 10 C62 10, 76 17, 83 29"
                  fill="none"
                  stroke="rgba(255,255,255,0.22)"
                  strokeWidth="1.35"
                  strokeLinecap="round"
                />
                <path
                  d="M80 57 C74 70, 63 80, 49 84"
                  fill="none"
                  stroke="rgba(255,255,255,0.18)"
                  strokeWidth="1.15"
                  strokeLinecap="round"
                />
                <path
                  d="M21 77 C12 70, 9 58, 10 44"
                  fill="none"
                  stroke="rgba(255,255,255,0.14)"
                  strokeWidth="1.05"
                  strokeLinecap="round"
                />
              </motion.g>
            </motion.svg>
          </motion.div>

          <div className="min-w-0">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`${visualState}-${text}`}
                initial={{ opacity: 0, y: 4, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -4, filter: 'blur(6px)' }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="flex items-center gap-1.5"
              >
                <div
                  className="text-[19px] font-normal leading-none tracking-[-0.035em]"
                  style={{
                    color: config.textColor,
                    fontFamily:
                      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  }}
                >
                  {text}
                </div>

                <motion.div
                  className="flex items-end gap-1 pt-1"
                  aria-hidden="true"
                  animate={{ opacity: [0.5, 1, 0.55, 0.9, 0.5] }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  {[0, 1, 2].map((index) => (
                    <motion.span
                      key={index}
                      className="h-[4px] w-[4px] rounded-full"
                      style={{
                        background: 'rgba(126,136,153,0.72)',
                      }}
                      animate={{
                        y: [0, -2.5, 0],
                        opacity: [0.35, 0.9, 0.35],
                        scale: [0.95, 1.05, 0.95],
                      }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: index * 0.16,
                      }}
                    />
                  ))}
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
