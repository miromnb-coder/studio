'use client';

import { BarChart3, Bot, ChevronRight, Scale, Search, Zap } from 'lucide-react';

type ToolId = 'finance-scanner' | 'memory-search' | 'research-mode' | 'compare-tool' | 'automation-builder';

type WorkspaceToolsProps = {
  onSelect: (id: ToolId) => void;
};

const tools = [
  { id: 'finance-scanner' as const, label: 'Finance Scanner', icon: BarChart3 },
  { id: 'memory-search' as const, label: 'Memory Search', icon: Search },
  { id: 'research-mode' as const, label: 'Research Mode', icon: Bot },
  { id: 'compare-tool' as const, label: 'Compare Tool', icon: Scale },
  { id: 'automation-builder' as const, label: 'Automation Builder', icon: Zap },
];

export function WorkspaceTools({ onSelect }: WorkspaceToolsProps) {
  return (
    <section>
      <h3 className="mb-3 text-[15px] font-semibold uppercase tracking-[0.08em] text-[#6f7786]">Tools</h3>
      <div className="overflow-hidden rounded-[24px] border border-[#dee3ec] bg-[#fafcff] shadow-[0_12px_28px_rgba(72,80,96,0.08)]">
        {tools.map((tool, index) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => onSelect(tool.id)}
              className={`flex min-h-[64px] w-full items-center justify-between px-4 py-3 text-left ${index !== tools.length - 1 ? 'border-b border-[#e8ecf2]' : ''}`}
            >
              <span className="inline-flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#e1e6ef] bg-white text-[#5e6674] shadow-[0_2px_8px_rgba(75,84,99,0.08)]">
                  <Icon className="h-[17px] w-[17px]" />
                </span>
                <span className="text-[15px] font-medium text-[#313847]">{tool.label}</span>
              </span>
              <ChevronRight className="h-4 w-4 text-[#9099a7]" />
            </button>
          );
        })}
      </div>
    </section>
  );
}
