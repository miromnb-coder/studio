'use client';

import { Monitor, X, ExternalLink, SkipBack, SkipForward } from 'lucide-react';
import type { RunningTask } from './running-task-types';
import type { LiveStep } from './live-steps-types';

function fmt(seconds: number): string {
  const safe = Math.max(0, seconds || 0);
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

type Props = {
  task: RunningTask;
  steps?: LiveStep[];
  onClose: () => void;
};

export function KivoLiveComputerView({ task, onClose }: Props) {
  const statusText = task.status === 'running' ? 'Kivo is active' : task.status === 'failed' ? 'Kivo paused' : 'Kivo completed';
  const subtitle = task.status === 'running' ? 'Working on your task' : task.status === 'failed' ? 'Needs attention' : 'Task finished';

  return (
    <div className="fixed inset-0 z-[90] bg-[#f7f7f5] text-[#2f3337]">
      <div className="mx-auto flex h-full w-full max-w-[560px] flex-col px-6 pb-6 pt-[calc(env(safe-area-inset-top)+18px)]">
        <div className="flex h-12 items-center justify-between">
          <button type="button" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-full text-[#202326] active:bg-black/[0.04]" aria-label="Close workspace">
            <X className="h-7 w-7 stroke-[2]" />
          </button>
          <h2 className="text-[24px] font-semibold tracking-[-0.035em] text-[#2a2d31]">Kivo workspace</h2>
          <button type="button" className="flex h-11 w-11 items-center justify-center rounded-full text-[#202326] active:bg-black/[0.04]" aria-label="Open workspace">
            <ExternalLink className="h-7 w-7 stroke-[2]" />
          </button>
        </div>

        <div className="mt-[112px] h-[330px] rounded-[18px] border border-black/[0.045] bg-[#fafaf8] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.55)]">
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="relative flex h-[88px] w-[120px] items-center justify-center opacity-35">
              <Monitor className="h-[86px] w-[116px] stroke-[1.25] text-[#9ca1a5]" />
            </div>
            <p className="mt-5 text-[17px] font-medium tracking-[-0.015em] text-[#8b8f93]">Kivo workspace is active</p>
          </div>
        </div>

        <div className="mt-[108px] flex items-center gap-4">
          <div className="flex h-[58px] w-[58px] items-center justify-center rounded-[15px] border border-black/[0.045] bg-[#efefed]">
            <Monitor className="h-6 w-6 text-[#9aa0a5]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[24px] font-semibold tracking-[-0.034em] text-[#4a4d51]">{statusText}</p>
            <p className="mt-1 truncate text-[17px] font-medium tracking-[-0.018em] text-[#7b7f85]">{subtitle}</p>
          </div>
        </div>

        <div className="mt-9 h-[6px] rounded-full bg-[#ececea]">
          <div className="h-full w-[8%] rounded-full bg-[#8d928e]" />
        </div>

        <div className="mt-auto pb-[calc(env(safe-area-inset-bottom)+106px)]">
          <div className="mb-[86px] flex items-center justify-center gap-[116px] text-[#232629]">
            <SkipBack className="h-11 w-11 fill-[#232629] stroke-[1.5]" />
            <div className="flex items-center gap-3 text-[21px] font-semibold tracking-[-0.025em]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#32c766]" />
              Live
            </div>
            <SkipForward className="h-11 w-11 fill-[#232629] stroke-[1.5]" />
          </div>

          <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+18px)] z-[91] px-4">
            <div className="mx-auto flex h-[72px] max-w-[560px] items-center gap-4 rounded-[24px] bg-white px-4 shadow-[0_14px_38px_rgba(15,23,42,0.105)]">
              <span className="h-3 w-3 flex-none rounded-[5px] bg-[#32a7ff] shadow-[0_0_14px_rgba(50,167,255,0.45)]" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[17px] font-semibold tracking-[-0.024em] text-[#24272a]">{task.currentStep || task.title}</p>
                <p className="mt-1 text-[13px] font-medium text-[#8d9297]">{fmt(task.elapsedSeconds)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default KivoLiveComputerView;
