'use client';

import type { KivoExecutionStep as KivoExecutionStepType } from './types';
import { KivoExecutionStep } from './KivoExecutionStep';

export function KivoExecutionSteps({
  steps,
}: {
  steps: KivoExecutionStepType[];
}) {
  return (
    <div className="mt-4">
      {steps.map((step, index) => (
        <KivoExecutionStep
          key={step.id}
          step={step}
          isLast={index === steps.length - 1}
        />
      ))}
    </div>
  );
}
