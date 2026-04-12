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

const MIN_SIZE = 26;
const MAX_SIZE = 40;
const PHASE_ROTATION_MS = 2800;

export function KivoThinkingIndicator({ phase, detail, size = 30, showLabel = true, compact = false }: KivoThinkingIndicatorProps) {
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
    const fallbackIndex = phaseIndex;
    if (!hasPhase) return fallbackIndex;

    const normalizedPhase = activePhase.toLowerCase();
    const matchedIndex = KIVO_THINKING_PHASES.findIndex((candidate) => normalizedPhase.includes(candidate.toLowerCase()));
    return matchedIndex >= 0 ? matchedIndex : fallbackIndex;
  }, [activePhase, hasPhase, phaseIndex]);

  const intensity = 0.94 + (activePhaseIndex / (KIVO_THINKING_PHASES.length - 1)) * 0.18;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
      transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
      className={`relative overflow-hidden rounded-[24px] border border-white/[0.08] bg-[linear-gradient(145deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] ${compact ? 'px-4 py-3.5' : 'px-5 py-4'} shadow-[0_18px_45px_rgba(0,0,0,0.38)] backdrop-blur-2xl`}
    >
      <span className="pointer-events-none absolute inset-[1px] rounded-[23px] border border-white/[0.06]" aria-hidden="true" />
      <div className={`relative flex items-center ${compact ? 'gap-3.5' : 'gap-4'}`}>
        <motion.div
          aria-hidden="true"
          className="relative shrink-0 transform-gpu"
          style={{ width: normalizedSize, height: normalizedSize }}
          animate={prefersReducedMotion ? undefined : { rotate: [0, 5, 0, -5, 0] }}
          transition={{ duration: 18, ease: 'linear', repeat: Infinity }}
        >
          <motion.div
            className="absolute inset-[-36%] transform-gpu rounded-[46%] bg-[radial-gradient(circle_at_38%_34%,rgba(132,222,255,0.5)_0%,rgba(52,139,255,0.27)_44%,rgba(12,25,60,0)_80%)] blur-[11px]"
            animate={
              prefersReducedMotion
                ? { opacity: 0.58 * intensity }
                : {
                    opacity: [0.44 * intensity, 0.72 * intensity, 0.48 * intensity],
                    scale: [0.94, 1.1, 0.98],
                    borderRadius: ['44% 56% 52% 48% / 52% 46% 54% 48%', '58% 42% 45% 55% / 46% 57% 43% 54%', '44% 56% 52% 48% / 52% 46% 54% 48%'],
                  }
            }
            transition={{ duration: 6.6, ease: 'easeInOut', repeat: Infinity }}
          />

          <motion.div
            className="absolute inset-[17%] transform-gpu rounded-[40%] bg-[radial-gradient(circle_at_33%_28%,rgba(234,251,255,0.98)_0%,rgba(126,220,255,0.94)_32%,rgba(58,145,255,0.9)_68%,rgba(16,45,118,0.82)_100%)] shadow-[0_0_22px_rgba(70,162,255,0.6),inset_0_0_22px_rgba(210,244,255,0.32)]"
            animate={
              prefersReducedMotion
                ? { opacity: 0.96 }
                : {
                    scale: [0.98, 1.06, 0.99, 0.98],
                    opacity: [0.86, 1, 0.9, 0.86],
                    borderRadius: ['36% 64% 56% 44% / 42% 48% 52% 58%', '54% 46% 43% 57% / 58% 42% 58% 42%', '36% 64% 56% 44% / 42% 48% 52% 58%'],
                  }
            }
            transition={{ duration: 4.2, ease: 'easeInOut', repeat: Infinity }}
          />

          <motion.div
            className="absolute inset-[36%] transform-gpu rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.95)_0%,rgba(196,239,255,0.88)_36%,rgba(130,204,255,0)_78%)] blur-[1.4px]"
            animate={
              prefersReducedMotion
                ? { opacity: 0.66 }
                : {
                    scale: [0.86, 1.22, 0.9, 0.86],
                    opacity: [0.38, 0.92, 0.5, 0.38],
                  }
            }
            transition={{ duration: 2.8, ease: 'easeInOut', repeat: Infinity, repeatDelay: 0.4 }}
          />
        </motion.div>

        {showLabel ? (
          <div className="min-w-0">
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={activePhase}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className={`${compact ? 'text-[15px]' : 'text-base'} truncate font-semibold leading-tight tracking-[-0.015em] text-zinc-100`}
              >
                {activePhase}
              </motion.p>
            </AnimatePresence>
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={detail || 'default-detail'}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1], delay: 0.04 }}
                className="mt-1 truncate text-xs leading-5 text-zinc-400"
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
