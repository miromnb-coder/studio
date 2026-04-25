'use client';

import { motion } from 'framer-motion';

type PlainResponseViewProps = {
  title?: string;
  lead?: string;
  text: string;
  isStreaming?: boolean;
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
  if (normalized.length <= 300) return [normalized];
  const sentences = normalized.match(/[^.!?]+[.!?]+|\S.+$/g) ?? [normalized];
  const chunks: string[] = [];
  let current = '';
  for (const sentence of sentences.map((item) => item.trim()).filter(Boolean)) {
    const next = current ? `${current} ${sentence}` : sentence;
    if (next.length > 260 && current) {
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
  const sections = normalized.split(/\n{2,}/).map((section) => section.trim()).filter(Boolean);
  const blocks: Block[] = [];
  for (const section of sections) {
    const lines = section.split('\n').map((line) => line.trim()).filter(Boolean);
    if (lines.length > 1 && lines.every(isListLine)) {
      blocks.push({ type: 'list', items: lines.map(cleanListLine) });
      continue;
    }
    if (lines.some(isListLine)) {
      const paragraphLines: string[] = [];
      const listItems: string[] = [];
      for (const line of lines) {
        if (isListLine(line)) listItems.push(cleanListLine(line));
        else paragraphLines.push(line);
      }
      if (paragraphLines.length) {
        for (const chunk of splitLongParagraph(paragraphLines.join(' '))) blocks.push({ type: 'paragraph', content: chunk });
      }
      if (listItems.length) blocks.push({ type: 'list', items: listItems });
      continue;
    }
    for (const chunk of splitLongParagraph(lines.join(' '))) blocks.push({ type: 'paragraph', content: chunk });
  }
  return blocks;
}

function Cursor({ show }: { show?: boolean }) {
  if (!show) return null;
  return <span className="ml-[2px] inline-block h-[1em] w-[2px] translate-y-[2px] animate-[kivoCursorBlink_0.95s_steps(2,start)_infinite] rounded-full bg-[#6b7280]" />;
}

function renderStreamingText(content: string, showCursor: boolean) {
  const match = content.match(/^(.*?)(\S+)(\s*)$/s);
  if (!match) return <>{content}<Cursor show={showCursor} /></>;
  const [, before, lastWord, trailing] = match;
  return <>{before}<motion.span key={content.length} initial={{ opacity: 0.72 }} animate={{ opacity: 1 }} transition={{ duration: 0.16 }} className="text-[#111827]">{lastWord}</motion.span>{trailing}<Cursor show={showCursor} /></>;
}

export function PlainResponseView({ title, lead, text, isStreaming = false }: PlainResponseViewProps) {
  const blocks = buildBlocks(text);
  return (
    <motion.div layout animate={isStreaming ? { opacity: 1 } : { opacity: [0.985, 1], y: [1, 0] }} transition={{ duration: 0.22, ease: 'easeOut' }} className="max-w-[800px] space-y-3.5">
      <style jsx>{`@keyframes kivoCursorBlink{0%,45%{opacity:1}46%,100%{opacity:0}}`}</style>
      {title ? <h3 className="text-[23px] font-semibold leading-[1.15] tracking-[-0.03em] text-[#1f2937]">{title}</h3> : null}
      {lead ? <p className="text-[17px] leading-[1.68] tracking-[-0.014em] text-[#2f3b4b]">{lead}</p> : null}
      {blocks.length > 0 ? (
        <div className="space-y-3.5">
          {blocks.map((block, index) => {
            const isLastBlock = index === blocks.length - 1;
            if (block.type === 'list') {
              return (
                <ul key={`list-${index}`} className="space-y-2.5 pl-5 text-[15px] leading-[1.74] tracking-[-0.01em] text-[#405063]">
                  {block.items.map((item, itemIndex) => {
                    const isLastItem = isLastBlock && itemIndex === block.items.length - 1;
                    return <li key={`item-${index}-${itemIndex}`}>{isStreaming && isLastItem ? renderStreamingText(item, true) : item}</li>;
                  })}
                </ul>
              );
            }
            const isLeadParagraph = !lead && index === 0 && block.content.length < 190;
            return (
              <p key={`paragraph-${index}`} className={isLeadParagraph ? 'whitespace-pre-wrap text-[16.5px] leading-[1.72] tracking-[-0.012em] text-[#334155]' : 'whitespace-pre-wrap text-[15px] leading-[1.76] tracking-[-0.01em] text-[#405063]'}>
                {isStreaming && isLastBlock ? renderStreamingText(block.content, true) : block.content}
              </p>
            );
          })}
        </div>
      ) : (
        <p className="whitespace-pre-wrap text-[15px] leading-[1.76] tracking-[-0.01em] text-[#405063]">{isStreaming ? renderStreamingText(text, true) : text}</p>
      )}
    </motion.div>
  );
}
