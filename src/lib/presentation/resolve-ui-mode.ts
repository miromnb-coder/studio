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

const CASUAL_PATTERN =
  /^(hi|hello|hey|thanks|thank you|thx|what'?s up|hows? it going|how are you|yo|sup|ok|okay|cool|great|nice)[!,.\s]*$/i;
const SIMPLE_PREFERENCE_PATTERN =
  /(answer briefly|brief answer|just tell me directly|no table|simple answer only|no boxes|plain answer|just text)/i;
const SHOPPING_PATTERN =
  /\b(cheapest|buy|shopping|price|under\s*[$€£]?\s*\d+|budget|best product|show products|deal)\b/i;
const COMPARE_PATTERN =
  /\b(compare|comparison|versus|\bvs\b|which is better|what should i choose)\b/i;
const EMAIL_PATTERN =
  /\b(email|emails|inbox|gmail|important emails|recent emails|summari[sz]e inbox|check my emails)\b/i;
const OPERATOR_PATTERN =
  /\b(what should i do next|help me decide|next step|create a plan|plan for me|strategy|how can i save money|decide)\b/i;
const SEARCH_PATTERN =
  /\b(search for|find|latest|today'?s news|check online|look this up|current info|live info|news today)\b/i;

function normalize(value?: string): string {
  return (value ?? '').trim().toLowerCase();
}

function hasBrowserSearch(metadata?: AgentResponseMetadata): boolean {
  const browserSearch = metadata?.structuredData?.browser_search as
    | { used?: boolean; results?: unknown[]; mode?: string }
    | undefined;

  return Boolean(
    browserSearch?.used ||
      (Array.isArray(browserSearch?.results) && browserSearch.results.length > 0) ||
      browserSearch?.mode,
  );
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
  const responseHint = responseModeHint(metadata);
  const intent = normalize(metadata?.intent);
  const structuredMode = normalize(
    typeof metadata?.structuredData?.response_mode === 'string'
      ? metadata?.structuredData?.response_mode
      : undefined,
  );
  const browserSearch = metadata?.structuredData?.browser_search as
    | { mode?: string }
    | undefined;

  if (SIMPLE_PREFERENCE_PATTERN.test(latestUserContent)) return 'plain';

  if (
    responseHint === 'casual' ||
    (intent === 'general' && CASUAL_PATTERN.test(latestUserContent)) ||
    CASUAL_PATTERN.test(latestUserContent)
  ) {
    return 'casual';
  }

  const shoppingExplicit =
    SHOPPING_PATTERN.test(latestUserContent) ||
    intent === 'shopping' ||
    structuredMode === 'shopping' ||
    browserSearch?.mode === 'shopping';

  if (shoppingExplicit) return 'shopping';

  const compareExplicit =
    COMPARE_PATTERN.test(latestUserContent) ||
    intent === 'compare' ||
    structuredMode === 'compare';

  if (compareExplicit) return 'compare';

  const emailExplicit =
    EMAIL_PATTERN.test(latestUserContent) ||
    intent === 'email' ||
    intent === 'gmail';

  if (emailExplicit) return 'email';

  const operatorExplicit =
    responseHint === 'operator' ||
    OPERATOR_PATTERN.test(latestUserContent) ||
    intent === 'planning' ||
    intent === 'execution' ||
    Boolean(metadata?.operatorResponse?.nextStep);

  if (operatorExplicit) return 'operator';

  const searchExplicit =
    SEARCH_PATTERN.test(latestUserContent) ||
    intent === 'research' ||
    structuredMode === 'search' ||
    hasBrowserSearch(metadata) ||
    Boolean(structured?.sources?.some((source) => source.used));

  if (searchExplicit) return 'search';

  return 'plain';
}
