'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

type ThinkingState = 'idle' | 'thinking' | 'processing' | 'responding';

type ThinkingCoreProps = {
  state?: ThinkingState;
  className?: string;
};

const statusMessages = [
  'Analyzing your request…',
  'Connecting context…',
  'Evaluating possibilities…',
  'Building response…',
];

const glowByState: Record<ThinkingState, string> = {
  idle: 'radial-gradient(circle, rgba(88,120,255,0.26) 0%, rgba(88,120,255,0.08) 38%, rgba(0,0,0,0) 72%)',
  thinking: 'radial-gradient(circle, rgba(74,175,255,0.3) 0%, rgba(74,175,255,0.1) 42%, rgba(0,0,0,0) 76%)',
  processing: 'radial-gradient(circle, rgba(65,225,255,0.36) 0%, rgba(117,152,255,0.13) 44%, rgba(0,0,0,0) 80%)',
  responding: 'radial-gradient(circle, rgba(142,167,255,0.28) 0%, rgba(142,167,255,0.09) 41%, rgba(0,0,0,0) 76%)',
};

const speedByState: Record<ThinkingState, number> = {
  idle: 16,
  thinking: 10,
  processing: 7,
  responding: 12,
};

export function ThinkingCore({ state = 'thinking', className = '' }: ThinkingCoreProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setMessageIndex((value) => (value + 1) % statusMessages.length);
    }, 1700);

    return () => window.clearInterval(interval);
  }, []);

  const particles = useMemo(
    () => Array.from({ length: 8 }, (_, idx) => ({ id: idx, offset: (idx * 360) / 8 })),
    [],
  );

  const speed = speedByState[state];

  return (
    <div className={`flex w-full flex-col items-start gap-2 ${className}`.trim()}>
      <div className="relative h-24 w-24 rounded-3xl">
        <motion.div
          className="absolute inset-0 rounded-3xl blur-xl"
          style={{ background: glowByState[state] }}
          animate={{ scale: [1, 1.05, 1], opacity: [0.7, 1, 0.72] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        />

        <motion.div
          className="absolute inset-[7px] rounded-full border border-[#88a5ff44]"
          style={{ borderTopColor: '#7ec6ff', borderLeftColor: 'transparent', borderRightColor: '#7a87ff' }}
          animate={{ rotate: 360, x: [0, 0.8, -0.6, 0], y: [0, -0.8, 0.6, 0] }}
          transition={{ rotate: { duration: speed, repeat: Infinity, ease: 'linear' }, x: { duration: 5.5, repeat: Infinity }, y: { duration: 5.1, repeat: Infinity } }}
        />

        <motion.div
          className="absolute inset-[16px] rounded-full border border-[#75d7ff55]"
          style={{ borderBottomColor: '#8f96ff', borderRightColor: 'transparent', borderTopColor: '#58d9ff' }}
          animate={{ rotate: -360, scale: [1, 1.035, 1] }}
          transition={{ rotate: { duration: speed * 1.25, repeat: Infinity, ease: 'linear' }, scale: { duration: 2.8, repeat: Infinity, ease: 'easeInOut' } }}
        />

        {particles.map((particle, idx) => (
          <motion.span
            key={particle.id}
            className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-[#a8dcff]"
            animate={{
              rotate: [particle.offset, particle.offset + 360],
              x: [22 + (idx % 3), 24 + (idx % 2), 22 + (idx % 3)],
              y: [0, 1.8, 0],
              opacity: [0.45, 0.9, 0.45],
            }}
            transition={{
              rotate: { duration: speed * (0.7 + idx * 0.08), repeat: Infinity, ease: 'linear' },
              x: { duration: 2.2 + idx * 0.1, repeat: Infinity, ease: 'easeInOut' },
              y: { duration: 2 + idx * 0.07, repeat: Infinity, ease: 'easeInOut' },
              opacity: { duration: 1.8 + idx * 0.05, repeat: Infinity, ease: 'easeInOut' },
            }}
          />
        ))}

        <motion.div
          className="absolute inset-[30px] rounded-full bg-gradient-to-br from-[#7ca8ff] via-[#67dcff] to-[#9c8dff]"
          animate={{ scale: [1, 1.08, 1], opacity: [0.88, 1, 0.88] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <motion.p key={messageIndex} initial={{ opacity: 0.35, y: 2 }} animate={{ opacity: 1, y: 0 }} className="text-sm font-medium text-[#2d3b57]">
        {statusMessages[messageIndex]}
      </motion.p>
    </div>
  );
}
