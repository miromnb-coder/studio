'use client';

import type { ResponsePresentation } from '@/lib/presentation/build-presentation-model';
import { PlainResponseView } from './PlainResponseView';

type EmailResponseViewProps = {
  presentation: ResponsePresentation;
};

function importanceTone(importance?: 'urgent' | 'important' | 'normal') {
  if (importance === 'urgent') {
    return {
      badge:
        'border-[rgba(245,158,11,0.24)] bg-[rgba(255,247,237,0.92)] text-[#9a5b11]',
      card:
        'border-[rgba(245,158,11,0.18)] bg-[linear-gradient(180deg,rgba(255,251,245,0.98),rgba(255,255,255,0.98))]',
      marker: 'bg-[#f59e0b]',
      label: 'Urgent',
    };
  }

  if (importance === 'important') {
    return {
      badge:
        'border-[rgba(59,130,246,0.18)] bg-[rgba(239,246,255,0.92)] text-[#355678]',
      card:
        'border-[rgba(59,130,246,0.14)] bg-[linear-gradient(180deg,rgba(248,251,255,0.98),rgba(255,255,255,0.98))]',
      marker: 'bg-[#7aa2d6]',
      label: 'Important',
    };
  }

  return {
    badge:
      'border-[rgba(226,232,240,0.92)] bg-[rgba(255,255,255,0.92)] text-[#748297]',
    card:
      'border-[rgba(231,237,245,0.96)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(251,253,255,0.98))]',
    marker: 'bg-[#c8d3e1]',
    label: 'Message',
  };
}

export function EmailResponseView({ presentation }: EmailResponseViewProps) {
  const messages = presentation.email.messages;

  if (!messages.length) {
    return (
      <PlainResponseView
        title={presentation.title || undefined}
        lead={presentation.lead || undefined}
        text={presentation.plainText || presentation.summary || ''}
      />
    );
  }

  return (
    <div className="max-w-[840px] space-y-4">
      <PlainResponseView
        title={presentation.title || undefined}
        lead={presentation.lead || undefined}
        text={presentation.summary || presentation.plainText || ''}
      />

      {presentation.email.urgentLabel ? (
        <div className="rounded-[18px] border border-[rgba(245,158,11,0.18)] bg-[linear-gradient(180deg,rgba(255,251,245,0.98),rgba(255,255,255,0.98))] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9a5b11]">
            Attention
          </p>
          <p className="mt-1 text-[14px] leading-[1.65] text-[#6a5540]">
            {presentation.email.urgentLabel}
          </p>
        </div>
      ) : null}

      <div className="space-y-3">
        {messages.map((message, index) => {
          const tone = importanceTone(message.importance);

          const content = (
            <>
              <div className="flex items-start gap-3">
                <div className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${tone.marker}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${tone.badge}`}
                    >
                      {tone.label}
                    </span>
                    {message.sender ? (
                      <span className="text-[12px] font-medium text-[#748297]">
                        {message.sender}
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-2 text-[15px] font-semibold leading-[1.45] tracking-[-0.015em] text-[#223042]">
                    {index + 1}. {message.subject}
                  </p>

                  {message.preview ? (
                    <p className="mt-2 text-[13.5px] leading-[1.68] text-[#5f6d80]">
                      {message.preview}
                    </p>
                  ) : null}
                </div>
              </div>
            </>
          );

          if (message.href) {
            return (
              <a
                key={message.id}
                href={message.href}
                target="_blank"
                rel="noreferrer"
                className={`block rounded-[20px] border p-4 transition hover:shadow-[0_10px_24px_rgba(15,23,42,0.05)] ${tone.card}`}
              >
                {content}
              </a>
            );
          }

          return (
            <div
              key={message.id}
              className={`rounded-[20px] border p-4 ${tone.card}`}
            >
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
