'use client';

import { Bot, Calendar, BookOpen, Brain, Wrench } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { RunningTask } from './running-task-types';

function fmt(seconds: number): string {
  const safe = Math.max(0, seconds);
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function previewStyle(type: RunningTask['previewType']) {
  if (type === 'calendar') return 'from-[#f7fbff] via-[#ffffff] to-[#edf3fa]';
  if (type === 'research') return 'from-[#f6f9ff] via-[#ffffff] to-[#eef2f8]';
  if (type === 'memory') return 'from-[#faf6ff] via-[#ffffff] to-[#f0ecf8]';
  if (type === 'tool') return 'from-[#f7fbfa] via-[#ffffff] to-[#edf3f0]';
  return 'from-[#fafafa] via-[#ffffff] to-[#eeeeec]';
}

function Icon({ type }: { type: RunningTask['previewType'] }) {
  const cls = 'h-4 w-4 text-[#8f969d]';
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
  const label = task.currentStep || task.title;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative flex min-h-[78px] w-full items-center gap-4 overflow-hidden rounded-[26px] border border-white/75 bg-white/92 px-3.5 py-3 text-left shadow-[0_18px_48px_rgba(15,23,42,0.12)] backdrop-blur-[24px] transition duration-200 active:scale-[0.985]"
    >
      <span className="pointer-events-none absolute inset-x-8 top-0 h-px bg-white/95" />
      <span className="pointer-events-none absolute -left-10 -top-12 h-28 w-28 rounded-full bg-white/55 blur-2xl" />

      <div className="relative flex h-[56px] w-[66px] flex-none items-center justify-center overflow-hidden rounded-[14px] border border-black/[0.035] bg-[#f6f6f4] shadow-[0_9px_22px_rgba(15,23,42,0.08)]">
        <div className={`relative flex h-full w-full items-center justify-center bg-gradient-to-br ${previewGradient}`}>
          <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.96),transparent_52%)]" />
          <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/72 shadow-[0_6px_14px_rgba(15,23,42,0.075)]">
            <Icon type={task.previewType} />
          </span>
        </div>
      </div>

      <div className="relative min-w-0 flex-1 pt-0.5">
        <p className="truncate text-[16.5px] font-semibold leading-tight tracking-[-0.024em] text-[#232629]">
          {label}
        </p>
        <p className="mt-1 text-[13px] font-medium leading-none text-[#8b8f94]">
          {fmt(elapsed)}
        </p>
      </div>
    </button>
  );
}

export default KivoRunningTaskCard;
