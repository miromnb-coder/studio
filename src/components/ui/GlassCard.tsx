"use client";

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ReactNode, memo } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hoverEffect?: boolean;
  delay?: number;
}

export const GlassCard = memo(({ children, className, hoverEffect = true, delay = 0 }: GlassCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={hoverEffect ? { 
        y: -4, 
        scale: 1.01,
        transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
      } : undefined}
      className={cn(
        "glass-surface rounded-4xl p-8 will-change-transform",
        className
      )}
    >
      {children}
    </motion.div>
  );
});

GlassCard.displayName = 'GlassCard';
