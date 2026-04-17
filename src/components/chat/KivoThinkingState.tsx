'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

export type KivoThinkingVisualState =
  | 'thinking'
  | 'gmail'
  | 'calendar'
  | 'memory'
  | 'planning'
  | 'writing'
  | 'finalizing';

type KivoThinkingStateProps = {
  active?: boolean;
  status?: string;
  visualState?: KivoThinkingVisualState;
  className?: string;
  messages?: string[];
  intervalMs?: number;
};

const DEFAULT_MESSAGES = [
  'Thinking...',
  'Checking inbox...',
  'Reading schedule...',
  'Searching memory...',
  'Building plan...',
  'Writing response...',
  'Finalizing...',
];

type VisualRecipe = {
  accent: string;
  secondary: string;
  ribbonOpacity: number;
  glow: string;
  pulseDuration: number;
  driftDuration: number;
  spinDuration: number;
  textColor: string;
};

const VISUAL_RECIPES: Record<KivoThinkingVisualState, VisualRecipe> = {
  thinking: {
    accent: '#e8ecf8',
    secondary: '#9ca9c2',
    ribbonOpacity: 0.82,
    glow: 'rgba(191, 206, 232, 0.32)',
    pulseDuration: 5.4,
    driftDuration: 8.4,
    spinDuration: 22,
    textColor: '#6f7785',
  },
  gmail: {
    accent: '#c8ddff',
    secondary: '#77a6f9',
    ribbonOpacity: 0.9,
    glow: 'rgba(110, 169, 255, 0.42)',
    pulseDuration: 4.2,
    driftDuration: 6.2,
    spinDuration: 16,
    textColor: '#61769a',
  },
  calendar: {
    accent: '#d8e3f5',
    secondary: '#9bb3d7',
    ribbonOpacity: 0.76,
    glow: 'rgba(173, 192, 224, 0.3)',
    pulseDuration: 6.2,
    driftDuration: 10,
    spinDuration: 26,
    textColor: '#6f7f97',
  },
  memory: {
    accent: '#ccd6f4',
    secondary: '#8e9ecc',
    ribbonOpacity: 0.88,
    glow: 'rgba(160, 177, 231, 0.42)',
    pulseDuration: 5.9,
    driftDuration: 9.5,
    spinDuration: 24,
    textColor: '#6f7690',
  },
  planning: {
    accent: '#edf2ff',
    secondary: '#94a7ce',
    ribbonOpacity: 0.92,
    glow: 'rgba(157, 179, 222, 0.38)',
    pulseDuration: 4.9,
    driftDuration: 7.3,
    spinDuration: 18,
    textColor: '#5f6f89',
  },
  writing: {
    accent: '#dbe5ff',
    secondary: '#86a8ee',
    ribbonOpacity: 0.89,
    glow: 'rgba(128, 170, 246, 0.4)',
    pulseDuration: 3.9,
    driftDuration: 6.1,
    spinDuration: 14,
    textColor: '#5e7395',
  },
  finalizing: {
    accent: '#e8edf9',
    secondary: '#a2adbf',
    ribbonOpacity: 0.72,
    glow: 'rgba(180, 190, 209, 0.25)',
    pulseDuration: 7.1,
    driftDuration: 11,
    spinDuration: 30,
    textColor: '#7a8291',
  },
};

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

function ThinkingOrb({
  reducedMotion,
  visualState,
}: {
  reducedMotion: boolean;
  visualState: KivoThinkingVisualState;
}) {
  const recipe = VISUAL_RECIPES[visualState];

  return (
    <motion.div
      aria-hidden="true"
      className="relative h-[70px] w-[70px] shrink-0 sm:h-[78px] sm:w-[78px]"
      animate={
        reducedMotion
          ? undefined
          : {
              rotate: [0, 360],
              y: [0, -1.4, 0],
            }
      }
      transition={
        reducedMotion
          ? undefined
          : {
              rotate: {
                duration: recipe.spinDuration,
                ease: 'linear',
                repeat: Infinity,
              },
              y: {
                duration: recipe.driftDuration,
                ease: 'easeInOut',
                repeat: Infinity,
              },
            }
      }
      style={{ filter: `drop-shadow(0 6px 18px ${recipe.glow})` }}
    >
      <motion.div
        className="absolute inset-[-24%] rounded-full blur-2xl"
        style={{ backgroundColor: recipe.glow }}
        animate={
          reducedMotion
            ? { opacity: 0.5 }
            : {
                opacity: [0.3, 0.62, 0.34],
                scale: [0.92, 1.06, 0.96],
              }
        }
        transition={{
          duration: recipe.pulseDuration,
          ease: 'easeInOut',
          repeat: Infinity,
        }}
      />

      <svg
        viewBox="0 0 160 160"
        className="relative h-full w-full overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="kivo-orb-soft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.1" />
          </filter>

          <linearGradient id="kivo-ribbon-gradient" x1="18" y1="26" x2="142" y2="138" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={recipe.accent} stopOpacity="0.96" />
            <stop offset="34%" stopColor={recipe.secondary} stopOpacity={recipe.ribbonOpacity} />
            <stop offset="70%" stopColor={recipe.accent} stopOpacity="0.76" />
            <stop offset="100%" stopColor="#f8f9ff" stopOpacity="0.86" />
          </linearGradient>

          <radialGradient id="kivo-ribbon-shade" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(80 80) rotate(90) scale(68)">
            <stop offset="0%" stopColor="#080910" stopOpacity="0.34" />
            <stop offset="68%" stopColor="#0f1424" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#0c101a" stopOpacity="0" />
          </radialGradient>
        </defs>

        {[0, 72, 144, 216, 288].map((angle, index) => (
          <motion.g
            key={angle}
            style={{ transformOrigin: '80px 80px' }}
            animate={
              reducedMotion
                ? undefined
                : {
                    rotate: [angle, angle + (index % 2 === 0 ? 8 : -7), angle],
                    scale: [1, 1.016, 1],
                  }
            }
            transition={{
              duration: recipe.driftDuration + index * 0.65,
              ease: 'easeInOut',
              repeat: Infinity,
            }}
          >
            <path
              d="M80 20C102 20 122 31 134 50C145 66 146 88 134 105C123 122 104 136 80 140C57 136 37 123 26 106C15 89 15 66 26 50C37 31 57 20 80 20ZM80 47C67 48 55 55 48 66C40 78 40 92 48 103C56 114 67 120 80 121C93 120 105 114 112 103C120 92 120 78 112 66C105 55 93 48 80 47Z"
              fill="url(#kivo-ribbon-gradient)"
              fillOpacity={0.22 + index * 0.04}
              transform={`rotate(${angle} 80 80)`}
            />
          </motion.g>
        ))}

        <circle cx="80" cy="80" r="42" fill="#020307" fillOpacity="0.82" />
        <circle cx="80" cy="80" r="42" fill="url(#kivo-ribbon-shade)" filter="url(#kivo-orb-soft)" />
      </svg>
    </motion.div>
  );
}

export function KivoThinkingState({
  active = true,
  status,
  className,
  messages = DEFAULT_MESSAGES,
  intervalMs = 1900,
  visualState = 'thinking',
}: KivoThinkingStateProps) {
  const reducedMotion = useReducedMotion();
  const safeMessages = useMemo(
    () => (messages.length ? messages : DEFAULT_MESSAGES),
    [messages]
  );
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!active || status || safeMessages.length <= 1) return;

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % safeMessages.length);
    }, reducedMotion ? Math.max(intervalMs, 2600) : intervalMs);

    return () => window.clearInterval(timer);
  }, [active, status, safeMessages, intervalMs, reducedMotion]);

  useEffect(() => {
    if (!active) setIndex(0);
  }, [active]);

  if (!active) return null;

  const currentStatus = status || safeMessages[index] || DEFAULT_MESSAGES[0];
  const recipe = VISUAL_RECIPES[visualState];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={cn('flex items-center gap-4 py-2', className)}
    >
      <ThinkingOrb reducedMotion={Boolean(reducedMotion)} visualState={visualState} />

      <div className="min-w-0">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={currentStatus}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: reducedMotion ? 0.14 : 0.28, ease: 'easeOut' }}
            className="text-[18px] font-medium leading-[1.4] tracking-[-0.015em] sm:text-[19px]"
            style={{
              color: recipe.textColor,
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", "Segoe UI", sans-serif',
            }}
          >
            {currentStatus}
          </motion.p>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default KivoThinkingState;
