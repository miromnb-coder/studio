'use client';

import type { KivoExecutionPresentation } from './types';
import { KivoExecutionHeader } from './KivoExecutionHeader';
import { KivoExecutionStatus } from './KivoExecutionStatus';
import { KivoExecutionSteps } from './KivoExecutionSteps';
import { KivoToolPill } from './KivoToolPill';

export function KivoExecutionCard({
  presentation,
}: {
  presentation: KivoExecutionPresentation;
}) {
  if (presentation.mode !== 'execution') return null;

  return (
    <div className="rounded-[24px] border border-black/[0.06] bg-white px-4 py-4 shadow-[0_14px_28px_rgba(0,0,0,0.04)]">
      {presentation.title ? (
        <KivoExecutionHeader title={presentation.title} />
      ) : null}

      {presentation.statusText ? (
        <div className="mt-3">
          <KivoExecutionStatus text={presentation.statusText} />
        </div>
      ) : null}

      {presentation.tools?.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {presentation.tools.map((tool) => (
            <KivoToolPill key={tool} tool={tool} />
          ))}
        </div>
      ) : null}

      {presentation.steps?.length ? (
        <KivoExecutionSteps steps={presentation.steps} />
      ) : null}
    </div>
  );
}
