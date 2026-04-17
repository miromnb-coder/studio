'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

export type KivoThinkingVisualState =
  | 'thinking'
  | 'memory'
  | 'planning'
  | 'writing'
  | 'finalizing'
  | 'gmail'
  | 'calendar';

type KivoThinkingStateProps = {
  status: string;
  visualState: KivoThinkingVisualState;
  className?: string;
};

const FALLBACK_PHASES: Record<KivoThinkingVisualState, string[]> = {
  thinking: ['Understanding your request…', 'Analyzing options…'],
  memory: ['Reviewing context…', 'Connecting your history…'],
  planning: ['Building a plan…', 'Organizing priorities…'],
  writing: ['Preparing the best answer…', 'Structuring the response…'],
  finalizing: ['Finalizing response…', 'Polishing final details…'],
  gmail: ['Checking inbox…', 'Sorting important updates…'],
  calendar: ['Reviewing schedule…', 'Organizing priorities…'],
};

const DETAIL_ROTATION_MS = 2600;
const DOT_ROTATION_MS = 1800;
const RING_MASK =
  'radial-gradient(farthest-side, transparent calc(100% - 14px), #000 calc(100% - 13px))';

function cn(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(' ');
}

export function KivoThinkingState({
  status,
  visualState,
  className,
}: KivoThinkingStateProps) {
  const prefersReducedMotion = useReducedMotion();
  const [helperIndex, setHelperIndex] = useState(0);
  const [dotCount, setDotCount] = useState(1);

  const phaseSet = useMemo(
    () => FALLBACK_PHASES[visualState] ?? FALLBACK_PHASES.thinking,
    [visualState],
  );

  const primaryText = status?.trim() || phaseSet[0];

  useEffect(() => {
    if (prefersReducedMotion || phaseSet.length <= 1) return;

    const interval = window.setInterval(() => {
      setHelperIndex((current) => (current + 1) % phaseSet.length);
    }, DETAIL_ROTATION_MS);

    return () => window.clearInterval(interval);
  }, [phaseSet, prefersReducedMotion]);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const interval = window.setInterval(() => {
      setDotCount((current) => (current % 3) + 1);
    }, DOT_ROTATION_MS);

    return () => window.clearInterval(interval);
  }, [prefersReducedMotion]);

  return (
    <motion.section
      layout
      initial={{ opacity: 0, y: 10, scale: 0.992, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -8, scale: 0.995, filter: 'blur(2px)' }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'relative w-full overflow-hidden rounded-[26px] border border-[#edf2f8] bg-[linear-gradient(180deg,#ffffff_0%,#f7fafe_100%)] p-4 shadow-[0_14px_42px_rgba(114,142,192,0.12)] sm:p-5',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_25%,rgba(187,223,255,0.26)_0%,rgba(187,223,255,0)_46%)]"
      />

      <div className="relative flex items-center gap-4 sm:gap-5">
        <motion.div
          aria-hidden="true"
          className="relative h-[68px] w-[68px] shrink-0 sm:h-[78px] sm:w-[78px]"
          animate={
            prefersReducedMotion
              ? undefined
              : { rotate: [0, 360], scale: [1, 1.015, 1], y: [0, -1, 0] }
          }
          transition={{
            rotate: { duration: 16, ease: 'linear', repeat: Infinity },
            scale: { duration: 6.4, ease: 'easeInOut', repeat: Infinity },
            y: { duration: 4.6, ease: 'easeInOut', repeat: Infinity },
          }}
        >
          <motion.div
            className="absolute inset-[-22%] rounded-full blur-[18px]"
            style={{
              background:
                'radial-gradient(circle at 48% 44%, rgba(103,184,255,0.34) 0%, rgba(131,219,255,0.2) 40%, rgba(115,173,255,0) 76%)',
            }}
            animate={
              prefersReducedMotion
                ? { opacity: 0.6 }
                : { opacity: [0.36, 0.66, 0.44], scale: [0.92, 1.08, 0.95] }
            }
            transition={{ duration: 5.8, ease: 'easeInOut', repeat: Infinity }}
          />

          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                'conic-gradient(from 22deg, rgba(181,238,255,0.88), rgba(88,175,255,0.95), rgba(58,120,243,0.86), rgba(145,228,255,0.92), rgba(181,238,255,0.88))',
              WebkitMaskImage: RING_MASK,
              maskImage: RING_MASK,
            }}
            animate={
              prefersReducedMotion
                ? { borderRadius: '50%' }
                : {
                    rotate: [0, 360],
                    borderRadius: [
                      '49% 51% 53% 47% / 50% 48% 52% 50%',
                      '53% 47% 48% 52% / 46% 55% 45% 54%',
                      '47% 53% 56% 44% / 52% 46% 54% 48%',
                      '49% 51% 53% 47% / 50% 48% 52% 50%',
                    ],
                  }
            }
            transition={{
              rotate: { duration: 9.5, ease: 'linear', repeat: Infinity },
              borderRadius: { duration: 7.6, ease: 'easeInOut', repeat: Infinity },
            }}
          />

          <motion.div
            className="absolute inset-[5%] rounded-full"
            style={{
              background:
                'conic-gradient(from 224deg, rgba(205,248,255,0.64), rgba(124,213,255,0.74), rgba(52,109,236,0.62), rgba(166,240,255,0.66), rgba(205,248,255,0.64))',
              WebkitMaskImage: RING_MASK,
              maskImage: RING_MASK,
              filter: 'blur(0.9px)',
            }}
            animate={
              prefersReducedMotion
                ? undefined
                : { rotate: [360, 0], scale: [1.02, 0.98, 1.02] }
            }
            transition={{
              rotate: { duration: 12.6, ease: 'linear', repeat: Infinity },
              scale: { duration: 6, ease: 'easeInOut', repeat: Infinity },
            }}
          />

          <div className="absolute inset-[22%] rounded-full bg-[radial-gradient(circle,#f6fbff_0%,#e9f3ff_74%,#d9e9ff_100%)] shadow-[inset_0_2px_5px_rgba(255,255,255,0.78)]" />
        </motion.div>

        <div className="min-w-0">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={`${primaryText}-${dotCount}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.26, ease: 'easeOut' }}
              className="truncate text-[26px] font-normal leading-[1.16] tracking-[-0.026em] text-[#6d7380] sm:text-[54px]"
              style={{
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", "Segoe UI", sans-serif',
              }}
            >
              {prefersReducedMotion ? primaryText : `${primaryText.replace(/…|\.{3}$/u, '')}${'.'.repeat(dotCount)}`}
            </motion.p>
          </AnimatePresence>

          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={`${visualState}-${helperIndex}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              className="mt-1.5 text-[13.5px] font-medium tracking-[-0.01em] text-[#97a4b5] sm:text-[14px]"
              style={{
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", "Segoe UI", sans-serif',
              }}
            >
              {phaseSet[helperIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </motion.section>
  );
}
