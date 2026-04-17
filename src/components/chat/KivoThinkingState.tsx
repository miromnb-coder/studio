
'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

type KivoThinkingStateProps = {
  active?: boolean;
  status?: string;
  className?: string;
  messages?: string[];
  intervalMs?: number;
  label?: string;
};

const DEFAULT_MESSAGES = [
  'Understanding your request…',
  'Reviewing context…',
  'Checking inbox…',
  'Analyzing options…',
  'Building a plan…',
  'Organizing priorities…',
  'Preparing the best answer…',
  'Finalizing response…',
];

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

function ThinkingOrb({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <motion.div
      aria-hidden="true"
      className="relative h-20 w-20 shrink-0 sm:h-24 sm:w-24"
      animate={
        reducedMotion
          ? undefined
          : {
              rotate: [0, 180, 360],
              scale: [1, 1.015, 0.99, 1],
            }
      }
      transition={
        reducedMotion
          ? undefined
          : {
              rotate: {
                duration: 18,
                ease: 'linear',
                repeat: Infinity,
              },
              scale: {
                duration: 5.5,
                ease: 'easeInOut',
                repeat: Infinity,
              },
            }
      }
    >
      <svg
        viewBox="0 0 160 160"
        className="h-full w-full overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="kivo-thinking-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="9" />
          </filter>

          <filter id="kivo-thinking-soft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.6" />
          </filter>

          <linearGradient id="kivo-thinking-band-a" x1="18" y1="28" x2="136" y2="136" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0A0A0A" stopOpacity="0.18" />
            <stop offset="22%" stopColor="#1A1A1A" stopOpacity="0.82" />
            <stop offset="52%" stopColor="#505050" stopOpacity="0.94" />
            <stop offset="78%" stopColor="#141414" stopOpacity="0.86" />
            <stop offset="100%" stopColor="#050505" stopOpacity="0.22" />
          </linearGradient>

          <linearGradient id="kivo-thinking-band-b" x1="128" y1="24" x2="34" y2="142" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#060606" stopOpacity="0.14" />
            <stop offset="25%" stopColor="#202020" stopOpacity="0.76" />
            <stop offset="55%" stopColor="#6A6A6A" stopOpacity="0.9" />
            <stop offset="82%" stopColor="#171717" stopOpacity="0.82" />
            <stop offset="100%" stopColor="#050505" stopOpacity="0.14" />
          </linearGradient>

          <linearGradient id="kivo-thinking-band-c" x1="80" y1="12" x2="80" y2="148" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0B0B0B" stopOpacity="0.12" />
            <stop offset="30%" stopColor="#2A2A2A" stopOpacity="0.68" />
            <stop offset="58%" stopColor="#8A8A8A" stopOpacity="0.92" />
            <stop offset="82%" stopColor="#202020" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#080808" stopOpacity="0.12" />
          </linearGradient>
        </defs>

        {!reducedMotion ? (
          <>
            <motion.ellipse
              cx="80"
              cy="80"
              rx="55"
              ry="46"
              transform="rotate(18 80 80)"
              fill="url(#kivo-thinking-band-a)"
              filter="url(#kivo-thinking-blur)"
              animate={{
                rotate: [18, 24, 14, 18],
                scaleX: [1, 1.02, 0.985, 1],
                scaleY: [1, 0.985, 1.02, 1],
              }}
              transition={{
                duration: 6.5,
                ease: 'easeInOut',
                repeat: Infinity,
              }}
              style={{ transformOrigin: '80px 80px' }}
            />
            <motion.ellipse
              cx="80"
              cy="80"
              rx="55"
              ry="46"
              transform="rotate(138 80 80)"
              fill="url(#kivo-thinking-band-b)"
              filter="url(#kivo-thinking-blur)"
              animate={{
                rotate: [138, 132, 144, 138],
                scaleX: [1, 0.99, 1.018, 1],
                scaleY: [1, 1.018, 0.99, 1],
              }}
              transition={{
                duration: 7.2,
                ease: 'easeInOut',
                repeat: Infinity,
              }}
              style={{ transformOrigin: '80px 80px' }}
            />
            <motion.ellipse
              cx="80"
              cy="80"
              rx="54"
              ry="45"
              transform="rotate(258 80 80)"
              fill="url(#kivo-thinking-band-c)"
              filter="url(#kivo-thinking-soft)"
              animate={{
                rotate: [258, 252, 264, 258],
                scaleX: [1, 1.01, 0.992, 1],
                scaleY: [1, 0.992, 1.01, 1],
              }}
              transition={{
                duration: 6.8,
                ease: 'easeInOut',
                repeat: Infinity,
              }}
              style={{ transformOrigin: '80px 80px' }}
            />
          </>
        ) : (
          <>
            <ellipse
              cx="80"
              cy="80"
              rx="55"
              ry="46"
              transform="rotate(18 80 80)"
              fill="url(#kivo-thinking-band-a)"
              filter="url(#kivo-thinking-blur)"
            />
            <ellipse
              cx="80"
              cy="80"
              rx="55"
              ry="46"
              transform="rotate(138 80 80)"
              fill="url(#kivo-thinking-band-b)"
              filter="url(#kivo-thinking-blur)"
            />
            <ellipse
              cx="80"
              cy="80"
              rx="54"
              ry="45"
              transform="rotate(258 80 80)"
              fill="url(#kivo-thinking-band-c)"
              filter="url(#kivo-thinking-soft)"
            />
          </>
        )}

        <circle cx="80" cy="80" r="38" fill="white" fillOpacity="0.96" />
      </svg>
    </motion.div>
  );
}

export function KivoThinkingState({
  active = true,
  status,
  className,
  messages = DEFAULT_MESSAGES,
  intervalMs = 1800,
  label = 'Kivo is working',
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={cn('flex items-center gap-4 py-3', className)}
    >
      <ThinkingOrb reducedMotion={Boolean(reducedMotion)} />

      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-400">
          {label}
        </p>

        <div className="mt-1.5 min-h-[32px]">
          <AnimatePresence mode="wait">
            <motion.p
              key={currentStatus}
              initial={{ opacity: 0, y: 6, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -6, filter: 'blur(4px)' }}
              transition={{ duration: reducedMotion ? 0.16 : 0.32, ease: 'easeOut' }}
              className="text-[24px] leading-[1.1] tracking-[-0.03em] text-zinc-800 sm:text-[28px]"
            >
              {currentStatus}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export default KivoThinkingState;
