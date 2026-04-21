'use client';

import { useMemo, useState } from 'react';

import type { KivoExecutionPresentation } from './types';
import { KivoExecutionHeader } from './KivoExecutionHeader';
import { KivoExecutionStatus } from './KivoExecutionStatus';
import { KivoExecutionSteps } from './KivoExecutionSteps';
import { KivoToolPill } from './KivoToolPill';

function shouldStartExpanded(presentation: KivoExecutionPresentation): boolean {
  if (presentation.mode !== 'execution') return false;
  if ((presentation.steps?.length ?? 0) > 0) return true;
  if ((presentation.tools?.length ?? 0) > 1) return true;
  return false;
}

export function KivoExecutionCard({
  presentation,
}: {
  presentation: KivoExecutionPresentation;
}) {
  const [isExpanded, setIsExpanded] = useState(() => shouldStartExpanded(presentation));

  const stepCount = presentation.mode === 'execution' ? presentation.steps?.length ?? 0 : 0;
  const toolCount = presentation.mode === 'execution' ? presentation.tools?.length ?? 0 : 0;

  const summaryText = useMemo(() => {
    if (presentation.mode !== 'execution') return '';
    if (presentation.statusText) return presentation.statusText;
    if (toolCount > 0) return `Used ${toolCount} tool${toolCount === 1 ? '' : 's'}`;
    if (stepCount > 0) return `${stepCount} step${stepCount === 1 ? '' : 's'} completed`;
    return 'Completed';
  }, [presentation, stepCount, toolCount]);

  if (presentation.mode !== 'execution') return null;

  const canExpand = stepCount > 0 || toolCount > 0;

  return (
    <section
      className="overflow-hidden rounded-[24px] border border-black/8 bg-white/90 shadow-[0_8px_30px_rgba(0,0,0,0.06)] backdrop-blur-sm"
      aria-label="Execution details"
    >
      <button
        type="button"
        onClick={() => {
          if (canExpand) setIsExpanded((prev) => !prev);
        }}
        className={[
          'w-full text-left transition',
          canExpand ? 'cursor-pointer active:scale-[0.998]' : 'cursor-default',
        ].join(' ')}
        aria-expanded={canExpand ? isExpanded : undefined}
      >
        <div className="space-y-3 px-4 py-4 sm:px-5 sm:py-5">
          <KivoExecutionHeader
            title={presentation.title ?? 'Kivo worked on this'}
            intent={presentation.intent}
            summary={summaryText}
            isExpanded={canExpand ? isExpanded : undefined}
            canExpand={canExpand}
          />

          {presentation.statusText ? (
            <KivoExecutionStatus text={presentation.statusText} />
          ) : null}

          {!!presentation.tools?.length ? (
            <div className="flex flex-wrap gap-2">
              {presentation.tools.map((tool) => (
                <KivoToolPill key={tool.id} tool={tool} />
              ))}
            </div>
          ) : null}
        </div>
      </button>

      {canExpand && isExpanded ? (
        <div className="border-t border-black/6 px-4 py-4 sm:px-5 sm:py-5">
          {!!presentation.steps?.length ? (
            <KivoExecutionSteps steps={presentation.steps} />
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
