import type { Message } from '@/app/store/app-store-types';
import type { AgentResponseMetadata } from '@/types/agent-response';

export type UiMode =
  | 'plain'
  | 'casual'
  | 'search'
  | 'compare'
  | 'shopping'
  | 'email'
  | 'operator';

type ResolveUiModeInput = {
  message: Message;
  metadata?: AgentResponseMetadata;
  structured?: Message['structured'];
  latestUserContent?: string;
};

type BrowserSearchMetadata = {
  used?: boolean;
  results?: unknown[];
  mode?: string | null;
};

type OperatorLike = {
  nextStep?: string;
  decisionBrief?: string;
  risk?: string;
  opportunity?: string;
  savingsOpportunity?: string;
  timeOpportunity?: string;
  actions?: Array<{ label?: string }>;
};

function normalize(value?: string): string {
  return (value ?? '').trim().toLowerCase();
}

function clean(value?: string): string {
  return (value ?? '').trim();
}

function wordCount(value?: string): number {
  const normalized = clean(value);
  if (!normalized) return 0;
  return normalized.split(/\s+/).filter(Boolean).length;
}

function hasAnyText(...values: Array<string | undefined>): boolean {
  return values.some((value) => clean(value).length > 0);
}

function countTruthy(values: unknown[]): number {
  return values.filter(Boolean).length;
}

function includesAny(text: string, needles: string[]): boolean {
  return needles.some((needle) => text.includes(needle));
}

function getStructuredResponseMode(
  metadata?: AgentResponseMetadata,
): string {
  const raw =
    metadata?.structuredData &&
    typeof metadata.structuredData === 'object' &&
    typeof metadata.structuredData.response_mode === 'string'
      ? metadata.structuredData.response_mode
      : '';

  return normalize(raw);
}

function getBrowserSearch(metadata?: AgentResponseMetadata): BrowserSearchMetadata | null {
  const raw =
    metadata?.structuredData &&
    typeof metadata.structuredData === 'object'
      ? (metadata.structuredData.browser_search as BrowserSearchMetadata | undefined)
      : undefined;

  if (!raw || typeof raw !== 'object') return null;
  return raw;
}

function hasBrowserSearch(metadata?: AgentResponseMetadata): boolean {
  const browserSearch = getBrowserSearch(metadata);

  return Boolean(
    browserSearch?.used ||
      browserSearch?.mode ||
      (Array.isArray(browserSearch?.results) && browserSearch.results.length > 0),
  );
}

function getBrowserResultCount(metadata?: AgentResponseMetadata): number {
  const browserSearch = getBrowserSearch(metadata);
  return Array.isArray(browserSearch?.results) ? browserSearch!.results!.length : 0;
}

function getOperatorResponse(metadata?: AgentResponseMetadata): OperatorLike | null {
  const raw = metadata?.operatorResponse;
  if (!raw || typeof raw !== 'object') return null;
  return raw as OperatorLike;
}

function hasOperatorData(metadata?: AgentResponseMetadata): boolean {
  const operator = getOperatorResponse(metadata);
  if (!operator) return false;

  const actionCount = Array.isArray(operator.actions)
    ? operator.actions.filter((action) => clean(action?.label).length > 0).length
    : 0;

  const signalCount = countTruthy([
    clean(operator.decisionBrief),
    clean(operator.nextStep),
    clean(operator.risk),
    clean(operator.opportunity),
    clean(operator.savingsOpportunity),
    clean(operator.timeOpportunity),
    actionCount > 0,
  ]);

  return signalCount >= 2;
}

function hasStrongEmailData(metadata?: AgentResponseMetadata): boolean {
  const emails =
    metadata?.structuredData &&
    typeof metadata.structuredData === 'object' &&
    Array.isArray((metadata.structuredData as Record<string, unknown>).emails)
      ? ((metadata.structuredData as Record<string, unknown>).emails as unknown[])
      : [];

  return emails.length > 0;
}

function hasStrongCompareData(metadata?: AgentResponseMetadata): boolean {
  const browserSearch = getBrowserSearch(metadata);
  const count = Array.isArray(browserSearch?.results) ? browserSearch!.results!.length : 0;
  if (count >= 2) return true;

  const compareData =
    metadata?.structuredData &&
    typeof metadata.structuredData === 'object'
      ? (metadata.structuredData as Record<string, unknown>).compare
      : undefined;

  return Boolean(compareData);
}

function hasStrongShoppingData(metadata?: AgentResponseMetadata): boolean {
  const browserSearch = getBrowserSearch(metadata);
  if (!browserSearch) return false;

  if (normalize(browserSearch.mode ?? '') === 'shopping') {
    return getBrowserResultCount(metadata) >= 2;
  }

  return false;
}

function isCasualPrompt(text: string): boolean {
  if (!text) return false;

  if (wordCount(text) > 8) return false;

  return includesAny(text, [
    'hi',
    'hello',
    'hey',
    'thanks',
    'thank you',
    'thx',
    "what's up",
    'whats up',
    'how are you',
    'how is it going',
    "how's it going",
    'yo',
    'sup',
    'ok',
    'okay',
    'cool',
    'great',
    'nice',
    'moi',
    'hei',
    'kiitos',
    'mitä kuuluu',
    'mita kuuluu',
    'moikka',
    'terve',
    'hej',
    'tack',
    'hur mår du',
    'hur mar du',
    'hola',
    'gracias',
    'qué tal',
    'que tal',
    'como estas',
    'cómo estás',
  ]);
}

function wantsPlainAnswer(text: string): boolean {
  if (!text) return false;

  return includesAny(text, [
    'answer briefly',
    'brief answer',
    'just tell me directly',
    'no table',
    'simple answer only',
    'no boxes',
    'plain answer',
    'just text',
    'short answer',
    'keep it simple',
    'vastaa lyhyesti',
    'vastaa suoraan',
    'älä tee taulukkoa',
    'ala tee taulukkoa',
    'ei laatikoita',
    'pelkkä vastaus',
    'vain teksti',
    'lyhyesti',
    'kerro suoraan',
    'säg bara direkt',
    'kort svar',
    'ingen tabell',
    'bara text',
    'respuesta breve',
    'sin tabla',
    'solo texto',
    'directamente',
  ]);
}

function isLikelyShoppingIntent(text: string): boolean {
  if (!text) return false;

  return includesAny(text, [
    'cheapest',
    'buy',
    'shopping',
    'price',
    'budget',
    'best product',
    'show products',
    'deal',
    'under ',
    'halvin',
    'osta',
    'ostaa',
    'ostettav',
    'hinta',
    'budjet',
    'näytä tuotte',
    'nayta tuotte',
    'tarjous',
    'köp',
    'pris',
    'billigast',
    'produkter',
    'comprar',
    'precio',
    'barato',
    'productos',
  ]);
}

function isLikelyCompareIntent(text: string): boolean {
  if (!text) return false;

  return includesAny(text, [
    'compare',
    'comparison',
    'versus',
    ' vs ',
    'which is better',
    'what should i choose',
    'vertaa',
    'vertail',
    'kumpi on parempi',
    'kannattaako',
    'jämför',
    'vilken är bättre',
    'compara',
    'cuál es mejor',
    'cual es mejor',
  ]);
}

function isLikelyEmailIntent(text: string): boolean {
  if (!text) return false;

  return includesAny(text, [
    'email',
    'emails',
    'inbox',
    'gmail',
    'important emails',
    'recent emails',
    'summarize inbox',
    'summarise inbox',
    'check my emails',
    'sähköposti',
    'sahkoposti',
    'sähköpostit',
    'sahkopostit',
    'postilaatikko',
    'viestit',
    'katso sähköpost',
    'katso sahkopost',
    'mejl',
    'inkorg',
    'correo',
    'correos',
    'bandeja de entrada',
  ]);
}

function isLikelyOperatorIntent(text: string): boolean {
  if (!text) return false;

  return includesAny(text, [
    'what should i do next',
    'help me decide',
    'next step',
    'create a plan',
    'plan for me',
    'strategy',
    'how can i save money',
    'decide',
    'mitä minun pitäisi tehdä',
    'mita minun pitaisi tehda',
    'auta päättämään',
    'auta paattamaan',
    'seuraava askel',
    'tee suunnitelma',
    'strategia',
    'miten säästän',
    'miten saastan',
    'hjälp mig att bestämma',
    'nästa steg',
    'strategi',
    'ayúdame a decidir',
    'ayudame a decidir',
    'siguiente paso',
    'plan para mí',
    'plan para mi',
  ]);
}

function isLikelySearchIntent(text: string): boolean {
  if (!text) return false;

  return includesAny(text, [
    'search for',
    'find',
    'latest',
    "today's news",
    'todays news',
    'check online',
    'look this up',
    'current info',
    'live info',
    'news today',
    'etsi',
    'hae',
    'selvitä',
    'selvita',
    'tarkista netistä',
    'tarkista netista',
    'uusin',
    'ajankoht',
    'uutiset',
    'finde',
    'senaste',
    'nyheter',
    'buscar',
    'busca',
    'último',
    'ultimo',
    'noticias',
  ]);
}

function responseModeHint(metadata?: AgentResponseMetadata): UiMode | null {
  const mode = metadata?.responseMode;

  if (mode === 'casual') return 'casual';
  if (mode === 'operator') return 'operator';
  return null;
}

export function resolveUiMode(input: ResolveUiModeInput): UiMode {
  const metadata = input.metadata ?? input.message.agentMetadata;
  const structured = input.structured ?? input.message.structured;
  const latestUserContent = normalize(input.latestUserContent);
  const intent = normalize(metadata?.intent);
  const responseHint = responseModeHint(metadata);
  const structuredMode = getStructuredResponseMode(metadata);
  const browserSearch = getBrowserSearch(metadata);

  if (wantsPlainAnswer(latestUserContent)) {
    return 'plain';
  }

  if (
    responseHint === 'casual' ||
    structuredMode === 'casual' ||
    (intent === 'general' && isCasualPrompt(latestUserContent)) ||
    isCasualPrompt(latestUserContent)
  ) {
    return 'casual';
  }

  const shoppingExplicit =
    structuredMode === 'shopping' ||
    normalize(browserSearch?.mode ?? '') === 'shopping' ||
    intent === 'shopping' ||
    (isLikelyShoppingIntent(latestUserContent) && hasStrongShoppingData(metadata));

  if (shoppingExplicit) {
    return 'shopping';
  }

  const compareExplicit =
    structuredMode === 'compare' ||
    intent === 'compare' ||
    (isLikelyCompareIntent(latestUserContent) && hasStrongCompareData(metadata));

  if (compareExplicit) {
    return 'compare';
  }

  const emailExplicit =
    structuredMode === 'email' ||
    intent === 'email' ||
    intent === 'gmail' ||
    (isLikelyEmailIntent(latestUserContent) && hasStrongEmailData(metadata));

  if (emailExplicit) {
    return 'email';
  }

  const operatorExplicit =
    responseHint === 'operator' ||
    structuredMode === 'operator' ||
    intent === 'planning' ||
    intent === 'execution' ||
    (isLikelyOperatorIntent(latestUserContent) && hasOperatorData(metadata)) ||
    hasOperatorData(metadata);

  if (operatorExplicit) {
    return 'operator';
  }

  const searchExplicit =
    structuredMode === 'search' ||
    intent === 'research' ||
    (hasBrowserSearch(metadata) &&
      normalize(browserSearch?.mode ?? '') !== 'shopping') ||
    (isLikelySearchIntent(latestUserContent) &&
      (hasBrowserSearch(metadata) ||
        Boolean(structured?.sources?.some((source) => source.used))));

  if (searchExplicit) {
    return 'search';
  }

  return 'plain';
}
