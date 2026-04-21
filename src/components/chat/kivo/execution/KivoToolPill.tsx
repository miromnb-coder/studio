'use client';

import type { KivoExecutionTool } from './types';

const TOOL_LABELS: Record<KivoExecutionTool, string> = {
  gmail: 'Gmail',
  calendar: 'Calendar',
  browser: 'Browser',
  memory: 'Memory',
  files: 'Files',
  general: 'Kivo',
};

export function KivoToolPill({
  tool,
}: {
  tool: KivoExecutionTool;
}) {
  return (
    <span className="inline-flex items-center rounded-full border border-black/[0.06] bg-[#F4F4F6] px-3 py-1 text-[12px] font-medium tracking-[-0.01em] text-[#4F4F58]">
      {TOOL_LABELS[tool]}
    </span>
  );
}
