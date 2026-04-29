'use client';

import { useState } from 'react';
import { KivoRunningTaskCard } from './KivoRunningTaskCard';
import { KivoLiveSessionSheet } from './KivoLiveSessionSheet';
import type { RunningTask } from './running-task-types';
import type { LiveStep } from './live-steps-types';

type FloatingRunningTaskPayload = {
  task: RunningTask;
  steps?: LiveStep[];
};

type Props = {
  floatingRunningTask?: FloatingRunningTaskPayload | null;
  composerLeftOffset: number;
  keyboardOffset?: number;
  enabled?: boolean;
};

export function KivoFloatingTaskLayer({
  floatingRunningTask,
  composerLeftOffset,
  keyboardOffset = 0,
  enabled = true,
}: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const task = enabled ? floatingRunningTask?.task : null;
  if (!task) return null;

  const floatingBottom = Math.max(168, 148 + keyboardOffset);

  return (
    <>
      <div
        className="pointer-events-none fixed z-40 transition-[left,right,bottom,transform,opacity] duration-300 ease-out"
        style={{ left: `${composerLeftOffset}px`, right: '12px', bottom: `${floatingBottom}px` }}
      >
        <div className="pointer-events-auto mx-auto w-full max-w-[560px] px-5">
          <KivoRunningTaskCard task={task} onOpen={() => setSheetOpen(true)} />
        </div>
      </div>

      {sheetOpen ? (
        <KivoLiveSessionSheet
          task={task}
          steps={floatingRunningTask?.steps || []}
          onClose={() => setSheetOpen(false)}
        />
      ) : null}
    </>
  );
}

export default KivoFloatingTaskLayer;
