'use client';

import type { KivoExecutionStep as KivoExecutionStepType } from './types';

function StepIndicator({
  state,
}: {
  state: KivoExecutionStepType['state'];
}) {
  if (state === 'done') {
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-black/[0.08] bg-[#F3F4F6] text-[12px] font-semibold text-[#141419]">
        ✓
      </span>
    );
  }

  if (state === 'active') {
    return (
      <span className="relative inline-flex h-6 w-6 items-center justify-center rounded-full border border-black/[0.08] bg-white">
        <span className="absolute h-3 w-3 animate-pulse rounded-full bg-black/55" />
      </span>
    );
  }

  if (state === 'error') {
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-black/[0.08] bg-[#F8F4F4] text-[12px] font-semibold text-[#7A3A3A]">
        !
      </span>
    );
  }

  return (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-black/[0.08] bg-[#FAFAFB] text-[12px] text-[#9A9AA3]">
      ○
    </span>
  );
}

export function KivoExecutionStep({
  step,
  isLast,
}: {
  step: KivoExecutionStepType;
  isLast: boolean;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex w-6 shrink-0 flex-col items-center">
        <StepIndicator state={step.state} />
        {!isLast ? (
          <span className="mt-1 h-full w-px bg-black/[0.08]" />
        ) : null}
      </div>

      <div className="min-w-0 flex-1 pb-4">
        <div className="text-[14px] font-medium tracking-[-0.015em] text-[#141419]">
          {step.label}
        </div>
        {step.description ? (
          <div className="mt-1 text-[13px] leading-5 text-[#7B7B84]">
            {step.description}
          </div>
        ) : null}
      </div>
    </div>
  );
}
