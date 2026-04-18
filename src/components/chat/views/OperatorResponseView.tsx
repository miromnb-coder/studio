'use client';

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
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'opportunity' | 'risk';
}) {
  const toneClasses =
    tone === 'opportunity'
      ? 'text-[#29543d]'
      : tone === 'risk'
        ? 'text-[#7a4a34]'
        : 'text-[#334155]';

  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b98a9]">
        {label}
      </p>
      <p className={`text-[15px] leading-[1.68] ${toneClasses}`}>{value}</p>
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
    <div className="max-w-[820px] space-y-5">
      <PlainResponseView
        title={model.title}
        lead={model.lead}
        text={model.summary}
      />

      <div className="space-y-4">
        {operator.decision ? (
          <Section label="Decision" value={operator.decision} />
        ) : null}

        {operator.nextStep ? (
          <Section label="Next step" value={operator.nextStep} />
        ) : null}

        {operator.opportunity ? (
          <Section
            label="Opportunity"
            value={operator.opportunity}
            tone="opportunity"
          />
        ) : null}

        {operator.risk ? (
          <Section label="Risk" value={operator.risk} tone="risk" />
        ) : null}

        {operator.actions?.length ? (
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b98a9]">
              Actions
            </p>
            <ul className="space-y-2 pl-5 text-[15px] leading-[1.68] text-[#334155]">
              {operator.actions.map((action) => (
                <li key={action}>{action}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
