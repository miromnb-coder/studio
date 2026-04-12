'use client';

import { KivoThinkingIndicator } from '@/components/ai/KivoThinkingIndicator';

type ThinkingIndicatorProps = {
  phase: string;
};

export function ThinkingIndicator({ phase }: ThinkingIndicatorProps) {
  return <KivoThinkingIndicator phase={phase} size={28} compact />;
}
