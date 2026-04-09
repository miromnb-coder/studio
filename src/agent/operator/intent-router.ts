import type { IntentRoute } from './types';

const ANALYSIS_TERMS = ['compare', 'analysis', 'analyze', 'tradeoff', 'pros and cons', 'ratio', 'percent', 'forecast', 'decision'];
const RESEARCH_TERMS = ['find', 'latest', 'what is', 'explain', 'research', 'overview', 'how does', 'why is'];
const MEMORY_TERMS = ['last time', 'previous', 'remember', 'as we discussed', 'my preference', 'history', 'again'];

export function routeIntent(input: string): IntentRoute {
  const text = input.toLowerCase();
  const hasNumber = /\d/.test(text);
  const sentenceCount = text.split(/[.!?]/).filter(Boolean).length;

  const needsAnalysis = ANALYSIS_TERMS.some((term) => text.includes(term)) || hasNumber;
  const needsResearch = RESEARCH_TERMS.some((term) => text.includes(term));
  const needsMemory = MEMORY_TERMS.some((term) => text.includes(term));

  let complexity: IntentRoute['complexity'] = 'low';
  const signalCount = [needsAnalysis, needsResearch, needsMemory].filter(Boolean).length;

  if (signalCount >= 2 || sentenceCount >= 3) complexity = 'medium';
  if (signalCount === 3 || text.length > 420) complexity = 'high';

  return { needsResearch, needsAnalysis, needsMemory, complexity };
}
