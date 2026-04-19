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

function countTruthy(values: unknown[]): number {
  return values.filter(Boolean).length;
}

function getStructuredResponseMode(metadata?: AgentResponseMetadata): string {
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
  return Array.isArray(browserSearch?.results) ? browserSearch.results.length : 0;
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
  const count = Array.isArray(browserSearch?.results) ? browserSearch.results.length : 0;
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

  return normalize(browserSearch.mode ?? '') === 'shopping' && getBrowserResultCount(metadata) >= 2;
}

function responseModeHint(metadata?: AgentResponseMetadata): UiMode | null {
  const mode = metadata?.responseMode;

  if (mode === 'casual') return 'casual';
  if (mode === 'operator') return 'operator';
  return null;
}

function getToolSignals(metadata?: AgentResponseMetadata): string[] {
  const steps = Array.isArray(metadata?.steps) ? metadata!.steps : [];

  return steps
    .map((step) => normalize((step as { tool?: string }).tool))
    .filter(Boolean);
}

function hasToolSignal(metadata: AgentResponseMetadata | undefined, tool: string): boolean {
  return getToolSignals(metadata).includes(tool);
}

function isLikelyCasual(text: string): boolean {
  if (!text) return false;
  const compact = text.trim();
  return compact.length <= 24 && compact.split(/\s+/).filter(Boolean).length <= 4;
}

export function resolveUiMode(input: ResolveUiModeInput): UiMode {
  const metadata = input.metadata ?? input.message.agentMetadata;
  const structured = input.structured ?? input.message.structured;
  const latestUserContent = clean(input.latestUserContent);
  const intent = normalize(metadata?.intent);
  const responseHint = responseModeHint(metadata);
  const structuredMode = getStructuredResponseMode(metadata);
  const browserSearch = getBrowserSearch(metadata);

  if (
    responseHint === 'casual' ||
    structuredMode === 'casual' ||
    (intent === 'general' &&
      !hasBrowserSearch(metadata) &&
      !hasStrongEmailData(metadata) &&
      !hasOperatorData(metadata) &&
      isLikelyCasual(latestUserContent))
  ) {
    return 'casual';
  }

  if (
    structuredMode === 'shopping' ||
    normalize(browserSearch?.mode ?? '') === 'shopping' ||
    intent === 'shopping' ||
    (hasStrongShoppingData(metadata) && hasBrowserSearch(metadata))
  ) {
    return 'shopping';
  }

  if (
    structuredMode === 'compare' ||
    intent === 'compare' ||
    hasToolSignal(metadata, 'compare') ||
    hasStrongCompareData(metadata)
  ) {
    return 'compare';
  }

  if (
    structuredMode === 'email' ||
    intent === 'gmail' ||
    hasToolSignal(metadata, 'gmail') ||
    hasStrongEmailData(metadata)
  ) {
    return 'email';
  }

  if (
    responseHint === 'operator' ||
    structuredMode === 'operator' ||
    intent === 'planning' ||
    intent === 'productivity' ||
    hasOperatorData(metadata)
  ) {
    return 'operator';
  }

  if (
    structuredMode === 'search' ||
    intent === 'research' ||
    hasToolSignal(metadata, 'web') ||
    (hasBrowserSearch(metadata) &&
      normalize(browserSearch?.mode ?? '') !== 'shopping' &&
      getBrowserResultCount(metadata) > 0)
  ) {
    return 'search';
  }

  if (structured?.sources?.some((source) => source.used) && !latestUserContent) {
    return 'plain';
  }

  return 'plain';
}
