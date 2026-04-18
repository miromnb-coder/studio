'use client';

import type { PresentationModel } from '@/lib/presentation/build-presentation-model';

type EmailResponseViewProps = {
  model: PresentationModel;
};

export function EmailResponseView({ model }: EmailResponseViewProps) {
  return (
    <div className="max-w-[820px] space-y-3">
      <p className="whitespace-pre-wrap text-[16px] leading-[1.75] tracking-[-0.01em] text-[#3f4b5c]">{model.summary}</p>
      <div className="space-y-2">
        {model.emails.map((email) => (
          <div key={email.id} className="rounded-[16px] border border-[#e6ecf4] bg-white p-3.5">
            <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#8d9aae]">{email.sender}</p>
            <p className="mt-1 text-[14px] font-semibold text-[#273446]">{email.subject}</p>
            <p className="mt-1 text-[13px] leading-[1.6] text-[#5f6d80]">{email.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
