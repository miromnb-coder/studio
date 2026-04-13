'use client';

import {
  BarChart3,
  Bot,
  ChevronRight,
  Scale,
  Search,
  Zap,
} from 'lucide-react';

type ToolId =
  | 'finance-scanner'
  | 'memory-search'
  | 'research-mode'
  | 'compare-tool'
  | 'automation-builder';

type WorkspaceToolsProps = {
  onSelect: (id: ToolId) => void;
};

const tools = [
  {
    id: 'finance-scanner' as const,
    label: 'Finance Scanner',
    subtitle: 'Detect leaks and trends',
    icon: BarChart3,
  },
  {
    id: 'memory-search' as const,
    label: 'Memory Search',
    subtitle: 'Search saved knowledge',
    icon: Search,
  },
  {
    id: 'research-mode' as const,
    label: 'Research Mode',
    subtitle: 'Deep web intelligence',
    icon: Bot,
  },
  {
    id: 'compare-tool' as const,
    label: 'Compare Tool',
    subtitle: 'Evaluate options fast',
    icon: Scale,
  },
  {
    id: 'automation-builder' as const,
    label: 'Automation Builder',
    subtitle: 'Create smart workflows',
    icon: Zap,
  },
];

export function WorkspaceTools({ onSelect }: WorkspaceToolsProps) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[14px] font-semibold tracking-[-0.01em] text-[#4b5563]">
          Tools
        </h3>
        <span className="text-[12px] text-[#9aa3b2]">Operator stack</span>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-[#dde3ec] bg-[#fbfcfe] shadow-[0_8px_18px_rgba(64,72,88,0.06)]">
        {tools.map((tool, index) => {
          const Icon = tool.icon;

          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => onSelect(tool.id)}
              className={`flex min-h-[68px] w-full items-center justify-between px-4 py-3 text-left transition hover:bg-[#f5f7fb] active:scale-[0.995] ${
                index !== tools.length - 1
                  ? 'border-b border-[#e8ecf2]'
                  : ''
              }`}
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-[#e2e7ef] bg-white text-[#596171] shadow-[0_3px_8px_rgba(60,68,82,0.06)]">
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                </span>

                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-semibold text-[#2f3744]">
                    {tool.label}
                  </span>
                  <span className="block truncate text-[12px] text-[#8b93a1]">
                    {tool.subtitle}
                  </span>
                </span>
              </span>

              <ChevronRight className="h-4 w-4 shrink-0 text-[#9aa2af]" />
            </button>
          );
        })}
      </div>
    </section>
  );
}
