'use client';

import type { PresentationModel } from '@/lib/presentation/build-presentation-model';

type OperatorResponseViewProps = {
  model: PresentationModel;
};

export function OperatorResponseView({ model }: OperatorResponseViewProps) {
  const operator = model.operator;

  return (
    <div className="max-w-[840px] space-y-4">
      <p className="whitespace-pre-wrap text-[16px] leading-[1.75] tracking-[-0.01em] text-[#3f4b5c]">{model.summary}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {operator?.decision ? <Card title="Decision" value={operator.decision} /> : null}
        {operator?.nextStep ? <Card title="Next step" value={operator.nextStep} /> : null}
        {operator?.opportunity ? <Card title="Opportunity" value={operator.opportunity} /> : null}
        {operator?.risk ? <Card title="Risk" value={operator.risk} /> : null}
      </div>
      {operator?.actions?.length ? (
        <div className="rounded-[18px] border border-[#e6ecf4] bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b98a9]">Actions</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[14px] text-[#445569]">
            {operator.actions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-[#e6ecf4] bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b98a9]">{title}</p>
      <p className="mt-1 text-[14px] leading-[1.6] text-[#34475c]">{value}</p>
    </div>
  );
}
