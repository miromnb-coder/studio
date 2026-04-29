'use client';

import { Bot, Calendar, BookOpen, Brain, Wrench } from 'lucide-react';
import type { RunningTask } from './running-task-types';

function fmt(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function Icon({ type }: { type: RunningTask['previewType'] }) {
  if (type === 'calendar') return <Calendar className="h-4 w-4 text-[#4f46e5]" />;
  if (type === 'research') return <BookOpen className="h-4 w-4 text-[#2563eb]" />;
  if (type === 'memory') return <Brain className="h-4 w-4 text-[#7c3aed]" />;
  if (type === 'tool') return <Wrench className="h-4 w-4 text-[#0f766e]" />;
  return <Bot className="h-4 w-4 text-[#334155]" />;
}

export function KivoRunningTaskCard({ task, onOpen }: { task: RunningTask; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="mb-3.5 flex w-full items-center gap-3 rounded-[24px] border border-[#e7ebf2] bg-white px-3.5 py-3 text-left shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#e8ecf3] bg-[#f8fafc]">
        <Icon type={task.previewType} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-semibold tracking-[-0.015em] text-[#1e293b]">{task.title}</p>
        <p className="truncate text-[12px] text-[#64748b]">{task.currentStep}</p>
        {task.nextStep ? <p className="truncate text-[11.5px] text-[#94a3b8]">Next: {task.nextStep}</p> : null}
      </div>
      <div className="flex flex-col items-end">
        <span className="text-[12px] font-medium text-[#334155]">{fmt(task.elapsedSeconds)}</span>
        <span className="mt-0.5 text-[11px] text-[#7b8a9f]">{task.progressCurrent} / {task.progressTotal}</span>
        <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-[#4b5563]"><span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />{task.status}</span>
      </div>
    </button>
  );
}

export default KivoRunningTaskCard;
