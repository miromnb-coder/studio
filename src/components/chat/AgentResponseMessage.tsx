'use client';

import { useEffect, useMemo, useRef } from 'react';
import {
  ArrowUpRight,
  Check,
  CircleDollarSign,
  ExternalLink,
  Globe,
  Newspaper,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  TableProperties,
  Tags,
} from 'lucide-react';
import type { Message } from '@/app/store/app-store';
import { trackEvent } from '@/app/lib/analytics-client';
import { useOperatorActionHandler } from '@/app/hooks/use-operator-action-handler';
import type {
  AgentResponseMetadata,
  AgentSuggestedAction,
} from '@/types/agent-response';
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
  builtFrom: string;
  liveWeb: string;
  actionList: string;
  answerQuality: string;
  compareTable: string;
  compareSignal: string;
  compareSource: string;
  compareLink: string;
  compareOption: string;
  products: string;
  productPrice: string;
  productMerchant: string;
};

type BrowserSearchResult = {
  title: string;
  url: string;
  snippet: string;
  source?: string | null;
  price?: string | null;
  imageUrl?: string | null;
  image?: string | null;
  thumbnail?: string | null;
  rating?: number | string | null;
  reviewCount?: number | string | null;
  delivery?: string | null;
};

type BrowserSearchMetadata = {
  enabled?: boolean;
  used?: boolean;
  mode?: 'search' | 'news' | 'shopping' | null;
  provider?: string | null;
  query?: string | null;
  error?: string | null;
  results?: BrowserSearchResult[];
};

type ContentBlock =
  | { type: 'paragraph'; content: string }
  | { type: 'list'; items: string[] };

type ProductCardItem = {
  title: string;
  url: string;
  source: string;
  price: string;
  snippet: string;
  imageUrl: string | null;
  ratingLabel: string | null;
  accent: string;
};

const COPY: Record<SupportedLocale, LocaleCopy> = {
  en: {
    intro: [
      "Perfect — I'm on it.",
      "Great request. I'm working through it now.",
      "Absolutely — I'll handle this step by step.",
    ],
    fallback: 'Done — here is the answer for you.',
    brand: 'Kivo',
    builtFrom: 'Built from',
    liveWeb: 'Live web',
    actionList: 'Action list',
    answerQuality: 'Answer quality',
    compareTable: 'Compare table',
    compareSignal: 'Signal',
    compareSource: 'Source',
    compareLink: 'Link',
    compareOption: 'Option',
    products: 'Products',
    productPrice: 'Price',
    productMerchant: 'Merchant',
  },
  fi: {
    intro: [
      'Selvä — hoidan tämän nyt.',
      'Hyvä pyyntö. Käyn tämän läpi nyt.',
      'Totta kai — etenen tämän kanssa vaiheittain.',
    ],
    fallback: 'Valmis — tässä vastaus sinulle.',
    brand: 'Kivo',
    builtFrom: 'Rakennettu lähteistä',
    liveWeb: 'Live web',
    actionList: 'Toimintalista',
    answerQuality: 'Vastauksen laatu',
    compareTable: 'Vertailutaulukko',
    compareSignal: 'Signaali',
    compareSource: 'Lähde',
    compareLink: 'Linkki',
    compareOption: 'Vaihtoehto',
    products: 'Tuotteet',
    productPrice: 'Hinta',
    productMerchant: 'Kauppa',
  },
  sv: {
    intro: [
      'Självklart — jag tar hand om detta nu.',
      'Bra begäran. Jag går igenom detta nu.',
      'Absolut — jag hanterar detta steg för steg.',
    ],
    fallback: 'Klart — här är svaret till dig.',
    brand: 'Kivo',
    builtFrom: 'Byggd från',
    liveWeb: 'Live web',
    actionList: 'Åtgärdslista',
    answerQuality: 'Svarskvalitet',
    compareTable: 'Jämförelsetabell',
    compareSignal: 'Signal',
    compareSource: 'Källa',
    compareLink: 'Länk',
    compareOption: 'Alternativ',
    products: 'Produkter',
    productPrice: 'Pris',
    productMerchant: 'Butik',
  },
  es: {
    intro: [
      'Perfecto — ya me encargo.',
      'Buena solicitud. La reviso ahora mismo.',
      'Claro — voy a resolver esto paso a paso.',
    ],
    fallback: 'Listo — aquí tienes la respuesta.',
    brand: 'Kivo',
    builtFrom: 'Construido con',
    liveWeb: 'Web en vivo',
    actionList: 'Lista de acciones',
    answerQuality: 'Calidad de respuesta',
    compareTable: 'Tabla comparativa',
    compareSignal: 'Señal',
    compareSource: 'Fuente',
    compareLink: 'Enlace',
    compareOption: 'Opción',
    products: 'Productos',
    productPrice: 'Precio',
    productMerchant: 'Tienda',
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
      'rakennettu',
      'tarkista',
      'hae',
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

function toTitleCase(value: string): string {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
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
    metadata?.structuredData && typeof metadata.structuredData === 'object'
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

function resolveTitle(metadata: AgentResponseMetadata | undefined): string {
  const fromOperator = metadata?.operatorResponse?.decisionBrief?.trim();
  if (fromOperator) {
    return fromOperator.length > 48 ? 'Decision Brief' : fromOperator;
  }

  const browserData =
    metadata?.structuredData &&
    typeof metadata.structuredData === 'object' &&
    typeof (metadata.structuredData as Record<string, unknown>).browser_search ===
      'object'
      ? ((metadata.structuredData as Record<string, unknown>)
          .browser_search as BrowserSearchMetadata)
      : null;

  if (browserData?.used && browserData.query) {
    if (browserData.mode === 'shopping') return 'Shopping Results';
    if (browserData.mode === 'news') return 'Live News Brief';
    return 'Live Search Brief';
  }

  switch (metadata?.intent) {
    case 'planning':
      return 'Today Plan';
    case 'gmail':
    case 'email':
      return 'Inbox Summary';
    case 'scheduling':
      return 'Schedule Brief';
    case 'memory':
      return 'Memory Insight';
    case 'finance':
      return 'Money Brief';
    case 'compare':
      return 'Decision Brief';
    default:
      return 'Operator Summary';
  }
}

function buildSourceItems(metadata: AgentResponseMetadata | undefined): string[] {
  if (!metadata) return [];

  const sources = new Set<string>();
  const steps = metadata.steps ?? [];

  for (const step of steps) {
    const tool = String(step.tool || '').toLowerCase();
    if (!tool) continue;
    if (tool.includes('gmail') || tool.includes('email')) sources.add('Gmail ✓');
    else if (tool.includes('calendar') || tool.includes('schedule')) {
      sources.add('Calendar ✓');
    } else if (tool.includes('memory')) {
      sources.add('Memory ✓');
    } else if (tool.includes('browser_search') || tool.includes('browser')) {
      sources.add('Live web ✓');
    } else {
      sources.add(`${toTitleCase(tool)} ✓`);
    }
  }

  if (metadata.memoryUsed) sources.add('Memory ✓');

  const browserData =
    metadata.structuredData &&
    typeof metadata.structuredData === 'object' &&
    typeof (metadata.structuredData as Record<string, unknown>).browser_search ===
      'object'
      ? ((metadata.structuredData as Record<string, unknown>)
          .browser_search as BrowserSearchMetadata)
      : null;

  if (browserData?.used && browserData.provider) {
    sources.add(`${toTitleCase(browserData.provider)} ✓`);
  }

  return [...sources].slice(0, 5);
}

function buildOutcomeItems(metadata: AgentResponseMetadata | undefined): string[] {
  const operator = metadata?.operatorResponse;
  const candidates = [
    operator?.timeOpportunity,
    operator?.savingsOpportunity,
    operator?.opportunity,
    operator?.nextStep,
  ]
    .map((item) => normalizeText(item))
    .filter((item): item is string => Boolean(item));

  return candidates.slice(0, 2);
}

function extractBrowserSearch(
  metadata: AgentResponseMetadata | undefined,
): BrowserSearchMetadata | null {
  if (!metadata?.structuredData || typeof metadata.structuredData !== 'object') {
    return null;
  }

  const raw = (metadata.structuredData as Record<string, unknown>).browser_search;
  if (!raw || typeof raw !== 'object') return null;
  return raw as BrowserSearchMetadata;
}

function getModePill(mode?: string | null) {
  if (mode === 'shopping') {
    return {
      label: 'Shopping',
      icon: ShoppingBag,
    };
  }

  if (mode === 'news') {
    return {
      label: 'News',
      icon: Newspaper,
    };
  }

  return {
    label: 'Search',
    icon: Search,
  };
}

function inferAnswerQuality(metadata: AgentResponseMetadata | undefined): {
  label: string;
  tone: 'strong' | 'medium' | 'light';
} {
  const browserData = extractBrowserSearch(metadata);

  if (browserData?.used && (browserData.results?.length ?? 0) >= 4) {
    return { label: 'Grounded with live results', tone: 'strong' };
  }

  if (browserData?.used) {
    return { label: 'Partially grounded', tone: 'medium' };
  }

  if (metadata?.memoryUsed) {
    return { label: 'Memory-assisted', tone: 'light' };
  }

  return { label: 'Model answer', tone: 'light' };
}

function getHostnameLabel(url: string, fallback?: string | null) {
  if (fallback && fallback.trim()) return fallback.trim();

  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    return hostname;
  } catch {
    return 'Source';
  }
}

function extractPriceLabel(result: BrowserSearchResult) {
  const direct =
    normalizeText(result.price || undefined) ||
    normalizeText(
      typeof result.snippet === 'string'
        ? result.snippet.match(
            /(?:€|\$|£)\s?\d[\d.,]*|\d[\d.,]*\s?(?:€|eur|usd|sek|kr)/i,
          )?.[0]
        : '',
    );

  return direct || null;
}

function extractDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function maybeImage(result: BrowserSearchResult) {
  return (
    normalizeText(result.imageUrl || undefined) ||
    normalizeText(result.image || undefined) ||
    normalizeText(result.thumbnail || undefined) ||
    null
  );
}

function inferCompareIntent(
  metadata: AgentResponseMetadata | undefined,
  browserData: BrowserSearchMetadata | null,
  latestUserContent?: string,
) {
  if (metadata?.intent === 'compare') return true;
  const query = normalizeText(browserData?.query || latestUserContent).toLowerCase();
  if (!query) return false;
  return /\b(compare|comparison|versus|vs|vertaa|vertailu|paras|halvin)\b/i.test(
    query,
  );
}

function summarizeSnippet(snippet: string) {
  const normalized = normalizeText(snippet);
  if (!normalized) return 'No comparison signal.';
  if (normalized.length <= 92) return normalized;
  return `${normalized.slice(0, 89).trim()}…`;
}

function initialsFromTitle(title: string) {
  const letters = title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return letters || 'K';
}

function productAccent(index: number) {
  const accents = [
    'from-[#ebf4ff] to-[#f8fbff]',
    'from-[#eefbf5] to-[#f8fdfb]',
    'from-[#fff6ec] to-[#fffaf4]',
    'from-[#f5f1ff] to-[#faf8ff]',
  ];

  return accents[index % accents.length];
}

function buildProductCards(results: BrowserSearchResult[]): ProductCardItem[] {
  return results.slice(0, 6).map((result, index) => {
    const ratingValue =
      typeof result.rating === 'number'
        ? result.rating.toFixed(1)
        : normalizeText(
            typeof result.rating === 'string' ? result.rating : undefined,
          );

    return {
      title: normalizeText(result.title) || 'Untitled product',
      url: normalizeText(result.url),
      source: getHostnameLabel(result.url, result.source),
      price: extractPriceLabel(result) || 'See price',
      snippet: normalizeText(result.snippet) || 'Open product for more details.',
      imageUrl: maybeImage(result),
      ratingLabel: ratingValue ? `${ratingValue}/5` : null,
      accent: productAccent(index),
    };
  });
}

function topSourceChips(results: BrowserSearchResult[]) {
  const seen = new Set<string>();

  return results
    .map((result) => getHostnameLabel(result.url, result.source))
    .filter((item) => {
      if (!item || seen.has(item)) return false;
      seen.add(item);
      return true;
    })
    .slice(0, 5);
}

export function AgentResponseMessage({
  message,
  latestUserContent,
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
  const contentBlocks = buildContentBlocks(visibleContent);
  const operatorResponse = metadata?.operatorResponse;
  const operatorActions = operatorResponse?.actions ?? [];
  const browserData = extractBrowserSearch(metadata);
  const sourceItems = buildSourceItems(metadata);
  const outcomeItems = buildOutcomeItems(metadata);
  const title = resolveTitle(metadata);
  const quality = inferAnswerQuality(metadata);
  const actionClickedRef = useRef(false);
  const handleOperatorAction = useOperatorActionHandler({
    messageId: message.id,
    responseMode,
    operatorResponse,
    latestUserContent,
    intent: metadata?.intent,
  });

  const browserCards = useMemo(() => {
    const results = Array.isArray(browserData?.results) ? browserData?.results : [];
    return results.slice(0, 6);
  }, [browserData]);

  const sourceChips = useMemo(() => topSourceChips(browserCards), [browserCards]);

  const compareEnabled = useMemo(
    () => inferCompareIntent(metadata, browserData, latestUserContent),
    [metadata, browserData, latestUserContent],
  );

  const productCards = useMemo(() => {
    if (browserData?.mode !== 'shopping') return [];
    return buildProductCards(browserCards);
  }, [browserCards, browserData?.mode]);

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

  const modePill = getModePill(browserData?.mode);

  return (
    <div className="max-w-full">
      <div className="rounded-[30px] border border-[rgba(222,229,238,0.78)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(247,250,254,0.98))] p-5 shadow-[0_20px_48px_rgba(15,23,42,0.07)] backdrop-blur-xl sm:p-6">
        <div className="mb-5 flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#dde6f0] bg-[#f9fbfe] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#718096]">
            <Sparkles className="h-3.5 w-3.5" />
            {copy.brand}
          </span>

          {browserData?.used ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#dbe8f3] bg-[#f5faff] px-3 py-1.5 text-[11px] font-semibold text-[#49627d]">
              <modePill.icon className="h-3.5 w-3.5" />
              {modePill.label}
            </span>
          ) : null}

          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold ${
              quality.tone === 'strong'
                ? 'border border-[#d7eadc] bg-[#f4fbf6] text-[#3c6c4a]'
                : quality.tone === 'medium'
                  ? 'border border-[#e9e1c9] bg-[#fffaf0] text-[#806225]'
                  : 'border border-[#e4e9f1] bg-[#fafcff] text-[#738296]'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            {quality.label}
          </span>

          {browserData?.used && browserCards.length ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e4ebf3] bg-white px-3 py-1.5 text-[11px] font-medium text-[#738296]">
              {browserCards.length} live results
            </span>
          ) : null}
        </div>

        <div className="max-w-[820px]">
          <h3 className="text-[26px] font-semibold leading-[1.08] tracking-[-0.045em] text-[#1f2937] sm:text-[30px]">
            {title}
          </h3>

          {(responseMode === 'operator' || responseMode === 'tool') && visibleContent ? (
            <p className="mt-3 text-[15px] leading-[1.65] tracking-[-0.014em] text-[#748091]">
              {copy.intro[introIndex]}
            </p>
          ) : null}
        </div>

        {browserData?.used ? (
          <div className="mt-5 rounded-[24px] border border-[#e7edf5] bg-[linear-gradient(180deg,#fcfdff,#f8fbff)] p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e3e9f2] bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8390a3]">
                <Globe className="h-3.5 w-3.5" />
                {copy.liveWeb}
              </span>

              {browserData.query ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e6ecf4] bg-white px-3 py-1.5 text-[12px] text-[#5f7086]">
                  <Search className="h-3.5 w-3.5" />
                  <span className="max-w-[36ch] truncate">{browserData.query}</span>
                </span>
              ) : null}

              {browserData.provider ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e6ecf4] bg-white px-3 py-1.5 text-[12px] text-[#5f7086]">
                  <Sparkles className="h-3.5 w-3.5" />
                  {toTitleCase(browserData.provider)}
                </span>
              ) : null}

              {sourceChips.map((chip, index) => (
                <span
                  key={`${chip}-${index}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#e6ecf4] bg-[#fbfdff] px-3 py-1.5 text-[12px] text-[#637489]"
                >
                  <Tags className="h-3.5 w-3.5" />
                  {chip}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-5 space-y-4">
          {contentBlocks.length > 0 ? (
            contentBlocks.map((block, index) => {
              if (block.type === 'list') {
                return (
                  <ul
                    key={`list-${index}`}
                    className="space-y-3 rounded-[22px] border border-[#ecf1f6] bg-[#fbfdff] p-4 text-[16px] leading-[1.7] tracking-[-0.012em] text-[#364152]"
                  >
                    {block.items.map((item, itemIndex) => (
                      <li key={`item-${index}-${itemIndex}`} className="flex gap-3">
                        <span className="mt-1.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#edf5ff] text-[#58759a]">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                );
              }

              const isLead = index === 0 && block.content.length < 180;

              return (
                <p
                  key={`paragraph-${index}`}
                  className={
                    isLead
                      ? 'max-w-[780px] text-[20px] leading-[1.58] tracking-[-0.026em] text-[#2b3441]'
                      : 'max-w-[780px] text-[16.8px] leading-[1.74] tracking-[-0.012em] text-[#435062]'
                  }
                >
                  {block.content}
                </p>
              );
            })
          ) : (
            <div className="text-[16.8px] leading-[1.74] tracking-[-0.012em] text-[#435062]">
              {visibleContent}
            </div>
          )}
        </div>

        {browserData?.used && browserData.mode === 'shopping' && productCards.length ? (
          <div className="mt-7">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#95a0b0]">
                  {copy.products}
                </p>
                <p className="mt-1 text-[13px] text-[#6c7788]">
                  Premium shopping cards
                </p>
              </div>

              <span className="rounded-full border border-[#e5ebf3] bg-white px-3 py-1.5 text-[11px] font-medium text-[#748091]">
                {productCards.length} items
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {productCards.map((product, index) => (
                <a
                  key={`${product.url}-${index}`}
                  href={product.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group overflow-hidden rounded-[24px] border border-[#e7edf5] bg-[linear-gradient(180deg,#ffffff,#fbfdff)] shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition duration-200 hover:-translate-y-[1px] hover:shadow-[0_16px_30px_rgba(15,23,42,0.08)]"
                >
                  <div className={`relative h-44 bg-gradient-to-br ${product.accent}`}>
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-[28px] border border-white/80 bg-white/90 text-[22px] font-semibold text-[#5f7086] shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
                          {initialsFromTitle(product.title)}
                        </div>
                      </div>
                    )}

                    <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/90 px-2.5 py-1 text-[11px] font-medium text-[#576b83] backdrop-blur">
                      <ShoppingBag className="h-3.5 w-3.5" />
                      {product.source}
                    </div>

                    {product.ratingLabel ? (
                      <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-white/80 bg-white/90 px-2.5 py-1 text-[11px] font-medium text-[#576b83] backdrop-blur">
                        <Star className="h-3.5 w-3.5" />
                        {product.ratingLabel}
                      </div>
                    ) : null}
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="line-clamp-2 text-[16px] font-semibold leading-[1.35] tracking-[-0.02em] text-[#243041]">
                        {product.title}
                      </h4>
                      <ExternalLink className="h-4 w-4 shrink-0 text-[#95a0b0] transition group-hover:text-[#243041]" />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e6ebf3] bg-[#fbfdff] px-2.5 py-1 text-[12px] font-medium text-[#52677f]">
                        <CircleDollarSign className="h-3.5 w-3.5" />
                        {product.price}
                      </span>

                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e6ebf3] bg-[#fbfdff] px-2.5 py-1 text-[12px] font-medium text-[#6c7c90]">
                        {product.source}
                      </span>
                    </div>

                    <p className="mt-3 line-clamp-3 text-[13px] leading-[1.65] text-[#5d697a]">
                      {product.snippet}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        ) : null}

        {browserData?.used && compareEnabled && browserCards.length >= 2 ? (
          <div className="mt-7">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#95a0b0]">
                  {copy.compareTable}
                </p>
                <p className="mt-1 text-[13px] text-[#6c7788]">
                  Fast side-by-side scan
                </p>
              </div>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e5ebf3] bg-white px-3 py-1.5 text-[11px] font-medium text-[#748091]">
                <TableProperties className="h-3.5 w-3.5" />
                {Math.min(browserCards.length, 4)} rows
              </span>
            </div>

            <div className="overflow-hidden rounded-[24px] border border-[#e7edf5] bg-white">
              <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,0.85fr)_minmax(0,1.2fr)_auto] gap-3 border-b border-[#edf2f7] bg-[#f8fbff] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b98a9]">
                <div>{copy.compareOption}</div>
                <div>{copy.compareSource}</div>
                <div>{copy.compareSignal}</div>
                <div>{copy.compareLink}</div>
              </div>

              <div className="divide-y divide-[#eef2f7]">
                {browserCards.slice(0, 4).map((result, index) => (
                  <div
                    key={`${result.url}-${index}`}
                    className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,0.85fr)_minmax(0,1.2fr)_auto] gap-3 px-4 py-4 text-[13px] text-[#425164]"
                  >
                    <div className="min-w-0">
                      <p className="line-clamp-2 font-semibold leading-[1.45] text-[#243041]">
                        {result.title}
                      </p>
                      {browserData.mode === 'shopping' && extractPriceLabel(result) ? (
                        <p className="mt-1 text-[12px] font-medium text-[#4a6a53]">
                          {extractPriceLabel(result)}
                        </p>
                      ) : null}
                    </div>

                    <div className="min-w-0">
                      <span className="inline-flex max-w-full items-center rounded-full border border-[#e7edf4] bg-[#fbfdff] px-2.5 py-1 text-[12px] font-medium text-[#64758b]">
                        <span className="truncate">
                          {getHostnameLabel(result.url, result.source)}
                        </span>
                      </span>
                    </div>

                    <div className="min-w-0 text-[12.5px] leading-[1.6] text-[#627184]">
                      {summarizeSnippet(result.snippet)}
                    </div>

                    <div className="flex items-start justify-end">
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#dfe7f1] bg-white px-3 py-1.5 text-[12px] font-medium text-[#415164] transition hover:border-[#cfd9e6] hover:bg-[#f8fbff]"
                      >
                        <span>Open</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {browserData?.used && browserData.mode !== 'shopping' && browserCards.length ? (
          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#95a0b0]">
                  {copy.liveWeb}
                </p>
                <p className="mt-1 text-[13px] text-[#6c7788]">
                  {browserData.query || 'Live browser search'}
                </p>
              </div>

              <span className="rounded-full border border-[#e5ebf3] bg-white px-3 py-1.5 text-[11px] font-medium text-[#748091]">
                {browserData.provider ? toTitleCase(browserData.provider) : 'Search'}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {browserCards.map((result, index) => (
                <a
                  key={`${result.url}-${index}`}
                  href={result.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group rounded-[22px] border border-[#e7edf5] bg-[linear-gradient(180deg,#ffffff,#fbfdff)] p-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)] transition duration-200 hover:-translate-y-[1px] hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-[#97a1af]">
                        {result.source || extractDomain(result.url) || 'Source'}
                      </p>
                      <h4 className="mt-2 line-clamp-2 text-[16px] font-semibold leading-[1.35] tracking-[-0.018em] text-[#243041]">
                        {result.title}
                      </h4>
                    </div>

                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e2e8f0] bg-white text-[#6c7a8f] transition group-hover:text-[#253244]">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </div>

                  <p className="mt-3 line-clamp-3 text-[13px] leading-[1.65] text-[#5d697a]">
                    {result.snippet || 'No summary available.'}
                  </p>
                </a>
              ))}
            </div>
          </div>
        ) : null}

        {actions.length ? (
          <div className="mt-6 rounded-[22px] border border-[#e8edf4] bg-[linear-gradient(180deg,#fbfcfe,#f7fafe)] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#95a0b0]">
                {copy.actionList}
              </p>
              <span className="text-[11px] font-medium text-[#9aa4b2]">
                {actions.length} items
              </span>
            </div>

            <ul className="space-y-2.5">
              {actions.slice(0, 3).map((action, index) => (
                <li key={`${action}-${index}`} className="flex gap-3">
                  <span className="mt-1.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#edf5ff] text-[#58759a]">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-[15px] leading-[1.6] text-[#334155]">
                    {action}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {(sourceItems.length || outcomeItems.length) ? (
          <div className="mt-6 flex flex-col gap-3 border-t border-[#edf2f7] pt-4">
            {sourceItems.length ? (
              <div className="flex flex-wrap items-center gap-2 text-[12px] text-[#7a8598]">
                <span className="font-medium text-[#8e99ab]">{copy.builtFrom}</span>
                {sourceItems.map((source, index) => (
                  <span
                    key={`${source}-${index}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#e7edf4] bg-[#fbfdff] px-2.5 py-1 font-medium"
                  >
                    {source.includes('web') ? <Globe className="h-3.5 w-3.5" /> : null}
                    <span>{source}</span>
                  </span>
                ))}
              </div>
            ) : null}

            {outcomeItems.length ? (
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#95a0b0]">
                  {copy.answerQuality}
                </p>
                {outcomeItems.map((outcome, index) => (
                  <p
                    key={`${outcome}-${index}`}
                    className="text-[13px] font-medium leading-[1.6] text-[#607288]"
                  >
                    {outcome}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
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

      {actions.length ? (
        <div className="mt-5">
          <ActionSuggestions
            actions={actions}
            locale={locale}
            onActionClick={(actionLabel) => {
              const action = operatorActions.find(
                (item) => item.label === actionLabel,
              );
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
