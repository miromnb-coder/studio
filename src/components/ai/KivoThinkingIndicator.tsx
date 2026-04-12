'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

export const KIVO_THINKING_PHASES = [
  'Understanding your request',
  'Checking your context',
  'Reviewing subscriptions',
  'Finding highest-impact savings',
  'Ranking best next actions',
  'Preparing recommendation',
] as const;

export type KivoThinkingIndicatorProps = {
  phase?: string;
  detail?: string;
  size?: number;
  showLabel?: boolean;
  compact?: boolean;
};

const MIN_SIZE = 24;
const MAX_SIZE = 38;
const PHASE_ROTATION_MS = 2600;

export function KivoThinkingIndicator({
  phase,
  detail,
  size = 28,
  showLabel = true,
  compact = false,
}: KivoThinkingIndicatorProps) {
  const prefersReducedMotion = useReducedMotion();
  const normalizedSize = Math.min(MAX_SIZE, Math.max(MIN_SIZE, size));
  const hasPhase = Boolean(phase?.trim());
  const [phaseIndex, setPhaseIndex] = useState(0);

  useEffect(() => {
    if (hasPhase || prefersReducedMotion) return;

    const interval = window.setInterval(() => {
      setPhaseIndex((previous) => (previous + 1) % KIVO_THINKING_PHASES.length);
    }, PHASE_ROTATION_MS);

    return () => window.clearInterval(interval);
  }, [hasPhase, prefersReducedMotion]);

  const activePhase = hasPhase ? phase!.trim() : KIVO_THINKING_PHASES[phaseIndex];

  const activePhaseIndex = useMemo(() => {
    if (!hasPhase) return phaseIndex;

    const normalizedPhase = activePhase.toLowerCase();
    const matchedIndex = KIVO_THINKING_PHASES.findIndex((candidate) =>
      normalizedPhase.includes(candidate.toLowerCase()),
    );

    return matchedIndex >= 0 ? matchedIndex : phaseIndex;
  }, [activePhase, hasPhase, phaseIndex]);

  const phaseProgress =
    KIVO_THINKING_PHASES.length > 1
      ? activePhaseIndex / (KIVO_THINKING_PHASES.length - 1)
      : 0;

  const auraOpacity = 0.5 + phaseProgress * 0.16;
  const coreOpacity = 0.86 + phaseProgress * 0.1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.985, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -8, scale: 0.99, filter: 'blur(4px)' }}
      transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
      className={[
        'relative overflow-hidden',
        compact ? 'rounded-[21px] px-3.5 py-3' : 'rounded-[24px] px-4.5 py-4',
        'border border-white/[0.03]',
        'bg-[linear-gradient(180deg,rgba(255,255,255,0.032),rgba(255,255,255,0.012))]',
        'shadow-[0_12px_32px_rgba(0,0,0,0.28)]',
        'backdrop-blur-[18px]',
      ].join(' ')}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-px rounded-[inherit] border border-white/[0.018]"
      />

      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.035),transparent_46%)]"
      />

      <div className={`relative flex items-center ${compact ? 'gap-3' : 'gap-3.5'}`}>
        <motion.div
          aria-hidden="true"
          className="relative shrink-0 transform-gpu"
          style={{ width: normalizedSize, height: normalizedSize }}
          animate={
            prefersReducedMotion
              ? undefined
              : {
                  rotate: [0, 3, 0, -2.5, 0],
                }
          }
          transition={{
            duration: 22,
            ease: 'linear',
            repeat: Infinity,
          }}
        >
          <motion.div
            className="absolute inset-[-46%] transform-gpu blur-[17px]"
            style={{
              background:
                'radial-gradient(circle at 44% 40%, rgba(140,220,255,0.36) 0%, rgba(82,158,255,0.18) 44%, rgba(15,25,52,0) 84%)',
            }}
            animate={
              prefersReducedMotion
                ? { opacity: auraOpacity }
                : {
                    opacity: [0.36 * auraOpacity, 0.62 * auraOpacity, 0.4 * auraOpacity],
                    scale: [0.95, 1.08, 0.97],
                    borderRadius: [
                      '48% 52% 54% 46% / 52% 46% 54% 48%',
                      '55% 45% 46% 54% / 44% 56% 46% 54%',
                      '46% 54% 58% 42% / 50% 48% 52% 50%',
                      '48% 52% 54% 46% / 52% 46% 54% 48%',
                    ],
                  }
            }
            transition={{
              duration: 8.6,
              ease: 'easeInOut',
              repeat: Infinity,
            }}
          />

          <motion.div
            className="absolute inset-[-34%] transform-gpu blur-[12px]"
            style={{
              background:
                'radial-gradient(circle at 60% 56%, rgba(117,194,255,0.22) 0%, rgba(52,123,225,0.1) 48%, rgba(16,31,72,0) 82%)',
            }}
            animate={
              prefersReducedMotion
                ? { opacity: 0.28 }
                : {
                    opacity: [0.22, 0.38, 0.26],
                    scale: [1.02, 0.95, 1.02],
                    rotate: [0, -4, 2, 0],
                    borderRadius: [
                      '56% 44% 48% 52% / 48% 56% 44% 52%',
                      '44% 56% 54% 46% / 54% 42% 58% 46%',
                      '52% 48% 44% 56% / 46% 54% 46% 54%',
                      '56% 44% 48% 52% / 48% 56% 44% 52%',
                    ],
                  }
            }
            transition={{
              duration: 10.8,
              ease: 'easeInOut',
              repeat: Infinity,
            }}
          />

          <motion.div
            className="absolute inset-[11%] transform-gpu"
            style={{
              background:
                'radial-gradient(circle at 34% 30%, rgba(244,252,255,0.96) 0%, rgba(174,236,255,0.86) 32%, rgba(95,166,255,0.78) 62%, rgba(24,52,120,0.64) 100%)',
              boxShadow:
                '0 0 20px rgba(72,154,248,0.28), inset 0 0 16px rgba(227,247,255,0.16)',
            }}
            animate={
              prefersReducedMotion
                ? {
                    opacity: coreOpacity,
                    borderRadius: '48% 52% 53% 47% / 46% 52% 48% 54%',
                  }
                : {
                    scale: [0.985, 1.035, 0.995, 0.985],
                    opacity: [0.84 * coreOpacity, 1 * coreOpacity, 0.9 * coreOpacity, 0.84 * coreOpacity],
                    borderRadius: [
                      '44% 56% 54% 46% / 44% 50% 50% 56%',
                      '53% 47% 46% 54% / 56% 44% 54% 46%',
                      '47% 53% 58% 42% / 50% 46% 54% 50%',
                      '44% 56% 54% 46% / 44% 50% 50% 56%',
                    ],
                  }
            }
            transition={{
              duration: 5.7,
              ease: 'easeInOut',
              repeat: Infinity,
            }}
          />

          <motion.div
            className="absolute inset-[24%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.86)_0%,rgba(214,243,255,0.62)_36%,rgba(145,214,255,0.14)_62%,rgba(145,214,255,0)_78%)] blur-[1.8px]"
            animate={
              prefersReducedMotion
                ? { opacity: 0.72 }
                : {
                    scale: [0.82, 1.1, 0.9, 0.82],
                    opacity: [0.28, 0.7, 0.4, 0.28],
                  }
            }
            transition={{
              duration: 3.8,
              ease: 'easeInOut',
              repeat: Infinity,
              repeatDelay: 0.35,
            }}
          />

          <motion.div
            className="absolute inset-[33%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.95)_0%,rgba(220,247,255,0.88)_42%,rgba(220,247,255,0)_74%)] blur-[0.8px]"
            animate={
              prefersReducedMotion
                ? { opacity: 0.92 }
                : {
                    scale: [0.95, 1.03, 0.98, 0.95],
                    opacity: [0.82, 1, 0.88, 0.82],
                  }
            }
            transition={{
              duration: 2.8,
              ease: 'easeInOut',
              repeat: Infinity,
            }}
          />
        </motion.div>

        {showLabel ? (
          <div className="min-w-0">
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={activePhase}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                className={[
                  compact ? 'text-[14.5px]' : 'text-[15.5px]',
                  'truncate font-medium leading-tight tracking-[-0.014em] text-zinc-100/94',
                ].join(' ')}
              >
                {activePhase}
              </motion.p>
            </AnimatePresence>

            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={detail || 'default-detail'}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -3 }}
                transition={{
                  duration: 0.3,
                  ease: [0.22, 1, 0.36, 1],
                  delay: 0.03,
                }}
                className="mt-0.5 truncate text-[11.5px] leading-5 text-zinc-500"
              >
                {detail || 'Reviewing subscriptions and recurring costs'}
              </motion.p>
            </AnimatePresence>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}
