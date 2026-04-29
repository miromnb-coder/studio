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
  if (type === 'calendar') return 'from-[#f7fbff] via-[#ffffff] to-[#eef3f7]';
  if (type === 'research') return 'from-[#f7f9ff] via-[#ffffff] to-[#eef1f6]';
  if (type === 'memory') return 'from-[#fbf8ff] via-[#ffffff] to-[#f0edf5]';
  if (type === 'tool') return 'from-[#f8fbfa] via-[#ffffff] to-[#eef2ef]';
  return 'from-[#fafafa] via-[#ffffff] to-[#eeeeec]';
}

function Icon({ type }: { type: RunningTask['previewType'] }) {
  const cls = 'h-[17px] w-[17px] text-[#9aa0a6]';
  if (type === 'calendar') return <Calendar className={cls} />;
  if (type === 'research') return <BookOpen className={cls} />;
  if (type === 'memory') return <Brain className={cls} />;
  if (type === 'tool') return <Wrench className={cls} />;
  return <Bot className={cls} />;
}

type Props = {
  task: RunningTask;
  onOpenPreview: () => void;
};

export function KivoRunningTaskCard({ task, onOpenPreview }: Props) {
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
    <div className="relative flex h-[72px] w-full items-center gap-[14px] overflow-hidden rounded-[24px] border border-white/80 bg-white/96 px-[12px] py-[10px] text-left shadow-[0_14px_38px_rgba(15,23,42,0.105)] backdrop-blur-[22px]">
      <span className="pointer-events-none absolute inset-x-7 top-0 h-px bg-white" />
      <span className="pointer-events-none absolute -left-8 -top-10 h-24 w-24 rounded-full bg-white/50 blur-2xl" />

      <button
        type="button"
        onClick={onOpenPreview}
        className="relative flex h-[50px] w-[58px] flex-none items-center justify-center overflow-hidden rounded-[12px] border border-black/[0.03] bg-[#f7f7f5] shadow-[0_7px_18px_rgba(15,23,42,0.07)] transition active:scale-[0.98]"
        aria-label="Open live workspace"
      >
        <div className={`relative flex h-full w-full items-center justify-center bg-gradient-to-br ${previewGradient}`}>
          <span className="absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,rgba(255,255,255,0.98),transparent_52%)]" />
          <span className="relative flex h-[32px] w-[32px] items-center justify-center rounded-full bg-white/72 shadow-[0_5px_12px_rgba(15,23,42,0.07)]">
            <Icon type={task.previewType} />
          </span>
        </div>
      </button>

      <div className="relative min-w-0 flex-1 pt-[1px]">
        <p className="truncate text-[16px] font-semibold leading-[1.16] tracking-[-0.026em] text-[#222426]">{label}</p>
        <p className="mt-[5px] text-[12.5px] font-medium leading-none tracking-[-0.01em] text-[#8c9095]">{fmt(elapsed)}</p>
      </div>
    </div>
  );
}

export default KivoRunningTaskCard;
