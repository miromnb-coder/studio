'use client';

import { CalendarDays, ScanSearch, PiggyBank, Bot } from 'lucide-react';

type QuickActionId = 'analyze' | 'planner' | 'money-saver' | 'ask-agent';

type WorkspaceQuickActionsProps = {
  onAction: (id: QuickActionId) => void;
};

const actions = [
  { id: 'analyze' as const, label: 'Analyze Screenshot', icon: ScanSearch, tone: 'from-[#f8fbff] to-[#edf4ff]' },
  { id: 'planner' as const, label: 'Plan My Week', icon: CalendarDays, tone: 'from-[#f8fcff] to-[#edf7f5]' },
  { id: 'money-saver' as const, label: 'Save Money Scan', icon: PiggyBank, tone: 'from-[#f8fcf8] to-[#ecf5ee]' },
  { id: 'ask-agent' as const, label: 'Ask AI Agent', icon: Bot, tone: 'from-[#fbfbff] to-[#eff0fa]' },
];

export function WorkspaceQuickActions({ onAction }: WorkspaceQuickActionsProps) {
  return (
    <section>
      <h3 className="mb-3 text-[15px] font-semibold uppercase tracking-[0.08em] text-[#6f7786]">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              type="button"
              onClick={() => onAction(action.id)}
              className={`rounded-[20px] border border-[#dde3ec] bg-gradient-to-b ${action.tone} px-3.5 py-3.5 text-left shadow-[0_10px_22px_rgba(74,83,99,0.08)] transition hover:-translate-y-[1px]`}
            >
              <span className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#dfe5ef] bg-white text-[#5a6272] shadow-[0_3px_9px_rgba(67,76,91,0.08)]">
                <Icon className="h-[17px] w-[17px]" strokeWidth={1.8} />
              </span>
              <p className="text-[14px] font-semibold leading-tight text-[#303845]">{action.label}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
