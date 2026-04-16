'use client';

import type { Message } from '@/app/store/app-store';
import type {
  AgentResponseMetadata,
  AgentResponseStep,
  AgentSuggestedAction,
} from '@/types/agent-response';
import { ActionSuggestions } from './ActionSuggestions';
import { AgentWorkflowBoxes } from './AgentWorkflowBoxes';
import { OperatorResponseCard } from './OperatorResponseCard';

type AgentResponseMessageProps = {
  message: Message;
  latestUserContent?: string;
  liveSteps?: AgentResponseStep[];
};

type SupportedLocale = 'en' | 'fi' | 'sv' | 'es';

type LocaleCopy = {
  intro: string[];
  fallback: string;
  brand: string;
  thinking: string;
};

const COPY: Record<SupportedLocale, LocaleCopy> = {
  en: {
    intro: [
      "Perfect — I'm on it.",
      "Great request. I'm working through it now.",
      "Absolutely — I'll handle this step by step.",
    ],
    fallback: 'Done — here is the answer for you.',
    brand: 'Lite',
    thinking: 'Thinking through the best answer.',
  },
  fi: {
    intro: [
      'Selvä juttu! Käyn tämän läpi nyt.',
      'Hyvä pyyntö. Hoidan tämän nyt.',
      'Totta kai — etenen tämän kanssa vaiheittain.',
    ],
    fallback: 'Valmis — tässä vastaus sinulle.',
    brand: 'Lite',
    thinking: 'Mietin tähän parasta vastausta.',
  },
  sv: {
    intro: [
      'Självklart — jag tar hand om detta nu.',
      'Bra begäran. Jag går igenom detta nu.',
      'Absolut — jag hanterar detta steg för steg.',
    ],
    fallback: 'Klart — här är svaret till dig.',
    brand: 'Lite',
    thinking: 'Jag arbetar fram det bästa svaret.',
  },
  es: {
    intro: [
      'Perfecto — ya me encargo.',
      'Buena solicitud. La reviso ahora mismo.',
      'Claro — voy a resolver esto paso a paso.',
    ],
    fallback: 'Listo — aquí tienes la respuesta.',
    brand: 'Lite',
    thinking: 'Estoy elaborando la mejor respuesta.',
  },
};

const HIDDEN_PATTERNS = [
  /^plan used:/i,
  /^what i used:/i,
  /^relevant memory:/i,
  /^recommended next step:/i,
  /^what was incomplete:/i,
  /^i compared the main options/i,
  /^here[’']?s a direct response/i,
  /^i checked the email-related context/i,
  /^-?\s*memory:/i,
  /^-?\s*gmail:/i,
  /^-?\s*web:/i,
  /^-?\s*compare:/i,
  /^-?\s*calendar:/i,
  /^-?\s*finance:/i,
  /^-?\s*notes:/i,
  /^-?\s*file:/i,
  /^-?\s*tool:/i,
  /^relevant memory\b/i,
  /^what i used\b/i,
  /^recommended next step\b/i,
];

function normalizeText(value?: string): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\r/g, '').trim();
}

function countMatches(text: string, words: string[]): number {
  let score = 0;

  for (const word of words) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`\\b${escaped}\\b`, 'i').test(text)) {
      score += 1;
    }
  }

  return score;
}

function detectLanguage(input?: string): SupportedLocale {
  const text = normalizeText(input).toLowerCase();
  if (!text) return 'en';

  const finnishScore =
    (text.match(/[äö]/g) ?? []).length * 4 +
    countMatches(text, [
      'mitä',
      'mita',
      'sinulle',
      'kuuluu',
      'että',
      'tämä',
      'hyvä',
      'vaihe',
      'muisti',
      'vastaus',
      'suomeksi',
      'haluan',
      'kanssa',
      'käyn',
      'tee',
      'minulle',
      'vertaa',
      'rakennetaan',
      'tarkistetaan',
      'haetaan',
      'pyyntö',
      'laatu',
      'nyt',
      'selvä',
    ]);

  const swedishScore =
    (text.match(/[å]/g) ?? []).length * 4 +
    countMatches(text, [
      'jag',
      'och',
      'detta',
      'för',
      'självklart',
      'svar',
      'minne',
      'begäran',
      'hanterar',
      'steg',
      'svenska',
      'hur',
      'mår',
      'vad',
      'med',
      'inte',
      'hämtar',
      'bygger',
      'kvalitet',
      'nu',
    ]);

  const spanishScore =
    (text.match(/[ñ¿¡]/g) ?? []).length * 4 +
    countMatches(text, [
      'hola',
      'respuesta',
      'quiero',
      'para',
      'como',
      'qué',
      'que',
      'con',
      'paso',
      'memoria',
      'analiza',
      'compara',
      'español',
      'ahora',
      'construyendo',
    ]);

  if (
    finnishScore >= swedishScore &&
    finnishScore >= spanishScore &&
    finnishScore > 0
  ) {
    return 'fi';
  }

  if (
    swedishScore > finnishScore &&
    swedishScore >= spanishScore &&
    swedishScore > 0
  ) {
    return 'sv';
  }

  if (spanishScore > 0) {
    return 'es';
  }

  return 'en';
}

function hashIndex(value: string, mod: number): number {
  return [...value].reduce((acc, char) => acc + char.charCodeAt(0), 0) % mod;
}

function mapActions(actions?: AgentSuggestedAction[] | string[]): string[] {
  if (!actions) return [];

  return actions
    .map((action) => (typeof action === 'string' ? action : action.label))
    .map((label) => normalizeText(label))
    .filter((label): label is string => Boolean(label))
    .slice(0, 4);
}

function dedupeSteps(steps?: AgentResponseStep[]): AgentResponseStep[] {
  if (!Array.isArray(steps)) return [];

  const seen = new Set<string>();
  const result: AgentResponseStep[] = [];

  for (const step of steps) {
    const action = normalizeText(
      step?.action ||
        (
          step as AgentResponseStep & {
            label?: string;
            title?: string;
            id?: string;
          }
        ).label ||
        (
          step as AgentResponseStep & {
            label?: string;
            title?: string;
            id?: string;
          }
        ).title ||
        (
          step as AgentResponseStep & {
            label?: string;
            title?: string;
            id?: string;
          }
        ).id,
    );

    if (!action) continue;

    const summary = normalizeText(step?.summary);
    const tool = normalizeText(step?.tool);
    const key = `${action.toLowerCase()}|${tool.toLowerCase()}`;

    if (seen.has(key)) continue;
    seen.add(key);

    result.push({
      ...step,
      action,
      summary,
      tool,
    });
  }

  return result;
}

function shouldHideLine(line: string): boolean {
  const normalized = line.trim();
  if (!normalized) return true;

  return HIDDEN_PATTERNS.some((pattern) => pattern.test(normalized));
}

function sanitizeVisibleContent(content: string): string {
  const normalized = normalizeText(content);
  if (!normalized) return '';

  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((paragraph) => !shouldHideLine(paragraph));

  let joined = paragraphs.join('\n\n').trim();

  if (!joined) {
    joined = normalized
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !shouldHideLine(line))
      .join(' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  return joined;
}

function shouldShowIntro(
  visibleContent: string,
  steps: AgentResponseStep[],
): boolean {
  return Boolean(steps.length || visibleContent);
}

function shouldShowActions(
  actions: string[],
  visibleContent: string,
): boolean {
  return actions.length > 0 && Boolean(visibleContent);
}

function getSafeContent(
  content: string,
  metadata: AgentResponseMetadata | undefined,
  locale: SupportedLocale,
): string {
  const sanitized = sanitizeVisibleContent(content);
  if (sanitized) return sanitized;

  if (metadata?.intent === 'general') {
    return COPY[locale].fallback;
  }

  return COPY[locale].fallback;
}

type ContentBlock =
  | { type: 'paragraph'; content: string }
  | { type: 'list'; items: string[] };

function isListLine(line: string): boolean {
  return /^([-•*]|\d+\.)\s+/.test(line.trim());
}

function cleanListLine(line: string): string {
  return line.trim().replace(/^([-•*]|\d+\.)\s+/, '');
}

function splitLongParagraph(text: string): string[] {
  const normalized = normalizeText(text);
  if (normalized.length <= 240) return [normalized];

  const sentences = normalized.match(/[^.!?]+[.!?]+|\S.+$/g) ?? [normalized];
  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences.map((item) => item.trim()).filter(Boolean)) {
    const next = current ? `${current} ${sentence}` : sentence;
    if (next.length > 220 && current) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current = next;
    }
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

function buildContentBlocks(content: string): ContentBlock[] {
  const normalized = sanitizeVisibleContent(content);
  if (!normalized) return [];

  const rawSections = normalized
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean);

  const blocks: ContentBlock[] = [];

  for (const section of rawSections) {
    const lines = section.split('\n').map((line) => line.trim()).filter(Boolean);

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

export function AgentResponseMessage({
  message,
  latestUserContent,
  liveSteps,
}: AgentResponseMessageProps) {
  const locale = detectLanguage(latestUserContent);
  const copy = COPY[locale];

  const metadata = message.agentMetadata;
  const steps =
    message.isStreaming && liveSteps?.length
      ? liveSteps
      : message.agentMetadata?.steps ?? [];
  const resolvedSteps = dedupeSteps(steps).slice(0, 5);

  const actions = mapActions(metadata?.suggestedActions);
  const visibleContent = getSafeContent(message.content, metadata, locale);
  const introIndex = hashIndex(message.id, copy.intro.length);
  const showIntro = shouldShowIntro(visibleContent, resolvedSteps);
  const showActions = shouldShowActions(actions, visibleContent);
  const isStreaming = Boolean(message.isStreaming);
  const contentBlocks = buildContentBlocks(visibleContent);
  const operatorResponse = metadata?.operatorResponse;

  return (
    <div className="max-w-full">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className="text-[22px] font-normal leading-none tracking-[-0.04em] text-[#232c39]"
            style={{
              fontFamily:
                'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
            }}
          >
            Kivo
          </span>

          <span className="rounded-full border border-[rgba(208,214,224,0.8)] bg-[rgba(236,240,245,0.86)] px-2.5 py-0.5 text-[11px] font-medium tracking-[-0.01em] text-[#677383] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
            {copy.brand}
          </span>
        </div>

        {isStreaming ? (
          <span className="text-[11px] font-medium tracking-[0.01em] text-[#8f98a7]">
            {copy.thinking}
          </span>
        ) : null}
      </div>

      {showIntro ? (
        <p className="mb-6 max-w-[780px] text-[18px] leading-[1.5] tracking-[-0.024em] text-[#2f3947]">
          {copy.intro[introIndex]}
        </p>
      ) : null}

      {resolvedSteps.length > 0 ? (
        <div className="mb-7">
          <AgentWorkflowBoxes steps={resolvedSteps} locale={locale} />
        </div>
      ) : null}

      <div className="max-w-none space-y-4">
        {contentBlocks.length > 0 ? (
          contentBlocks.map((block, index) => {
            if (block.type === 'list') {
              return (
                <ul
                  key={`list-${index}`}
                  className="space-y-2 pl-1 text-[17px] leading-[1.72] tracking-[-0.018em] text-[#36414f]"
                >
                  {block.items.map((item, itemIndex) => (
                    <li key={`item-${index}-${itemIndex}`} className="flex gap-3">
                      <span className="mt-[10px] inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#97a3b2]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              );
            }

            const isLead = index === 0 && block.content.length < 140;
            return (
              <p
                key={`paragraph-${index}`}
                className={
                  isLead
                    ? 'max-w-[760px] text-[19px] leading-[1.58] tracking-[-0.024em] text-[#2f3947]'
                    : 'max-w-[760px] text-[17px] leading-[1.72] tracking-[-0.018em] text-[#36414f]'
                }
              >
                {block.content}
              </p>
            );
          })
        ) : (
          <div className="text-[17px] leading-[1.72] tracking-[-0.018em] text-[#36414f]">
            {visibleContent}
          </div>
        )}
      </div>

      <OperatorResponseCard operatorResponse={operatorResponse} />

      {showActions ? (
        <div className="mt-6">
          <ActionSuggestions actions={actions} locale={locale} />
        </div>
      ) : null}
    </div>
  );
}
