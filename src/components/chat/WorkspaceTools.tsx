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
      <h3 className="mb-3 text-[17px] font-semibold text-[#4a5160]">Tools</h3>
      <div className="overflow-hidden rounded-[22px] border border-[#e0e4ea] bg-[#fbfcfe] shadow-[0_6px_18px_rgba(80,87,101,0.05)]">
        {tools.map((tool, index) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => onSelect(tool.id)}
              className={`flex w-full items-center justify-between px-3 py-3 text-left ${index !== tools.length - 1 ? 'border-b border-[#e7e9ee]' : ''}`}
            >
              <span className="inline-flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#e1e5eb] bg-[#f2f5fa] text-[#5f6675]">
                  <Icon className="h-[17px] w-[17px]" />
                </span>
                <span className="text-[16px] text-[#2f3642]">{tool.label}</span>
              </span>
              <ChevronRight className="h-4 w-4 text-[#89909c]" />
            </button>
          );
        })}
      </div>
    </section>
  );
}
