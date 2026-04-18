'use client';

type PlainResponseViewProps = {
  title?: string;
  lead?: string;
  text: string;
};

type Block =
  | { type: 'paragraph'; content: string }
  | { type: 'list'; items: string[] };

function normalize(value?: string): string {
  return (value ?? '').replace(/\r/g, '').trim();
}

function isListLine(line: string): boolean {
  return /^([-•*]|\d+\.)\s+/.test(line.trim());
}

function cleanListLine(line: string): string {
  return line.trim().replace(/^([-•*]|\d+\.)\s+/, '');
}

function splitLongParagraph(text: string): string[] {
  const normalized = normalize(text);
  if (!normalized) return [];
  if (normalized.length <= 260) return [normalized];

  const sentences = normalized.match(/[^.!?]+[.!?]+|\S.+$/g) ?? [normalized];
  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences.map((item) => item.trim()).filter(Boolean)) {
    const next = current ? `${current} ${sentence}` : sentence;

    if (next.length > 240 && current) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current = next;
    }
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

function buildBlocks(text: string): Block[] {
  const normalized = normalize(text);
  if (!normalized) return [];

  const sections = normalized
    .split(/\n{2,}/)
    .map((section) => section.trim())
    .filter(Boolean);

  const blocks: Block[] = [];

  for (const section of sections) {
    const lines = section
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length > 1 && lines.every(isListLine)) {
      blocks.push({
        type: 'list',
        items: lines.map(cleanListLine),
      });
      continue;
    }

    if (lines.some(isListLine)) {
      const paragraphLines: string[] = [];
      const listItems: string[] = [];

      for (const line of lines) {
        if (isListLine(line)) {
          listItems.push(cleanListLine(line));
        } else {
          paragraphLines.push(line);
        }
      }

      if (paragraphLines.length) {
        for (const chunk of splitLongParagraph(paragraphLines.join(' '))) {
          blocks.push({ type: 'paragraph', content: chunk });
        }
      }

      if (listItems.length) {
        blocks.push({ type: 'list', items: listItems });
      }

      continue;
    }

    for (const chunk of splitLongParagraph(lines.join(' '))) {
      blocks.push({ type: 'paragraph', content: chunk });
    }
  }

  return blocks;
}

export function PlainResponseView({
  title,
  lead,
  text,
}: PlainResponseViewProps) {
  const blocks = buildBlocks(text);

  return (
    <div className="max-w-[780px] space-y-3">
      {title ? (
        <h3 className="text-[24px] font-semibold leading-[1.16] tracking-[-0.03em] text-[#1f2937]">
          {title}
        </h3>
      ) : null}

      {lead ? (
        <p className="text-[18px] leading-[1.65] tracking-[-0.015em] text-[#2f3b4b]">
          {lead}
        </p>
      ) : null}

      {blocks.length > 0 ? (
        <div className="space-y-3">
          {blocks.map((block, index) => {
            if (block.type === 'list') {
              return (
                <ul
                  key={`list-${index}`}
                  className="space-y-2 pl-5 text-[16px] leading-[1.75] tracking-[-0.01em] text-[#3f4b5c]"
                >
                  {block.items.map((item, itemIndex) => (
                    <li key={`item-${index}-${itemIndex}`}>{item}</li>
                  ))}
                </ul>
              );
            }

            const isLeadParagraph = !lead && index === 0 && block.content.length < 190;

            return (
              <p
                key={`paragraph-${index}`}
                className={
                  isLeadParagraph
                    ? 'whitespace-pre-wrap text-[17px] leading-[1.72] tracking-[-0.012em] text-[#334155]'
                    : 'whitespace-pre-wrap text-[16px] leading-[1.75] tracking-[-0.01em] text-[#3f4b5c]'
                }
              >
                {block.content}
              </p>
            );
          })}
        </div>
      ) : (
        <p className="whitespace-pre-wrap text-[16px] leading-[1.75] tracking-[-0.01em] text-[#3f4b5c]">
          {text}
        </p>
      )}
    </div>
  );
}
