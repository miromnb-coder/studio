'use client';

import type { KivoExecutionTool } from './types';

type ToolMeta = {
  label: string;
  icon: string;
};

const TOOL_META: Record<KivoExecutionTool, ToolMeta> = {
  gmail: {
    label: 'Gmail',
    icon: '✉️',
  },
  calendar: {
    label: 'Calendar',
    icon: '📅',
  },
  browser: {
    label: 'Browser',
    icon: '🌐',
  },
  memory: {
    label: 'Memory',
    icon: '🧠',
  },
  files: {
    label: 'Files',
    icon: '📁',
  },
  general: {
    label: 'Kivo',
    icon: '✦',
  },
};

export function KivoToolPill({
  tool,
}: {
  tool: KivoExecutionTool;
}) {
  const meta = TOOL_META[tool] ?? TOOL_META.general;

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-black/[0.06] bg-[#f5f5f7] px-3 py-1.5 text-[13px] font-medium tracking-[-0.015em] text-[#4a4a50] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      <span className="text-[13px] leading-none" aria-hidden="true">
        {meta.icon}
      </span>

      <span>{meta.label}</span>
    </span>
  );
}
