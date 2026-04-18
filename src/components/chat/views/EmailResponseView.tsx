'use client';

import type { PresentationModel } from '@/lib/presentation/build-presentation-model';
import { PlainResponseView } from './PlainResponseView';

type EmailResponseViewProps = {
  model: PresentationModel;
};

export function EmailResponseView({ model }: EmailResponseViewProps) {
  if (!model.emails.length) {
    return (
      <PlainResponseView
        title={model.title}
        lead={model.lead}
        text={model.plainText || model.summary}
      />
    );
  }

  return (
    <div className="max-w-[820px] space-y-4">
      <PlainResponseView
        title={model.title}
        lead={model.lead}
        text={model.summary}
      />

      <div className="space-y-3">
        {model.emails.map((email, index) => (
          <div
            key={email.id}
            className="border-b border-[rgba(226,232,240,0.8)] pb-3 last:border-b-0 last:pb-0"
          >
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#8d9aae]">
                From
              </span>
              <span className="text-[14px] font-semibold text-[#273446]">
                {email.sender}
              </span>
            </div>

            <p className="mt-1 text-[15px] font-semibold leading-[1.45] text-[#243041]">
              {index + 1}. {email.subject}
            </p>

            <p className="mt-1 text-[14px] leading-[1.68] text-[#5f6d80]">
              {email.summary}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
