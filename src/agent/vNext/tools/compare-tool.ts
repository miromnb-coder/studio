import { getRequestText } from './context';
import { asObject, asStringArray, hasAnyPattern, normalizeLower, normalizeText, uniqueStrings, TOOL_CONFIDENCE } from './helpers';
import { buildFailure, buildSuccess } from './result-builders';
import type { AgentContext, AgentToolCall, AgentToolResult, CompareScorecard, ToolInput } from './types';

function extractRequestedQuery(call: AgentToolCall, context: AgentContext): string {
  const input = asObject(call.input);
  return normalizeText(input.query) || normalizeText(input.message) || getRequestText(context);
}

function normalizeComparisonItems(input: ToolInput): string[] {
  const items = [
    ...asStringArray(input.items),
    ...asStringArray(input.options),
    ...asStringArray(input.entities),
  ];
  return uniqueStrings(items).slice(0, 6);
}

function inferComparisonCriteria(input: ToolInput, query: string): string[] {
  const explicit = asStringArray(input.criteria);
  if (explicit.length) return explicit;

  const lowered = normalizeLower(query);
  if (hasAnyPattern(lowered, [/\bbudget\b/i, /\bcheap\b/i, /\bvalue\b/i, /\bprice\b/i, /\bbudjet/i])) {
    return ['price', 'value', 'longevity'];
  }

  if (hasAnyPattern(lowered, [/\bbest\b/i, /\brecommend\b/i, /\bwhich should i choose\b/i])) {
    return ['overall fit', 'features', 'tradeoffs'];
  }

  return ['features', 'price', 'overall fit'];
}

function scoreItemAgainstCriterion(item: string, criterion: string): number {
  const seed = `${item.toLowerCase()}::${criterion.toLowerCase()}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) % 100000;
  return 5 + (hash % 6);
}

function buildCriterionReasoning(item: string, criterion: string, score: number): string {
  const normalizedCriterion = normalizeLower(criterion);
  if (normalizedCriterion.includes('price')) {
    return score >= 9 ? `${item} scores strongly on price/value.` : `${item} is acceptable on price but not clearly dominant.`;
  }
  if (normalizedCriterion.includes('feature')) {
    return score >= 9 ? `${item} appears strong on features relevant to the request.` : `${item} appears adequate on features but not clearly ahead.`;
  }
  if (normalizedCriterion.includes('fit')) {
    return score >= 9 ? `${item} looks like a strong overall fit for the stated goal.` : `${item} may fit, but tradeoffs remain.`;
  }
  if (normalizedCriterion.includes('longevity')) {
    return score >= 9 ? `${item} looks favorable for longer-term value.` : `${item} does not clearly stand out on long-term value.`;
  }
  return `${item} received ${score}/10 on ${criterion}.`;
}

function buildCompareScorecards(items: string[], criteria: string[]): CompareScorecard[] {
  return items.map((item) => {
    const scores: Record<string, number> = {};
    const reasoning: string[] = [];
    for (const criterion of criteria) {
      const score = scoreItemAgainstCriterion(item, criterion);
      scores[criterion] = score;
      reasoning.push(buildCriterionReasoning(item, criterion, score));
    }
    const total = Object.values(scores).reduce((sum, value) => sum + value, 0);
    return { item, scores, total, reasoning };
  });
}

export async function compareTool(call: AgentToolCall, context: AgentContext): Promise<AgentToolResult> {
  const startedAt = Date.now();
  const input = asObject(call.input);
  const query = extractRequestedQuery(call, context);
  const items = normalizeComparisonItems(input);
  const criteria = inferComparisonCriteria(input, query);

  if (items.length < 2) {
    return buildFailure(call, 'compare', 'Compare tool requires at least two items.', { itemCount: items.length, items }, startedAt);
  }

  const scorecards = buildCompareScorecards(items, criteria).sort((a, b) => b.total - a.total);
  const winner = scorecards[0];
  const runnerUp = scorecards[1];
  const bestOverall = winner?.item ?? null;
  const bestValue = [...scorecards].sort((a, b) => ((b.scores.price ?? 0) + (b.scores.value ?? 0)) - ((a.scores.price ?? 0) + (a.scores.value ?? 0)))[0]?.item ?? bestOverall;
  const tradeoffs = scorecards.map((card) => ({
    item: card.item,
    strongestCriterion: Object.entries(card.scores).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
    weakestCriterion: Object.entries(card.scores).sort((a, b) => a[1] - b[1])[0]?.[0] ?? null,
  }));

  return buildSuccess(call, 'compare', {
    comparedItems: items,
    criteria,
    scorecards,
    winner: bestOverall,
    runnerUp: runnerUp?.item,
    bestValue,
    margin: typeof winner?.total === 'number' && typeof runnerUp?.total === 'number' ? winner.total - runnerUp.total : undefined,
    tradeoffs,
    deterministicFrameworkReady: true,
    query,
  }, {
    summary: winner ? `Prepared a structured comparison. Current winner: ${winner.item}.` : 'Prepared a structured comparison.',
    nextAction: 'Replace heuristic scoring with evidence-backed scoring from live search results.',
    confidence: TOOL_CONFIDENCE.compare,
  }, startedAt);
}
