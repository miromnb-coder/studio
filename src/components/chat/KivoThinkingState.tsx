'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useMemo } from 'react';

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
  glowOpacity: number[];
  glowScale: number[];
  ringScale: number[];
  textColor: string;
  gradient: string;
  shadow: string;
  shapeFrames: string[];
};

function getVisualConfig(state: KivoThinkingVisualState): VisualConfig {
  switch (state) {
    case 'gmail':
      return {
        rotateDuration: 5.8,
        glowOpacity: [0.5, 0.76, 0.58, 0.68],
        glowScale: [0.96, 1.03, 0.985, 1],
        ringScale: [1, 1.012, 0.994, 1.006, 1],
        textColor: '#7b7b84',
        gradient:
          'conic-gradient(from 212deg, rgba(220,250,255,0.98), rgba(168,239,255,0.98), rgba(106,214,255,0.98), rgba(59,131,255,0.98), rgba(138,232,255,0.98), rgba(220,250,255,0.98))',
        shadow:
          '0 0 0 1px rgba(202,234,255,0.12), 0 6px 18px rgba(97,153,255,0.10), 0 0 22px rgba(127,210,255,0.14)',
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
        rotateDuration: 7.6,
        glowOpacity: [0.46, 0.68, 0.54, 0.62],
        glowScale: [0.97, 1.025, 0.99, 1],
        ringScale: [1, 1.008, 0.996, 1.004, 1],
        textColor: '#7a7b84',
        gradient:
          'conic-gradient(from 212deg, rgba(223,249,255,0.98), rgba(180,241,255,0.98), rgba(124,222,255,0.98), rgba(79,161,255,0.98), rgba(164,236,255,0.98), rgba(223,249,255,0.98))',
        shadow:
          '0 0 0 1px rgba(196,230,255,0.11), 0 6px 16px rgba(90,145,255,0.08), 0 0 18px rgba(132,209,255,0.12)',
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
        glowOpacity: [0.42, 0.62, 0.5, 0.58],
        glowScale: [0.98, 1.02, 0.992, 1],
        ringScale: [1, 1.006, 0.997, 1.003, 1],
        textColor: '#7a7a83',
        gradient:
          'conic-gradient(from 212deg, rgba(215,247,255,0.98), rgba(160,233,255,0.98), rgba(101,208,255,0.98), rgba(64,123,255,0.98), rgba(145,228,255,0.98), rgba(215,247,255,0.98))',
        shadow:
          '0 0 0 1px rgba(193,227,255,0.10), 0 5px 15px rgba(86,136,255,0.07), 0 0 18px rgba(120,199,255,0.11)',
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
        rotateDuration: 8.4,
        glowOpacity: [0.44, 0.64, 0.52, 0.6],
        glowScale: [0.97, 1.02, 0.99, 1],
        ringScale: [1, 1.008, 0.996, 1.004, 1],
        textColor: '#7b7b84',
        gradient:
          'conic-gradient(from 212deg, rgba(220,249,255,0.98), rgba(176,239,255,0.98), rgba(118,220,255,0.98), rgba(74,141,255,0.98), rgba(156,232,255,0.98), rgba(220,249,255,0.98))',
        shadow:
          '0 0 0 1px rgba(197,231,255,0.10), 0 5px 15px rgba(88,140,255,0.07), 0 0 17px rgba(124,202,255,0.11)',
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
        rotateDuration: 10.2,
        glowOpacity: [0.34, 0.5, 0.4, 0.46],
        glowScale: [0.985, 1.01, 0.995, 1],
        ringScale: [1, 1.004, 0.998, 1.002, 1],
        textColor: '#80808a',
        gradient:
          'conic-gradient(from 212deg, rgba(222,248,255,0.98), rgba(182,239,255,0.98), rgba(129,222,255,0.98), rgba(87,152,255,0.98), rgba(169,236,255,0.98), rgba(222,248,255,0.98))',
        shadow:
          '0 0 0 1px rgba(194,228,255,0.09), 0 4px 12px rgba(88,140,255,0.05), 0 0 14px rgba(122,202,255,0.08)',
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
        glowOpacity: [0.48, 0.72, 0.56, 0.64],
        glowScale: [0.965, 1.028, 0.988, 1],
        ringScale: [1, 1.01, 0.995, 1.005, 1],
        textColor: '#7c7c85',
        gradient:
          'conic-gradient(from 212deg, rgba(220,249,255,0.98), rgba(174,239,255,0.98), rgba(112,219,255,0.98), rgba(63,127,255,0.98), rgba(154,233,255,0.98), rgba(220,249,255,0.98))',
        shadow:
          '0 0 0 1px rgba(198,232,255,0.11), 0 6px 16px rgba(88,143,255,0.08), 0 0 20px rgba(127,206,255,0.12)',
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

  return (
    <AnimatePresence initial={false}>
      {visible ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className={`flex items-center gap-3.5 ${className}`}
          aria-live="polite"
          aria-label={text}
        >
          <div className="relative h-[42px] w-[42px] shrink-0">
            <motion.div
              className="absolute inset-[-4px] blur-[10px]"
              style={{
                background:
                  'radial-gradient(circle, rgba(123,198,255,0.22) 0%, rgba(106,163,255,0.10) 50%, rgba(106,163,255,0) 78%)',
              }}
              animate={{
                scale: config.glowScale,
                opacity: config.glowOpacity,
              }}
              transition={{
                duration: 4.8,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            <motion.div
              className="absolute inset-0"
              animate={{ rotate: 360 }}
              transition={{
                duration: config.rotateDuration,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              <motion.div
                className="relative h-full w-full"
                animate={{
                  borderRadius: config.shapeFrames,
                  scale: config.ringScale,
                }}
                transition={{
                  duration: 5.4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                style={{
                  background: config.gradient,
                  boxShadow: config.shadow,
                }}
              >
                <div className="absolute inset-[5.5px] rounded-full bg-[rgba(244,247,251,0.95)]" />
                <div className="absolute inset-[2.5px] rounded-full border border-white/20" />
              </motion.div>
            </motion.div>
          </div>

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
