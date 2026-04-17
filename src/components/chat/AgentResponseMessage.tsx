'use client';

import { useEffect, useRef } from 'react';
import type { Message } from '@/app/store/app-store';
import { trackEvent } from '@/app/lib/analytics-client';
import { useOperatorActionHandler } from '@/app/hooks/use-operator-action-handler';
import type { AgentResponseMetadata, AgentSuggestedAction } from '@/types/agent-response';
import type { ResponseMode } from '@/agent/types/response-mode';
import { ActionSuggestions } from './ActionSuggestions';
import { OperatorActionCard } from './OperatorActionCard';

type AgentResponseMessageProps = {
  message: Message;
  latestUserContent?: string;
};

type SupportedLocale = 'en' | 'fi' | 'sv' | 'es';

type LocaleCopy = {
  intro: string[];
  fallback: string;
  brand: string;
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
  },
  fi: {
    intro: [
      'Selvä juttu! Käyn tämän läpi nyt.',
      'Hyvä pyyntö. Hoidan tämän nyt.',
      'Totta kai — etenen tämän kanssa vaiheittain.',
    ],
    fallback: 'Valmis — tässä vastaus sinulle.',
    brand: 'Lite',
  },
  sv: {
    intro: [
      'Självklart — jag tar hand om detta nu.',
      'Bra begäran. Jag går igenom detta nu.',
      'Absolut — jag hanterar detta steg för steg.',
    ],
    fallback: 'Klart — här är svaret till dig.',
    brand: 'Lite',
  },
  es: {
    intro: [
      'Perfecto — ya me encargo.',
      'Buena solicitud. La reviso ahora mismo.',
      'Claro — voy a resolver esto paso a paso.',
    ],
    fallback: 'Listo — aquí tienes la respuesta.',
    brand: 'Lite',
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

function shouldShowIntro(visibleContent: string): boolean {
  return Boolean(visibleContent);
}

function resolveMessageResponseMode(
  metadata?: AgentResponseMetadata,
): ResponseMode {
  if (
    metadata?.responseMode === 'casual' ||
    metadata?.responseMode === 'fast' ||
    metadata?.responseMode === 'operator' ||
    metadata?.responseMode === 'tool' ||
    metadata?.responseMode === 'fallback'
  ) {
    return metadata.responseMode;
  }

  const structuredMode =
    metadata?.structuredData &&
    typeof metadata.structuredData === 'object'
      ? (metadata.structuredData.response_mode as string | undefined)
      : undefined;

  if (
    structuredMode === 'casual' ||
    structuredMode === 'fast' ||
    structuredMode === 'operator' ||
    structuredMode === 'tool' ||
    structuredMode === 'fallback'
  ) {
    return structuredMode;
  }

  return 'fallback';
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
  isStreaming: boolean,
): string {
  const sanitized = sanitizeVisibleContent(content);
  if (sanitized) return sanitized;
  if (isStreaming) return '';

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
  latestUserContent
}: AgentResponseMessageProps) {
  const locale = detectLanguage(latestUserContent);
  const copy = COPY[locale];

  const metadata = message.agentMetadata;
  const responseMode = resolveMessageResponseMode(metadata);
  const isStreaming = Boolean(message.isStreaming);
  const actions = mapActions(metadata?.suggestedActions);
  const visibleContent = getSafeContent(
    message.content,
    metadata,
    locale,
    isStreaming,
  );
  const introIndex = hashIndex(message.id, copy.intro.length);
  const showIntro =
    responseMode === 'operator' || responseMode === 'tool'
      ? shouldShowIntro(visibleContent)
      : false;
  const showActions = shouldShowActions(actions, visibleContent);
  const contentBlocks = buildContentBlocks(visibleContent);
  const operatorResponse = metadata?.operatorResponse;
  const operatorActions = operatorResponse?.actions ?? [];
  const actionClickedRef = useRef(false);
  const handleOperatorAction = useOperatorActionHandler({
    messageId: message.id,
    responseMode,
    operatorResponse,
    latestUserContent,
    intent: metadata?.intent,
  });
  useEffect(() => {
    if (!operatorActions.length || isStreaming) return;

    trackEvent('operator_action_impression', {
      messageId: message.id,
      properties: {
        actionCount: operatorActions.length,
        actionKinds: operatorActions.map((action) => action.kind).join(','),
        responseMode,
        intent: metadata?.intent || 'unknown',
      },
    });
  }, [isStreaming, message.id, metadata?.intent, operatorActions, responseMode]);

  useEffect(() => {
    if (!operatorActions.length || isStreaming) return;

    return () => {
      if (actionClickedRef.current) return;
      trackEvent('operator_action_card_ignored', {
        messageId: message.id,
        properties: {
          actionCount: operatorActions.length,
          responseMode,
          intent: metadata?.intent || 'unknown',
        },
      });
    };
  }, [isStreaming, message.id, metadata?.intent, operatorActions.length, responseMode]);

  return (
    <div className="max-w-full">
      <div className="mb-5 flex items-center gap-3">
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
      </div>

      {showIntro ? (
        <p className="mb-6 max-w-[780px] text-[18px] leading-[1.5] tracking-[-0.024em] text-[#2f3947]">
          {copy.intro[introIndex]}
        </p>
      ) : null}

      <div className="max-w-none space-y-5">
        {contentBlocks.length > 0 ? (
          contentBlocks.map((block, index) => {
            if (block.type === 'list') {
              return (
                <ul
                  key={`list-${index}`}
                  className="space-y-2.5 pl-1 text-[17px] leading-[1.74] tracking-[-0.016em] text-[#36414f]"
                >
                  {block.items.map((item, itemIndex) => (
                    <li key={`item-${index}-${itemIndex}`} className="flex gap-3.5">
                      <span className="mt-[11px] inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#97a3b2]" />
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
                    ? 'max-w-[760px] text-[20px] leading-[1.56] tracking-[-0.026em] text-[#2f3947]'
                    : 'max-w-[760px] text-[17px] leading-[1.74] tracking-[-0.016em] text-[#36414f]'
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

      <OperatorActionCard
        operatorResponse={operatorResponse}
        userInput={latestUserContent}
        intent={metadata?.intent}
        responseMode={responseMode}
        onActionClick={(actionId) => {
          const action = operatorActions.find((item) => item.id === actionId);
          if (!action) return;
          actionClickedRef.current = true;
          void handleOperatorAction(action);
        }}
      />

      {showActions ? (
        <div className="mt-6">
          <ActionSuggestions
            actions={actions}
            locale={locale}
            onActionClick={(actionLabel) => {
              const action = operatorActions.find((item) => item.label === actionLabel);
              if (!action) return;
              actionClickedRef.current = true;
              void handleOperatorAction(action);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
