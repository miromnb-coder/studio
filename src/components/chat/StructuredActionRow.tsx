'use client';

import { useRouter } from 'next/navigation';
import type { StructuredAction } from '@/agent/vNext/types';

type StructuredActionRowProps = {
  actions: StructuredAction[];
};

function resolveActionHref(actionId: string): string | null {
  switch (actionId) {
    case 'open_calendar':
      return '/calendar';
    case 'show_emails':
      return '/tools/email';
    case 'refine_plan':
      return '/chat';
    case 'next_step':
      return '/actions';
    default:
      return '/chat';
  }
}

export function StructuredActionRow({ actions }: StructuredActionRowProps) {
  const router = useRouter();

  if (!actions.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {actions.map((action) => {
        const isPrimary = (action.kind ?? 'secondary') === 'primary';

        return (
          <button
            key={action.id}
            type="button"
            onClick={() => {
              const href = resolveActionHref(action.id);
              if (href) {
                router.push(href);
                return;
              }
              router.push('/chat');
            }}
            className={`rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-colors ${
              isPrimary
                ? 'bg-[#1f2937] text-white hover:bg-[#111827]'
                : 'border border-[#dce4ef] bg-[#f9fbfe] text-[#445066] hover:bg-white'
            }`}
          >
            {action.label}
          </button>
        );
      })}
    </div>
  );
}
