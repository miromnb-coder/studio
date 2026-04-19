'use client';

import { AlertTriangle, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import type { PresentationModel } from '@/lib/presentation/build-presentation-model';
import { PlainResponseView } from './PlainResponseView';

type OperatorResponseViewProps = {
  model: PresentationModel;
};

function hasOperatorSections(model: PresentationModel): boolean {
  const operator = model.operator;

  return Boolean(
    operator?.decision ||
      operator?.nextStep ||
      operator?.risk ||
      operator?.opportunity ||
      (operator?.actions?.length ?? 0) > 0,
  );
}

function Section({
  icon,
  label,
  value,
  tone = 'default',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: 'default' | 'opportunity' | 'risk';
}) {
  const toneClasses =
    tone === 'opportunity'
      ? {
          wrap: 'border-[rgba(34,197,94,0.14)] bg-[linear-gradient(180deg,rgba(240,253,244,0.92),rgba(255,255,255,0.98))]',
          text: 'text-[#29543d]',
          label: 'text-[#3d6a4f]',
        }
      : tone === 'risk'
        ? {
            wrap: 'border-[rgba(245,158,11,0.16)] bg-[linear-gradient(180deg,rgba(255,251,235,0.92),rgba(255,255,255,0.98))]',
            text: 'text-[#7a4a34]',
            label: 'text-[#8c6744]',
          }
        : {
            wrap: 'border-[#e7edf5] bg-[linear-gradient(180deg,#ffffff,#fbfdff)]',
            text: 'text-[#334155]',
            label: 'text-[#7d8ca0]',
          };

  return (
    <div className={`rounded-[20px] border p-4 ${toneClasses.wrap}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0 text-[#8ca0b8]">{icon}</div>
        <div className="min-w-0">
          <p className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${toneClasses.label}`}>
            {label}
          </p>
          <p className={`mt-2 text-[14px] leading-[1.68] ${toneClasses.text}`}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

export function OperatorResponseView({ model }: OperatorResponseViewProps) {
  const operator = model.operator;

  if (!operator || !hasOperatorSections(model)) {
    return (
      <PlainResponseView
        title={model.title}
        lead={model.lead}
        text={model.plainText || model.summary}
      />
    );
  }

  return (
    <div className="max-w-[880px] space-y-5">
      <PlainResponseView
        title={model.title}
        lead={model.lead}
        text={model.summary || model.plainText}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        {operator.decision ? (
          <Section
            icon={<Sparkles className="h-4 w-4" />}
            label="Decision"
            value={operator.decision}
          />
        ) : null}

        {operator.nextStep ? (
          <Section
            icon={<ArrowRight className="h-4 w-4" />}
            label="Next step"
            value={operator.nextStep}
          />
        ) : null}

        {operator.opportunity ? (
          <Section
            icon={<CheckCircle2 className="h-4 w-4" />}
            label="Opportunity"
            value={operator.opportunity}
            tone="opportunity"
          />
        ) : null}

        {operator.risk ? (
          <Section
            icon={<AlertTriangle className="h-4 w-4" />}
            label="Risk"
            value={operator.risk}
            tone="risk"
          />
        ) : null}
      </div>

      {operator.actions?.length ? (
        <div className="rounded-[22px] border border-[#e7edf5] bg-[linear-gradient(180deg,#ffffff,#fbfdff)] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b98a9]">
            Actions
          </p>

          <ul className="mt-3 space-y-3">
            {operator.actions.map((action, index) => (
              <li
                key={action}
                className="flex items-start gap-3 rounded-[16px] border border-[#edf2f7] bg-white px-3.5 py-3"
              >
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#e5ecf4] bg-[#f8fbff] text-[11px] font-semibold text-[#5d7088]">
                  {index + 1}
                </div>
                <p className="text-[14px] leading-[1.65] text-[#334155]">{action}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
