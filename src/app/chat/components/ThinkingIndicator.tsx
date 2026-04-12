'use client';

import { KivoThinkingIndicator } from '@/components/ai/KivoThinkingIndicator';

type ThinkingIndicatorProps = {
  phase: string;
  detail?: string;
};

export function ThinkingIndicator({ phase, detail }: ThinkingIndicatorProps) {
  return <KivoThinkingIndicator phase={phase} detail={detail} size={30} compact />;
}
