'use client';

import type { AgentResponseMetadata } from '@/types/agent-response';

type Props = {
  metadata: AgentResponseMetadata;
};

const statusClass: Record<string, string> = {
  running: 'text-[#7a6a00]',
  completed: 'text-[#1e6a3b]',
  failed: 'text-[#8d2a2a]',
};

export function AgentStrategyCard({ metadata }: Props) {
  return (
    <details className="mt-2 rounded-xl border border-black/5 bg-[#fafafa] p-3" open>
      <summary className="cursor-pointer list-none text-sm font-medium text-[#2a2a2a]">
        Strategy · {metadata.intent}
      </summary>

      <div className="mt-2 space-y-2 text-sm text-[#3a3a3a]">
        <p className="leading-6">{metadata.plan}</p>
        <ul className="space-y-1">
          {metadata.steps.map((step, idx) => (
            <li key={`${step.action}-${idx}`} className="rounded-lg border border-black/5 bg-white px-2.5 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{step.action}</span>
                <span className={`text-xs uppercase tracking-wide ${statusClass[step.status] || 'text-[#555]'}`}>
                  {step.status}
                </span>
              </div>
              {step.summary ? <p className="mt-1 text-xs text-[#565656]">{step.summary}</p> : null}
              {step.error ? <p className="mt-1 text-xs text-[#8d2a2a]">{step.error}</p> : null}
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
