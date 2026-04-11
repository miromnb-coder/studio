'use client';

import { motion } from 'framer-motion';

type LivingAIPresenceProps = {
  compact?: boolean;
  className?: string;
  layoutId?: string;
};

export function LivingAIPresence({ compact = false, className = '', layoutId = 'kivo-ai-presence' }: LivingAIPresenceProps) {
  return (
    <motion.div
      layoutId={layoutId}
      className={`living-ai-signal ${compact ? 'living-ai-signal-compact' : ''} ${className}`.trim()}
      transition={{ type: 'spring', stiffness: 210, damping: 24, mass: 0.8 }}
      aria-hidden="true"
    >
      <motion.span
        className="living-ai-signal-ring"
        animate={{ opacity: [0.35, 0.72, 0.35], scale: [0.95, 1.08, 0.95] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.span
        className="living-ai-signal-dot"
        animate={{ opacity: [0.68, 1, 0.68], scale: [0.96, 1.05, 0.96] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.div>
  );
}
