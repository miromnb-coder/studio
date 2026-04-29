'use client';

import { Bot, Calendar, ChevronDown, BookOpen, Brain, Wrench } from 'lucide-react';
import type { RunningTask } from './running-task-types';

function fmt(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function statusColor(status: RunningTask['status']) {
  if (status === 'failed') return 'bg-[#ef4444] shadow-[0_0_12px_rgba(239,68,68,0.35)]';
  if (status === 'completed') return 'bg-[#22c55e] shadow-[0_0_12px_rgba(34,197,94,0.28)]';
  return 'bg-[#2f80ed] shadow-[0_0_14px_rgba(47,128,237,0.42)]';
}

function Icon({ type }: { type: RunningTask['previewType'] }) {
  const cls = 'h-4 w-4 text-[#7d858f]';
  if (type === 'calendar') return <Calendar className={cls} />;
  if (type === 'research') return <BookOpen className={cls} />;
  if (type === 'memory') return <Brain className={cls} />;
  if (type === 'tool') return <Wrench className={cls} />;
  return <Bot className={cls} />;
}

export function KivoRunningTaskCard({ task, onOpen }: { task: RunningTask; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex min-h-[104px] w-full items-start gap-4 rounded-[30px] border border-black/[0.035] bg-white/92 px-4 py-4 text-left shadow-[0_18px_46px_rgba(15,23,42,0.10)] backdrop-blur-2xl transition duration-200 active:scale-[0.985]"
    >
      <div className="mt-0.5 flex h-[58px] w-[74px] flex-none items-center justify-center overflow-hidden rounded-[14px] border border-black/[0.04] bg-[#f6f6f4] shadow-[0_8px_18px_rgba(15,23,42,0.055)]">
        <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(180deg,#fbfbfa,#eeeeec)]">
          <Icon type={task.previewType} />
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 pr-1">
          <p className="truncate text-[20px] font-semibold tracking-[-0.035em] text-[#222426]">
            Task Progress <span className="font-medium text-[#8c8f94]">{task.progressCurrent} / {task.progressTotal}</span>
          </p>
          <ChevronDown className="ml-auto h-5 w-5 flex-none text-[#7e838a] transition group-active:translate-y-0.5" />
        </div>

        <div className="mt-4 flex items-start gap-3">
          <span className={`mt-1.5 h-3 w-3 flex-none rounded-[5px] ${statusColor(task.status)}`} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[17px] font-medium tracking-[-0.025em] text-[#2c2f33]">{task.currentStep || task.title}</p>
            <p className="mt-0.5 text-[13px] font-medium text-[#8a8f96]">{fmt(task.elapsedSeconds)}</p>
          </div>
        </div>

        {task.nextStep ? (
          <div className="mt-4 flex items-center gap-3 text-[#8b8f94]">
            <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full border border-[#a6a9ad] text-[11px]">◷</span>
            <p className="truncate text-[16px] font-medium tracking-[-0.02em]">{task.nextStep}</p>
          </div>
        ) : null}
      </div>
    </button>
  );
}

export default KivoRunningTaskCard;
