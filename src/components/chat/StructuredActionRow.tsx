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
              router.push(href || '/chat');
            }}
            className={[
              'inline-flex items-center justify-center rounded-full px-3.5 py-2 text-[13px] font-medium tracking-[-0.01em] transition-all duration-200',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#cfd8e6] focus-visible:ring-offset-2',
              isPrimary
                ? 'bg-[#1f2937] text-white shadow-[0_4px_14px_rgba(31,41,55,0.12)] hover:bg-[#161e2a] active:scale-[0.98]'
                : 'bg-transparent text-[#556274] hover:bg-[#f5f7fb] active:scale-[0.98]',
            ].join(' ')}
          >
            {action.label}
          </button>
        );
      })}
    </div>
  );
}
