import type { IntentRoute } from './types';

const DIRECT_PATTERNS = [/^what\s+is\b/, /^who\s+is\b/, /^when\b/, /^where\b/, /^define\b/, /^quick\b/];
const EXPLANATION_PATTERNS = [/explain/i, /how does/i, /teach me/i, /why does/i, /walk me through/i];
const ANALYSIS_PATTERNS = [/compare/i, /vs\.?/i, /tradeoff/i, /pros?\s+and\s+cons?/i, /best option/i, /should i/i];
const OPERATOR_PATTERNS = [/make a plan/i, /plan this/i, /do this/i, /help me solve/i, /figure this out/i, /roadmap/i];
const RESEARCH_HINTS = [/latest/i, /recent/i, /market/i, /benchmark/i, /evidence/i, /sources?/i, /research/i];
const MEMORY_HINTS = [/previous/i, /last time/i, /remember/i, /as we discussed/i, /my preference/i, /based on earlier/i];
const TROUBLESHOOTING_HINTS = [/error/i, /bug/i, /not working/i, /fails?/i, /issue/i, /fix/i, /debug/i];

function countMatches(input: string, patterns: RegExp[]) {
  return patterns.reduce((sum, pattern) => (pattern.test(input) ? sum + 1 : sum), 0);
}

export function routeIntent(input: string): IntentRoute {
  const text = input.trim();
  const lower = text.toLowerCase();
  const sentenceCount = text.split(/[.!?]/).filter((segment) => segment.trim()).length;
  const longPrompt = text.length > 280;

  const directScore = countMatches(lower, DIRECT_PATTERNS);
  const explanationScore = countMatches(lower, EXPLANATION_PATTERNS);
  const analysisScore = countMatches(lower, ANALYSIS_PATTERNS);
  const operatorScore = countMatches(lower, OPERATOR_PATTERNS);
  const researchScore = countMatches(lower, RESEARCH_HINTS);
  const troubleshootingScore = countMatches(lower, TROUBLESHOOTING_HINTS);

  const hasNumbers = /\d/.test(lower);
  const hasComparisonMarkers = /\b(vs|versus|better|worse|option)\b/i.test(lower);

  let mode: IntentRoute['mode'] = 'direct';
  if (operatorScore > 0) mode = 'operator';
  else if (analysisScore > 0 || hasComparisonMarkers || troubleshootingScore > 0) mode = 'analysis';
  else if (explanationScore > 0 || sentenceCount >= 2) mode = 'deep_explanation';
  else if (directScore > 0) mode = 'direct';

  const needsResearch = researchScore > 0 || /latest|today|current/i.test(lower);
  const needsMemory = countMatches(lower, MEMORY_HINTS) > 0 || /my\b|i\b/.test(lower);
  const needsAnalysis = mode === 'analysis' || mode === 'operator' || hasNumbers || troubleshootingScore > 0;
  const needsPlanning = mode === 'operator' || (mode === 'analysis' && (sentenceCount >= 2 || longPrompt));

  const signalCount = [needsResearch, needsMemory, needsAnalysis, needsPlanning].filter(Boolean).length;
  let complexity: IntentRoute['complexity'] = 'low';
  if (signalCount >= 2 || sentenceCount >= 2 || longPrompt) complexity = 'medium';
  if (signalCount >= 3 || sentenceCount >= 3 || text.length > 500) complexity = 'high';

  const intent: IntentRoute['intent'] = troubleshootingScore > 0
    ? 'troubleshooting'
    : mode === 'analysis' && hasComparisonMarkers
    ? 'comparison'
    : mode === 'operator'
    ? 'planning'
    : mode === 'deep_explanation'
    ? 'explanation'
    : /recommend|best/i.test(lower)
    ? 'recommendation'
    : mode === 'direct'
    ? 'quick_answer'
    : 'open_ended';

  const outputShape: IntentRoute['outputShape'] = mode === 'direct'
    ? 'short'
    : mode === 'operator'
    ? 'steps'
    : mode === 'analysis'
    ? 'decision'
    : 'sections';

  const rationale = [
    mode === 'direct' ? 'Simple request; direct answer preferred.' : `Detected ${mode.replace('_', ' ')} response style.`,
    needsPlanning ? 'Added planning phase for higher quality reasoning.' : 'No explicit planning phase required.',
    needsResearch ? 'Research signals detected.' : 'No research signals detected.',
  ];

  return {
    mode,
    needsResearch,
    needsAnalysis,
    needsMemory,
    needsPlanning,
    complexity,
    intent,
    outputShape,
    rationale,
  };
}
