'use client';

import type { Message } from '@/app/store/app-store';
import type { AgentSuggestedAction } from '@/types/agent-response';
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
      'Perfect — I\'m on it.',
      'Great request. I\'m working through it now.',
      'Absolutely — I\'ll handle this step by step.',
    ],
  },
  fi: {
    intro: [
      'Selvä — hoidan tämän nyt.',
      'Hyvä pyyntö. Käyn sen läpi juuri nyt.',
      'Totta kai — etenen tämän kanssa vaiheittain.',
    ],
  },
  sv: {
    intro: [
      'Absolut — jag tar hand om detta nu.',
      'Bra begäran. Jag går igenom den nu.',
      'Självklart — jag hanterar detta steg för steg.',
    ],
  },
  es: {
    intro: [
      'Perfecto — ya me encargo.',
      'Excelente solicitud. La estoy resolviendo ahora.',
      'Claro — voy a manejar esto paso a paso.',
    ],
  },
};

function detectLanguage(input?: string): SupportedLocale {
  const text = input?.trim().toLowerCase();
  if (!text) return 'en';

  if (/[ñ¿¡]/.test(text) || /\b(el|la|los|las|que|para|con|esto|respuesta)\b/.test(text)) {
    return 'es';
  }

  if (/[åäö]/.test(text) || /\b(och|inte|jag|detta|för|att|som)\b/.test(text)) {
    return 'sv';
  }

  if (/[äö]/.test(text) || /\b(ja|ei|että|sinulle|tämä|vaihe|kanssa)\b/.test(text)) {
    return 'fi';
  }

  return 'en';
}

function hashIndex(value: string, mod: number) {
  return [...value].reduce((acc, char) => acc + char.charCodeAt(0), 0) % mod;
}

function mapActions(actions?: AgentSuggestedAction[] | string[]) {
  if (!actions) return [] as string[];
  return actions
    .map((action) => (typeof action === 'string' ? action : action.label))
    .filter((label): label is string => Boolean(label));
}

export function AgentResponseMessage({ message, latestUserContent }: AgentResponseMessageProps) {
  const locale = detectLanguage(latestUserContent);
  const copy = COPY[locale];

  const metadata = message.agentMetadata;
  const steps = metadata?.steps ?? [];
  const actions = mapActions(metadata?.suggestedActions);

  const introIndex = hashIndex(message.id, copy.intro.length);

  return (
    <>
      <p className="mb-2 text-[14px] text-[#4f5969]">{copy.intro[introIndex]}</p>

      <AgentWorkflowBoxes steps={steps} locale={locale} />

      <p className="whitespace-pre-wrap text-[14px] leading-6 text-[#424a59]">{message.content}</p>

      <ActionSuggestions actions={actions} locale={locale} />
    </>
  );
}
