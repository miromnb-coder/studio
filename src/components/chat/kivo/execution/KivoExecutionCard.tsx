'use client';

import { useMemo, useState } from 'react';

import type { KivoExecutionPresentation } from './types';
import { KivoExecutionHeader } from './KivoExecutionHeader';
import { KivoExecutionStatus } from './KivoExecutionStatus';
import { KivoExecutionSteps } from './KivoExecutionSteps';
import { KivoToolPill } from './KivoToolPill';

function shouldStartExpanded(presentation: KivoExecutionPresentation): boolean {
  if (presentation.mode !== 'execution') return false;
  if ((presentation.tools?.length ?? 0) > 0) return true;
  if ((presentation.steps?.length ?? 0) > 0) return true;
  return false;
}

export function KivoExecutionCard({
  presentation,
}: {
  presentation: KivoExecutionPresentation;
}) {
  const [isExpanded, setIsExpanded] = useState(() => shouldStartExpanded(presentation));

  const toolCount = presentation.mode === 'execution' ? presentation.tools?.length ?? 0 : 0;
  const stepCount = presentation.mode === 'execution' ? presentation.steps?.length ?? 0 : 0;

  const summaryText = useMemo(() => {
    if (presentation.mode !== 'execution') return '';
    if (presentation.statusText?.trim()) return presentation.statusText;
    if (toolCount > 0) return `${toolCount} result${toolCount === 1 ? '' : 's'}`;
    if (stepCount > 0) return `${stepCount} step${stepCount === 1 ? '' : 's'}`;
    return 'Working';
  }, [presentation, stepCount, toolCount]);

  if (presentation.mode !== 'execution') return null;

  const canExpand = stepCount > 0;
  const primaryTool = presentation.tools?.[0];
  const secondaryTools = presentation.tools?.slice(1) ?? [];

  return (
    <section aria-label="Execution details" className="w-full max-w-[720px]">
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => {
            if (canExpand) setIsExpanded((prev) => !prev);
          }}
          className={[
            'w-full text-left',
            canExpand ? 'cursor-pointer' : 'cursor-default',
          ].join(' ')}
          aria-expanded={canExpand ? isExpanded : undefined}
        >
          <KivoExecutionHeader
            title={presentation.title ?? 'Working on this'}
            intent={presentation.intent}
            summary={summaryText}
            isExpanded={canExpand ? isExpanded : undefined}
            canExpand={canExpand}
          />
        </button>

        {!!presentation.tools?.length ? (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {presentation.tools.map((tool) => (
                <KivoToolPill key={tool.id} tool={tool} />
              ))}
            </div>

            {presentation.statusText ? (
              <div className="max-w-[640px] pl-[2px]">
                <KivoExecutionStatus text={presentation.statusText} />
              </div>
            ) : null}

            {primaryTool ? (
              <div className="overflow-hidden rounded-[22px] border border-black/[0.06] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
                <button
                  type="button"
                  onClick={() => {
                    if (canExpand) setIsExpanded((prev) => !prev);
                  }}
                  className={[
                    'flex w-full items-center gap-3 px-4 py-4 text-left',
                    canExpand ? 'cursor-pointer' : 'cursor-default',
                  ].join(' ')}
                  aria-expanded={canExpand ? isExpanded : undefined}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="shrink-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)]">
                        {primaryTool.icon ? (
                          <span className="text-[18px] leading-none">{primaryTool.icon}</span>
                        ) : (
                          <span className="text-[15px] leading-none">•</span>
                        )}
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="truncate text-[17px] font-semibold tracking-[-0.025em] text-[#1b1b1f]">
                        {primaryTool.label}
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {toolCount > 0 ? (
                      <span className="text-[16px] font-medium tracking-[-0.02em] text-[#8e8e93]">
                        {toolCount} result{toolCount === 1 ? '' : 's'}
                      </span>
                    ) : null}

                    {canExpand ? (
                      <span
                        className={[
                          'text-[18px] leading-none text-[#8e8e93] transition-transform duration-200',
                          isExpanded ? 'rotate-180' : '',
                        ].join(' ')}
                        aria-hidden="true"
                      >
                        ˅
                      </span>
                    ) : null}
                  </div>
                </button>
              </div>
            ) : null}

            {!!secondaryTools.length ? (
              <div className="flex flex-wrap gap-2">
                {secondaryTools.map((tool) => (
                  <KivoToolPill key={tool.id} tool={tool} />
                ))}
              </div>
            ) : null}
          </div>
        ) : presentation.statusText ? (
          <div className="pl-[2px]">
            <KivoExecutionStatus text={presentation.statusText} />
          </div>
        ) : null}

        {canExpand && isExpanded ? (
          <div className="pt-1">
            <div className="overflow-hidden rounded-[28px] border border-black/[0.06] bg-white shadow-[0_6px_18px_rgba(0,0,0,0.035)]">
              <div className="px-5 py-5">
                <KivoExecutionSteps steps={presentation.steps ?? []} />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
