'use client';

import { AgentExecutionStepRow, type AgentExecutionStep } from './AgentExecutionStepRow';

export type AgentWorkflowStatus = 'running' | 'completed' | 'needs_attention';

type AgentExecutionPanelProps = {
  title: string;
  statusLabel: string;
  status: AgentWorkflowStatus;
  currentFocusLabel: string;
  currentFocus?: string;
  steps: AgentExecutionStep[];
};

const badgeStyles: Record<AgentWorkflowStatus, string> = {
  running: 'border-[#d7e3ff] bg-[#edf3ff] text-[#3c4e7a]',
  completed: 'border-[#dcefe2] bg-[#eefaf1] text-[#3d6a4d]',
  needs_attention: 'border-[#ffd8d1] bg-[#fff3f1] text-[#90514c]',
};

export function AgentExecutionPanel({
  title,
  statusLabel,
  status,
  currentFocusLabel,
  currentFocus,
  steps,
}: AgentExecutionPanelProps) {
  return (
    <section className="mb-3 rounded-2xl border border-[#dfe4ed] bg-[#f8faff] px-3 py-3">
      <header className="mb-2 flex items-center justify-between gap-2">
        <h4 className="text-[13px] font-semibold text-[#404958]">{title}</h4>
        <span
          className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${badgeStyles[status]}`}
        >
          {statusLabel}
        </span>
      </header>

      {currentFocus ? (
        <p className="mb-2 text-[12px] text-[#556070]">
          <span className="font-medium">{currentFocusLabel}</span> {currentFocus}
        </p>
      ) : null}

      <ol className="space-y-1">
        {steps.map((step, index) => (
          <AgentExecutionStepRow key={`${step.label}-${index}`} step={step} />
        ))}
      </ol>
    </section>
  );
}
