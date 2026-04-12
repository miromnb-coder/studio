'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

export const KIVO_THINKING_PHASES = [
  'Understanding your goal',
  'Checking context',
  'Analyzing patterns',
  'Ranking best actions',
  'Preparing response',
] as const;

export type KivoThinkingIndicatorProps = {
  phase?: string;
  size?: number;
  showLabel?: boolean;
  compact?: boolean;
};

const MIN_SIZE = 24;
const MAX_SIZE = 34;
const PHASE_ROTATION_MS = 2400;

export function KivoThinkingIndicator({ phase, size = 28, showLabel = true, compact = false }: KivoThinkingIndicatorProps) {
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

  const intensity = 1 + (activePhaseIndex / (KIVO_THINKING_PHASES.length - 1)) * 0.2;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, filter: 'blur(2px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -5, filter: 'blur(1.5px)' }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={`flex items-center ${compact ? 'gap-2.5' : 'gap-3'} rounded-2xl border border-white/12 bg-white/[0.04] ${compact ? 'px-2.5 py-2' : 'px-3 py-2.5'} shadow-[0_12px_30px_rgba(0,0,0,0.32)] backdrop-blur-xl`}
    >
      <motion.div
        aria-hidden="true"
        className="relative shrink-0 transform-gpu"
        style={{ width: normalizedSize, height: normalizedSize }}
        animate={prefersReducedMotion ? undefined : { rotate: [0, 8, 0, -8, 0] }}
        transition={{ duration: 16, ease: 'linear', repeat: Infinity }}
      >
        <motion.div
          className="absolute inset-[-24%] transform-gpu rounded-[42%] bg-[radial-gradient(circle_at_38%_34%,rgba(157,232,255,0.5)_0%,rgba(78,177,255,0.24)_38%,rgba(12,25,60,0)_78%)] blur-[7px]"
          animate={
            prefersReducedMotion
              ? { opacity: 0.62 * intensity }
              : {
                  opacity: [0.5 * intensity, 0.78 * intensity, 0.56 * intensity],
                  scale: [0.95, 1.08, 0.98],
                  borderRadius: ['42% 58% 56% 44% / 48% 42% 58% 52%', '56% 44% 40% 60% / 52% 58% 42% 48%', '42% 58% 56% 44% / 48% 42% 58% 52%'],
                }
          }
          transition={{ duration: 5.2, ease: 'easeInOut', repeat: Infinity }}
        />

        <motion.div
          className="absolute inset-[18%] transform-gpu rounded-[38%] bg-[radial-gradient(circle_at_35%_30%,rgba(230,249,255,0.95)_0%,rgba(100,209,255,0.92)_36%,rgba(46,131,255,0.85)_70%,rgba(17,48,124,0.78)_100%)] shadow-[0_0_14px_rgba(72,173,255,0.55),inset_0_0_18px_rgba(212,244,255,0.34)]"
          animate={
            prefersReducedMotion
              ? { opacity: 0.95 }
              : {
                  scale: [1, 1.06, 0.98, 1],
                  opacity: [0.88, 1, 0.9, 0.95],
                  borderRadius: ['38% 62% 54% 46% / 42% 48% 52% 58%', '52% 48% 44% 56% / 55% 45% 55% 45%', '38% 62% 54% 46% / 42% 48% 52% 58%'],
                }
          }
          transition={{ duration: 3.4, ease: 'easeInOut', repeat: Infinity }}
        />

        <motion.div
          className="absolute inset-[34%] transform-gpu rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.9)_0%,rgba(189,238,255,0.78)_32%,rgba(130,204,255,0)_76%)] blur-[1.5px]"
          animate={
            prefersReducedMotion
              ? { opacity: 0.7 }
              : {
                  scale: [0.85, 1.18, 0.92, 0.85],
                  opacity: [0.45, 0.95, 0.5, 0.45],
                }
          }
          transition={{ duration: 2.3, ease: 'easeInOut', repeat: Infinity, repeatDelay: 0.5 }}
        />
      </motion.div>

      {showLabel ? (
        <div className="min-h-5 overflow-hidden pr-1">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={activePhase}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              className={`${compact ? 'text-sm' : 'text-[15px]'} font-medium tracking-[-0.01em] text-zinc-300`}
            >
              {activePhase}
            </motion.p>
          </AnimatePresence>
        </div>
      ) : null}
    </motion.div>
  );
}
