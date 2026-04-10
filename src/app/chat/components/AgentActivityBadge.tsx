'use client';

import { Activity, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

type AgentActivityBadgeProps = {
  isActive: boolean;
  label?: string;
};

export function AgentActivityBadge({ isActive, label = 'Agent online' }: AgentActivityBadgeProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white/80 px-2.5 py-1 text-[11px] font-medium text-[#404040] shadow-[0_4px_14px_rgba(0,0,0,0.05)] backdrop-blur-md">
      <span className="relative inline-flex h-2 w-2">
        {isActive ? (
          <motion.span
            className="absolute inline-flex h-full w-full rounded-full bg-[#5d83d3]/35"
            animate={{ scale: [1, 1.8, 1], opacity: [0.55, 0, 0.55] }}
            transition={{ duration: 1.7, repeat: Infinity, ease: 'easeInOut' }}
          />
        ) : null}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${isActive ? 'bg-[#5d83d3]' : 'bg-[#949494]'}`} />
      </span>
      {isActive ? <Activity className="h-3.5 w-3.5 text-[#5d83d3]" /> : <Sparkles className="h-3.5 w-3.5 text-[#7a7a7a]" />}
      <span>{label}</span>
    </div>
  );
}
