import type { AgentContext, AgentToolCall, AgentToolResult } from './types';
import { asObject, clamp01, normalizeText, toErrorMessage, TOOL_CONFIDENCE } from './helpers';
import { buildFailure, buildSuccess } from './result-builders';
import { getRequestText } from './context';
import { buildResponseType, buildSearchSources, buildSourceChips, normalizeBrowserResult, normalizeShoppingProducts } from './web/normalizers';
import { normalizeWebAction, resolveWebMode, summarizeWebResults } from './web/modes';
import { getProviderStatus, runSearchWithFallback } from './web/providers';

function extractRequestedQuery(call: AgentToolCall, context: AgentContext): string {
  const input = asObject(call.input);
  return normalizeText(input.query) || normalizeText(input.message) || getRequestText(context);
}

export async function webTool(call: AgentToolCall, context: AgentContext): Promise<AgentToolResult> {
  const startedAt = Date.now();
  const input = asObject(call.input);
  const query = normalizeText(input.query) || extractRequestedQuery(call, context);
  const action = normalizeWebAction(input, query);

  if (action === 'status') {
    const status = getProviderStatus();
    return buildSuccess(call, 'web', {
      action,
      configured: status.configured,
      provider: status.provider,
      availableProviders: status.availableProviders,
      availableActions: ['search', 'research', 'shopping', 'products', 'fetch'],
    }, {
      requiresProvider: true,
      summary: status.configured ? 'Live browser search is configured.' : 'Live browser search is not configured.',
      confidence: status.configured ? TOOL_CONFIDENCE.web : 0.34,
    }, startedAt);
  }

  if (!query) {
    return buildFailure(call, 'web', 'Web search requires a query.', { action }, startedAt);
  }

  const status = getProviderStatus();
  if (!status.configured) {
    return buildFailure(call, 'web', 'Browser search provider is not configured.', {
      action,
      query,
      requiredEnv: ['SERPER_API_KEY or TAVILY_API_KEY'],
    }, startedAt);
  }

  try {
    const mode = resolveWebMode(input, query, action);
    const providerResult = await runSearchWithFallback({
      query,
      mode,
      timeoutMs: typeof input.timeoutMs === 'number' ? input.timeoutMs : undefined,
    });

    const normalizedResults = providerResult.results.map(normalizeBrowserResult).filter((row) => row.title || row.url).slice(0, 8);
    const products = normalizeShoppingProducts(normalizedResults);
    const summary = summarizeWebResults(mode, query, normalizedResults.length);

    return buildSuccess(call, 'web', {
      action,
      query,
      responseType: buildResponseType(mode),
      provider: providerResult.provider,
      attemptedProviders: providerResult.attemptedProviders,
      fallbackUsed: providerResult.fallbackUsed,
      mode: providerResult.mode,
      summary,
      results: normalizedResults,
      searchResults: normalizedResults,
      webResults: normalizedResults,
      sources: buildSearchSources(normalizedResults),
      sourceChips: buildSourceChips(normalizedResults),
      products,
      shoppingResults: products,
      topResult: normalizedResults[0] ?? null,
    }, {
      requiresProvider: true,
      summary,
      nextAction: normalizedResults.length > 0
        ? mode === 'shopping'
          ? 'Use returned products/shoppingResults to render a shopping response.'
          : 'Use returned results/sources to render a search response.'
        : 'No results found. Consider refining the query.',
      confidence: normalizedResults.length
        ? clamp01(TOOL_CONFIDENCE.web + Math.min(0.08, normalizedResults.length * 0.01))
        : 0.46,
    }, startedAt);
  } catch (error) {
    return buildFailure(call, 'web', `Web execution failed: ${toErrorMessage(error)}`, { action, query }, startedAt);
  }
}
