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
      className={`living-ai-face ${compact ? 'living-ai-face-compact' : ''} ${className}`.trim()}
      transition={{ type: 'spring', stiffness: 210, damping: 24, mass: 0.8 }}
      aria-hidden="true"
    >
      <motion.span
        className="living-ai-face-glow"
        animate={{ opacity: [0.32, 0.52, 0.32], scale: [0.98, 1.04, 0.98] }}
        transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="living-ai-face-shell"
        animate={{ y: [0, -2, 0], scale: [1, 1.018, 1] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <motion.div
          className="living-ai-eyes"
          animate={{ x: [0, 0, -5, -5, 5, 5, 0, 0] }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
            times: [0, 0.1, 0.26, 0.38, 0.56, 0.7, 0.9, 1],
          }}
        >
          <span className="living-ai-eye" />
          <span className="living-ai-eye" />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
