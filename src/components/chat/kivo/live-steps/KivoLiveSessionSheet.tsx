'use client';

import { X } from 'lucide-react';
import type { LiveStep } from './live-steps-types';
import type { RunningTask } from './running-task-types';

function fmt(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function KivoLiveSessionSheet({ task, steps, onClose }: { task: RunningTask; steps: LiveStep[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex items-end bg-[#0f172a]/20 p-2.5 sm:p-4" onClick={onClose}>
      <div className="w-full max-w-[760px] rounded-[24px] border border-[#e8ecf3] bg-white p-4 shadow-[0_24px_70px_rgba(15,23,42,0.16)]" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-start justify-between">
          <div>
            <p className="text-[12px] text-[#8a94a5]">Kivo’s workspace</p>
            <h3 className="text-[18px] font-semibold tracking-[-0.02em] text-[#162235]">Task progress</h3>
          </div>
          <button className="rounded-full border border-[#e5eaf2] p-1.5 text-[#607087]" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-3 rounded-2xl border border-[#ebeff5] bg-[#f8fafc] p-3">
          <p className="text-[14px] font-medium text-[#1d2a3b]">{task.title}</p>
          <p className="mt-1 text-[12px] text-[#6f7d90]">Status: {task.status} · Elapsed: {fmt(task.elapsedSeconds)} · {task.progressCurrent} / {task.progressTotal}</p>
          <p className="mt-2 text-[13px] text-[#2d3a4c]">Current: {task.currentStep}</p>
          {task.nextStep ? <p className="mt-1 text-[12px] text-[#78879a]">Next: {task.nextStep}</p> : null}
          {task.toolName ? <p className="mt-1 text-[12px] text-[#8a96a8]">Tool: {task.toolName}</p> : null}
        </div>

        <div className="mb-3 rounded-2xl border border-dashed border-[#dce4ef] bg-[#f7f9fc] px-3 py-4 text-[13px] text-[#718096]">Live preview placeholder (remote workspace coming next).</div>

        <div className="max-h-[32vh] space-y-2 overflow-auto pr-1">
          {steps.map((step) => (
            <div key={step.id} className="rounded-xl border border-[#edf1f7] px-3 py-2 text-[12.5px] text-[#334155]">
              <span className="font-medium">{step.label}</span>
              <span className="ml-2 text-[#7b8797]">{step.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default KivoLiveSessionSheet;
