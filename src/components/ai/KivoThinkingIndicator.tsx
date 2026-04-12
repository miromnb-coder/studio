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
        compact ? 'rounded-[22px] px-4 py-3.5' : 'rounded-[26px] px-5 py-4.5',
        'border border-white/[0.045]',
        'bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.018))]',
        'shadow-[0_16px_42px_rgba(0,0,0,0.34)]',
        'backdrop-blur-[22px]',
      ].join(' ')}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-px rounded-[inherit] border border-white/[0.028]"
      />

      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.055),transparent_42%)]"
      />

      <div className={`relative flex items-center ${compact ? 'gap-3.5' : 'gap-4'}`}>
        <motion.div
          aria-hidden="true"
          className="relative shrink-0 transform-gpu"
          style={{ width: normalizedSize, height: normalizedSize }}
          animate={
            prefersReducedMotion
              ? undefined
              : {
                  rotate: [0, 7, 0, -7, 0],
                }
          }
          transition={{
            duration: 16,
            ease: 'linear',
            repeat: Infinity,
          }}
        >
          <motion.div
            className="absolute inset-[-42%] transform-gpu blur-[14px]"
            style={{
              background:
                'radial-gradient(circle at 40% 38%, rgba(138,221,255,0.48) 0%, rgba(71,154,255,0.24) 42%, rgba(15,25,52,0) 82%)',
            }}
            animate={
              prefersReducedMotion
                ? { opacity: auraOpacity }
                : {
                    opacity: [0.38 * auraOpacity, 0.72 * auraOpacity, 0.44 * auraOpacity],
                    scale: [0.94, 1.12, 0.98],
                    borderRadius: [
                      '42% 58% 52% 48% / 50% 44% 56% 50%',
                      '56% 44% 46% 54% / 42% 58% 44% 56%',
                      '48% 52% 58% 42% / 52% 48% 52% 48%',
                      '42% 58% 52% 48% / 50% 44% 56% 50%',
                    ],
                  }
            }
            transition={{
              duration: 7.2,
              ease: 'easeInOut',
              repeat: Infinity,
            }}
          />

          <motion.div
            className="absolute inset-[10%] transform-gpu"
            style={{
              background:
                'radial-gradient(circle at 34% 28%, rgba(244,252,255,0.98) 0%, rgba(162,231,255,0.92) 30%, rgba(89,163,255,0.88) 62%, rgba(20,49,118,0.74) 100%)',
              boxShadow:
                '0 0 22px rgba(76,168,255,0.38), inset 0 0 18px rgba(221,246,255,0.2)',
            }}
            animate={
              prefersReducedMotion
                ? {
                    opacity: coreOpacity,
                    borderRadius: '48% 52% 54% 46% / 46% 52% 48% 54%',
                  }
                : {
                    scale: [0.98, 1.05, 0.99, 0.98],
                    opacity: [0.82 * coreOpacity, 1 * coreOpacity, 0.88 * coreOpacity, 0.82 * coreOpacity],
                    borderRadius: [
                      '40% 60% 55% 45% / 42% 48% 52% 58%',
                      '54% 46% 44% 56% / 58% 42% 56% 44%',
                      '46% 54% 60% 40% / 50% 46% 54% 50%',
                      '40% 60% 55% 45% / 42% 48% 52% 58%',
                    ],
                  }
            }
            transition={{
              duration: 4.8,
              ease: 'easeInOut',
              repeat: Infinity,
            }}
          />

          <motion.div
            className="absolute inset-[24%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.92)_0%,rgba(210,243,255,0.74)_34%,rgba(145,214,255,0.16)_62%,rgba(145,214,255,0)_76%)] blur-[1.6px]"
            animate={
              prefersReducedMotion
                ? { opacity: 0.72 }
                : {
                    scale: [0.78, 1.18, 0.88, 0.78],
                    opacity: [0.3, 0.86, 0.42, 0.3],
                  }
            }
            transition={{
              duration: 2.9,
              ease: 'easeInOut',
              repeat: Infinity,
              repeatDelay: 0.25,
            }}
          />

          <motion.div
            className="absolute inset-[33%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.98)_0%,rgba(220,247,255,0.95)_42%,rgba(220,247,255,0)_74%)] blur-[0.6px]"
            animate={
              prefersReducedMotion
                ? { opacity: 0.92 }
                : {
                    scale: [0.94, 1.04, 0.97, 0.94],
                    opacity: [0.86, 1, 0.9, 0.86],
                  }
            }
            transition={{
              duration: 2.2,
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
                  compact ? 'text-[15px]' : 'text-[16px]',
                  'truncate font-semibold leading-tight tracking-[-0.018em] text-zinc-100',
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
                className="mt-1 truncate text-[12px] leading-5 text-zinc-400"
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
