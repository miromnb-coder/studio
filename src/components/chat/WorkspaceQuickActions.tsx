'use client';

import { CalendarDays, ScanSearch, PiggyBank, Bot } from 'lucide-react';

type QuickActionId = 'analyze' | 'planner' | 'money-saver' | 'ask-agent';

type WorkspaceQuickActionsProps = {
  onAction: (id: QuickActionId) => void;
};

const actions = [
  {
    id: 'analyze' as const,
    label: 'Analyze Screenshot',
    subtitle: 'Inspect images instantly',
    icon: ScanSearch,
    tone: 'from-[#fbfcff] to-[#eef4ff]',
  },
  {
    id: 'planner' as const,
    label: 'Plan My Week',
    subtitle: 'Organize tasks and time',
    icon: CalendarDays,
    tone: 'from-[#fbfcff] to-[#eef8f4]',
  },
  {
    id: 'money-saver' as const,
    label: 'Save Money Scan',
    subtitle: 'Find hidden waste',
    icon: PiggyBank,
    tone: 'from-[#fbfdf9] to-[#eef6ef]',
  },
  {
    id: 'ask-agent' as const,
    label: 'Ask AI Agent',
    subtitle: 'Delegate a task now',
    icon: Bot,
    tone: 'from-[#fcfcff] to-[#f0f1fb]',
  },
];

export function WorkspaceQuickActions({
  onAction,
}: WorkspaceQuickActionsProps) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[14px] font-semibold tracking-[-0.01em] text-[#4b5563]">
          Quick Actions
        </h3>
        <span className="text-[12px] text-[#9aa3b2]">Instant tools</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <button
              key={action.id}
              type="button"
              onClick={() => onAction(action.id)}
              className={`group rounded-[22px] border border-[#dde3ec] bg-gradient-to-b ${action.tone} px-4 py-4 text-left shadow-[0_8px_18px_rgba(64,72,88,0.06)] transition duration-200 hover:-translate-y-[1px] hover:shadow-[0_12px_22px_rgba(64,72,88,0.08)] active:scale-[0.99]`}
            >
              <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[#e2e7ef] bg-white text-[#4e5665] shadow-[0_3px_8px_rgba(60,68,82,0.06)]">
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
              </span>

              <p className="text-[14px] font-semibold leading-tight text-[#2f3744]">
                {action.label}
              </p>

              <p className="mt-1 text-[12px] leading-snug text-[#7d8696]">
                {action.subtitle}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
