'use client';

type WebSource = {
  url?: string;
  title?: string;
};

function getHostname(url?: string) {
  if (!url) return '';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

export function KivoWebSourceCards({
  sources,
}: {
  sources: WebSource[];
}) {
  if (!sources.length) return null;

  return (
    <div className="mt-4 space-y-2">
      <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#8a94a6]">
        Sources
      </div>

      <div className="grid gap-2">
        {sources.map((source, index) => {
          const href = source.url?.trim() || '#';
          const title =
            source.title?.trim() || getHostname(source.url) || `Source ${index + 1}`;
          const hostname = getHostname(source.url);

          return (
            <a
              key={`${href}-${index}`}
              href={href}
              target="_blank"
              rel="noreferrer"
              className="block rounded-2xl border border-black/[0.06] bg-white/72 px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.04)] backdrop-blur-xl transition-colors hover:bg-white/90"
            >
              <div className="text-[14px] font-medium text-[#2d3440]">{title}</div>

              {hostname ? (
                <div className="mt-1 text-[12px] text-[#7a8493]">{hostname}</div>
              ) : null}
            </a>
          );
        })}
      </div>
    </div>
  );
}

export default KivoWebSourceCards;
