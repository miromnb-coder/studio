'use client';

import type { Message } from '@/app/store/app-store';
import type {
  AgentResponseMetadata,
  AgentResponseStep,
  AgentSuggestedAction,
} from '@/types/agent-response';
import { ActionSuggestions } from './ActionSuggestions';
import { AgentWorkflowBoxes } from './AgentWorkflowBoxes';

type AgentResponseMessageProps = {
  message: Message;
  latestUserContent?: string;
};

type SupportedLocale = 'en' | 'fi' | 'sv' | 'es';

type LocaleCopy = {
  intro: string[];
};

const COPY: Record<SupportedLocale, LocaleCopy> = {
  en: {
    intro: [
      "Perfect — I'm on it.",
      "Great request. I'm working through it now.",
      "Absolutely — I'll handle this step by step.",
    ],
  },
  fi: {
    intro: [
      'Selvä juttu — hoidan tämän nyt.',
      'Hyvä pyyntö. Käyn tämän läpi nyt.',
      'Totta kai — etenen tämän kanssa vaiheittain.',
    ],
  },
  sv: {
    intro: [
      'Självklart — jag tar hand om detta nu.',
      'Bra begäran. Jag går igenom detta nu.',
      'Absolut — jag hanterar detta steg för steg.',
    ],
  },
  es: {
    intro: [
      'Perfecto — ya me encargo.',
      'Buena solicitud. La reviso ahora mismo.',
      'Claro — voy a resolver esto paso a paso.',
    ],
  },
};

const HIDDEN_PATTERNS = [
  /^plan used:/i,
  /^what i used:/i,
  /^relevant memory:/i,
  /^recommended next step:/i,
  /^what was incomplete:/i,
  /^i compared the main options/i,
  /^here’s a direct response/i,
  /^i checked the email-related context/i,
];

function normalizeText(value?: string): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\r/g, '').trim();
}

function detectLanguage(input?: string): SupportedLocale {
  const text = normalizeText(input).toLowerCase();
  if (!text) return 'en';

  const finnishScore =
    (text.match(/[äö]/g) ?? []).length * 3 +
    countMatches(text, [
      'mitä',
      'mita',
      'sinä',
      'sina',
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
      'käy',
      'tee',
      'minulle',
      'vertaa',
      'rakennetaan',
      'tarkistetaan',
    ]);

  const swedishScore =
    (text.match(/[å]/g) ?? []).length * 3 +
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
    ]);

  const spanishScore =
    (text.match(/[ñ¿¡]/g) ?? []).length * 3 +
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
    ]);

  if (finnishScore >= swedishScore && finnishScore >= spanishScore && finnishScore > 0) {
    return 'fi';
  }

  if (swedishScore >= finnishScore && swedishScore >= spanishScore && swedishScore > 0) {
    return 'sv';
  }

  if (spanishScore > 0) {
    return 'es';
  }

  return 'en';
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

function hashIndex(value: string, mod: number) {
  return [...value].reduce((acc, char) => acc + char.charCodeAt(0), 0) % mod;
}

function mapActions(actions?: AgentSuggestedAction[] | string[]): string[] {
  if (!actions) return [];

  return actions
    .map((action) => (typeof action === 'string' ? action : action.label))
    .filter((label): label is string => Boolean(label?.trim()))
    .slice(0, 4);
}

function dedupeSteps(steps?: AgentResponseStep[]): AgentResponseStep[] {
  if (!Array.isArray(steps)) return [];

  const seen = new Set<string>();
  const result: AgentResponseStep[] = [];

  for (const step of steps) {
    const action = normalizeText(step?.action);
    if (!action) continue;

    const key = action.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    result.push({
      ...step,
      action,
    });
  }

  return result;
}

function shouldHideParagraph(paragraph: string): boolean {
  const normalized = paragraph.trim();

  if (!normalized) return true;

  return HIDDEN_PATTERNS.some((pattern) => pattern.test(normalized));
}

function sanitizeVisibleContent(
  content: string,
  metadata?: AgentResponseMetadata,
): string {
  const normalized = normalizeText(content);
  if (!normalized) return '';

  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean);

  const safeParagraphs = paragraphs.filter((paragraph) => !shouldHideParagraph(paragraph));

  let joined = safeParagraphs.join('\n\n').trim();

  if (!joined && metadata?.intent === 'general') {
    return '';
  }

  if (!joined) {
    joined = normalized
      .split('\n')
      .map((line) => line.trim())
      .filter(
        (line) =>
          line &&
          !HIDDEN_PATTERNS.some((pattern) => pattern.test(line)),
      )
      .join(' ')
      .trim();
  }

  return joined;
}

function buildFallbackAnswer(locale: SupportedLocale): string {
  switch (locale) {
    case 'fi':
      return 'Valmis — tässä vastaus sinulle.';
    case 'sv':
      return 'Klart — här är svaret till dig.';
    case 'es':
      return 'Listo — aquí tienes la respuesta.';
    default:
      return 'Done — here is the answer for you.';
  }
}

export function AgentResponseMessage({
  message,
  latestUserContent,
}: AgentResponseMessageProps) {
  const locale = detectLanguage(latestUserContent);
  const copy = COPY[locale];

  const metadata = message.agentMetadata;
  const steps = dedupeSteps(metadata?.steps);
  const actions = mapActions(metadata?.suggestedActions);
  const introIndex = hashIndex(message.id, copy.intro.length);

  const visibleContent =
    sanitizeVisibleContent(message.content, metadata) ||
    buildFallbackAnswer(locale);

  return (
    <>
      <p className="mb-3 text-[15px] leading-7 tracking-[-0.015em] text-[#4c5564]">
        {copy.intro[introIndex]}
      </p>

      {steps.length > 0 ? (
        <div className="mb-4">
          <AgentWorkflowBoxes steps={steps} locale={locale} />
        </div>
      ) : null}

      <div className="whitespace-pre-wrap text-[17px] leading-[1.78] tracking-[-0.015em] text-[#454d5b]">
        {visibleContent}
      </div>

      {actions.length > 0 ? (
        <div className="mt-4">
          <ActionSuggestions actions={actions} locale={locale} />
        </div>
      ) : null}
    </>
  );
}
