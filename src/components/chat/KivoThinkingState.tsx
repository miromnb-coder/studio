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

type VisualConfig = {
  accent: string;
  rail: string;
  titleColor: string;
  subtitleColor: string;
  pulseDuration: number;
  driftDuration: number;
  titleFallback: string;
  subtitle: string;
};

function getVisualConfig(state: KivoThinkingVisualState): VisualConfig {
  switch (state) {
    case 'gmail':
      return {
        accent: 'rgba(120, 146, 196, 0.92)',
        rail: 'rgba(120, 146, 196, 0.2)',
        titleColor: '#5b6879',
        subtitleColor: '#8a96a6',
        pulseDuration: 2.1,
        driftDuration: 3.4,
        titleFallback: 'Checking inbox context',
        subtitle: 'Reviewing the most relevant email information.',
      };
    case 'calendar':
      return {
        accent: 'rgba(136, 156, 194, 0.86)',
        rail: 'rgba(136, 156, 194, 0.18)',
        titleColor: '#5e6977',
        subtitleColor: '#8d98a6',
        pulseDuration: 2.4,
        driftDuration: 3.8,
        titleFallback: 'Reviewing schedule context',
        subtitle: 'Looking at timing, availability, and time-sensitive details.',
      };
    case 'memory':
      return {
        accent: 'rgba(150, 158, 187, 0.84)',
        rail: 'rgba(150, 158, 187, 0.18)',
        titleColor: '#5d6876',
        subtitleColor: '#8d97a4',
        pulseDuration: 2.5,
        driftDuration: 4,
        titleFallback: 'Checking memory',
        subtitle: 'Looking for relevant context from earlier signals.',
      };
    case 'planning':
      return {
        accent: 'rgba(118, 140, 180, 0.9)',
        rail: 'rgba(118, 140, 180, 0.2)',
        titleColor: '#5a6675',
        subtitleColor: '#8b97a6',
        pulseDuration: 2.2,
        driftDuration: 3.6,
        titleFallback: 'Planning the response',
        subtitle: 'Choosing the clearest structure and next steps.',
      };
    case 'writing':
      return {
        accent: 'rgba(128, 148, 184, 0.92)',
        rail: 'rgba(128, 148, 184, 0.2)',
        titleColor: '#596574',
        subtitleColor: '#8995a4',
        pulseDuration: 1.9,
        driftDuration: 3.2,
        titleFallback: 'Writing the answer',
        subtitle: 'Preparing the final response for you.',
      };
    case 'finalizing':
      return {
        accent: 'rgba(170, 178, 196, 0.78)',
        rail: 'rgba(170, 178, 196, 0.14)',
        titleColor: '#64707e',
        subtitleColor: '#919aa7',
        pulseDuration: 2.8,
        driftDuration: 4.4,
        titleFallback: 'Finalizing response',
        subtitle: 'Polishing the output before showing it.',
      };
    case 'thinking':
    default:
      return {
        accent: 'rgba(130, 148, 186, 0.9)',
        rail: 'rgba(130, 148, 186, 0.18)',
        titleColor: '#5a6675',
        subtitleColor: '#8b97a5',
        pulseDuration: 2.3,
        driftDuration: 3.6,
        titleFallback: 'Analyzing your request',
        subtitle: 'Understanding intent, context, and the best response path.',
      };
  }
}

export function KivoThinkingState({
  status,
  visible = true,
  className = '',
  visualState = 'thinking',
}: KivoThinkingStateProps) {
  const config = useMemo(() => getVisualConfig(visualState), [visualState]);
  const title = useMemo(
    () => status?.trim() || config.titleFallback,
    [status, config.titleFallback],
  );

  return (
    <AnimatePresence initial={false}>
      {visible ? (
        <motion.div
          initial={{ opacity: 0, y: 6, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -4, filter: 'blur(4px)' }}
          transition={{ duration: 0.24, ease: 'easeOut' }}
          className={`w-full max-w-[760px] ${className}`}
          aria-live="polite"
          aria-label={title}
        >
          <div className="flex items-start gap-3.5">
            <div className="relative flex h-[44px] w-[16px] shrink-0 items-center justify-center">
              <motion.div
                className="absolute h-[36px] w-[2px] rounded-full"
                style={{ background: config.rail }}
                animate={{
                  opacity: [0.45, 0.85, 0.5, 0.72, 0.45],
                  scaleY: [0.92, 1, 0.95, 0.98, 0.92],
                }}
                transition={{
                  duration: config.driftDuration,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />

              <motion.div
                className="absolute h-[14px] w-[14px] rounded-full blur-[8px]"
                style={{ background: config.accent }}
                animate={{
                  opacity: [0.18, 0.34, 0.22, 0.28, 0.18],
                  y: [-7, 7, -4, 5, -7],
                  scale: [0.9, 1.08, 0.96, 1.02, 0.9],
                }}
                transition={{
                  duration: config.driftDuration,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />

              <motion.div
                className="absolute h-[7px] w-[7px] rounded-full"
                style={{ background: config.accent }}
                animate={{
                  opacity: [0.65, 1, 0.74, 0.9, 0.65],
                  y: [-7, 7, -4, 5, -7],
                  scale: [0.96, 1.14, 1, 1.08, 0.96],
                }}
                transition={{
                  duration: config.pulseDuration,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </div>

            <div className="min-w-0 pt-[1px]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={`${visualState}-${title}`}
                  initial={{ opacity: 0, y: 4, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -3, filter: 'blur(6px)' }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  <div
                    className="text-[16px] font-medium leading-[1.2] tracking-[-0.02em]"
                    style={{
                      color: config.titleColor,
                      fontFamily:
                        'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    }}
                  >
                    {title}
                  </div>

                  <p
                    className="mt-1.5 max-w-[620px] text-[13px] leading-[1.55] tracking-[-0.01em]"
                    style={{
                      color: config.subtitleColor,
                      fontFamily:
                        'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    }}
                  >
                    {config.subtitle}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
