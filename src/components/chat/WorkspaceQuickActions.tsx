'use client';

import { CalendarDays, ScanSearch, PiggyBank, Bot } from 'lucide-react';

type QuickActionId = 'analyze' | 'planner' | 'money-saver' | 'ask-agent';

type WorkspaceQuickActionsProps = {
  onAction: (id: QuickActionId) => void;
};

const actions = [
  { id: 'analyze' as const, label: 'Analyze Screenshot', icon: ScanSearch },
  { id: 'planner' as const, label: 'Plan My Week', icon: CalendarDays },
  { id: 'money-saver' as const, label: 'Save Money Scan', icon: PiggyBank },
  { id: 'ask-agent' as const, label: 'Ask AI Agent', icon: Bot },
];

export function WorkspaceQuickActions({ onAction }: WorkspaceQuickActionsProps) {
  return (
    <section>
      <h3 className="mb-3 text-[17px] font-semibold text-[#4a5160]">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              type="button"
              onClick={() => onAction(action.id)}
              className="rounded-2xl border border-[#e1e4eb] bg-[#f8f9fc] px-3 py-3 text-left shadow-[0_4px_12px_rgba(79,86,102,0.04)]"
            >
              <span className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#e0e4eb] bg-[#f1f4f9] text-[#616978]">
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
              </span>
              <p className="text-[15px] font-medium leading-tight text-[#2f3643]">{action.label}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
