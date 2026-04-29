'use client';

import { Bot, Calendar, ChevronDown, BookOpen, Brain, Wrench } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { RunningTask } from './running-task-types';

function fmt(seconds: number): string {
  const safe = Math.max(0, seconds);
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function statusColor(status: RunningTask['status']) {
  if (status === 'failed') return 'bg-[#ef4444] shadow-[0_0_12px_rgba(239,68,68,0.35)]';
  if (status === 'completed') return 'bg-[#22c55e] shadow-[0_0_12px_rgba(34,197,94,0.28)]';
  return 'bg-[#2f80ed] shadow-[0_0_14px_rgba(47,128,237,0.42)]';
}

function previewStyle(type: RunningTask['previewType']) {
  if (type === 'calendar') return 'from-[#eef5ff] via-[#f8fbff] to-[#eceff7]';
  if (type === 'research') return 'from-[#eef4ff] via-[#fbfcff] to-[#edf1f8]';
  if (type === 'memory') return 'from-[#f5efff] via-[#fdfbff] to-[#eeeaf7]';
  if (type === 'tool') return 'from-[#eefaf7] via-[#fbfefd] to-[#eaf2ef]';
  return 'from-[#f9fafb] via-[#ffffff] to-[#ececec]';
}

function Icon({ type }: { type: RunningTask['previewType'] }) {
  const cls = 'h-5 w-5 text-[#6f7781]';
  if (type === 'calendar') return <Calendar className={cls} />;
  if (type === 'research') return <BookOpen className={cls} />;
  if (type === 'memory') return <Brain className={cls} />;
  if (type === 'tool') return <Wrench className={cls} />;
  return <Bot className={cls} />;
}

export function KivoRunningTaskCard({ task, onOpen }: { task: RunningTask; onOpen: () => void }) {
  const [extraSeconds, setExtraSeconds] = useState(0);
  useEffect(() => {
    setExtraSeconds(0);
    if (task.status !== 'running') return;
    const interval = window.setInterval(() => setExtraSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(interval);
  }, [task.status, task.title, task.currentStep]);

  const elapsed = task.status === 'running' ? task.elapsedSeconds + extraSeconds : task.elapsedSeconds;
  const previewGradient = useMemo(() => previewStyle(task.previewType), [task.previewType]);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative flex min-h-[104px] w-full items-start gap-4 overflow-hidden rounded-[30px] border border-white/70 bg-white/82 px-4 py-4 text-left shadow-[0_22px_60px_rgba(15,23,42,0.14)] backdrop-blur-[28px] transition duration-200 active:scale-[0.985]"
    >
      <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-white/90" />
      <span className="pointer-events-none absolute -left-12 -top-16 h-32 w-32 rounded-full bg-white/45 blur-2xl" />

      <div className="mt-0.5 flex h-[58px] w-[74px] flex-none items-center justify-center overflow-hidden rounded-[15px] border border-white/70 bg-[#f6f6f4] shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
        <div className={`relative flex h-full w-full items-center justify-center bg-gradient-to-br ${previewGradient}`}>
          <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.95),transparent_48%)]" />
          <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/70 shadow-[0_6px_16px_rgba(15,23,42,0.08)]">
            <Icon type={task.previewType} />
          </span>
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
            <p className="mt-0.5 text-[13px] font-medium text-[#8a8f96]">{fmt(elapsed)}</p>
          </div>
        </div>

        {task.nextStep ? (
          <div className="mt-4 flex items-center gap-3 text-[#8b8f94]">
            <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full border border-[#a6a9ad]/80 bg-white/35 text-[11px]">◷</span>
            <p className="truncate text-[16px] font-medium tracking-[-0.02em]">{task.nextStep}</p>
          </div>
        ) : null}
      </div>
    </button>
  );
}

export default KivoRunningTaskCard;
