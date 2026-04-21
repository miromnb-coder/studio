'use client';

type KivoExecutionHeaderProps = {
  title: string;
  intent?: string;
  summary?: string;
  isExpanded?: boolean;
  canExpand?: boolean;
};

function getIntentDot(intent?: string) {
  switch (intent) {
    case 'email':
      return 'bg-[#4f7cff]';
    case 'calendar':
      return 'bg-[#34c759]';
    case 'browser':
      return 'bg-[#ff9500]';
    case 'memory':
      return 'bg-[#af52de]';
    case 'files':
      return 'bg-[#5ac8fa]';
    default:
      return 'bg-[#6e6e73]';
  }
}

export function KivoExecutionHeader({
  title,
  intent,
  summary,
  isExpanded,
  canExpand,
}: KivoExecutionHeaderProps) {
  const dotColor = getIntentDot(intent);

  return (
    <div className="w-full">
      <div className="flex items-start gap-3">
        <span className="relative mt-[4px] flex h-4 w-4 shrink-0 items-center justify-center">
          <span
            className={`absolute h-4 w-4 rounded-full ${dotColor} opacity-20 blur-[5px] animate-[kivoHeaderPulse_2.6s_ease-in-out_infinite]`}
          />
          <span
            className={`relative h-2.5 w-2.5 rounded-full ${dotColor} shadow-[0_0_10px_rgba(79,124,255,0.25)]`}
          />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <h4 className="min-w-0 flex-1 text-[17px] font-semibold leading-[1.25] tracking-[-0.03em] text-[#1b1b1f]">
              {title}
            </h4>

            {canExpand ? (
              <span
                className={[
                  'mt-[1px] shrink-0 text-[18px] leading-none text-[#8e8e93] transition-transform duration-200',
                  isExpanded ? 'rotate-180' : '',
                ].join(' ')}
                aria-hidden="true"
              >
                ˅
              </span>
            ) : null}
          </div>

          {summary ? (
            <p className="mt-1 max-w-[620px] text-[15px] leading-[1.45] tracking-[-0.015em] text-[#6e6e73]">
              {summary}
            </p>
          ) : null}
        </div>
      </div>

      <style jsx>{`
        @keyframes kivoHeaderPulse {
          0%,
          100% {
            transform: scale(0.92);
            opacity: 0.18;
          }
          50% {
            transform: scale(1.22);
            opacity: 0.34;
          }
        }
      `}</style>
    </div>
  );
}
