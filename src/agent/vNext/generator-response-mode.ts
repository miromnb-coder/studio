import type { StructuredAnswer } from './types';
import type {
  GenerateFinalAnswerInput,
  GeneratorResponseType,
  ToolSummaryItem,
} from './generator-types';
import { getRequestText } from './generator-types';

function hasMeaningfulData(summary: ToolSummaryItem): boolean {
  const dataKeys = Object.keys(summary.data);
  return dataKeys.length > 0 || summary.summary.length > 0;
}

function hasTool(toolSummaries: ToolSummaryItem[], tool: string): boolean {
  return toolSummaries.some((item) => item.ok && item.tool === tool && hasMeaningfulData(item));
}

export function decideResponseMode(params: {
  input: GenerateFinalAnswerInput;
  toolSummaries: ToolSummaryItem[];
  structured?: StructuredAnswer;
  confidence?: number;
}): GeneratorResponseType {
  const { input, toolSummaries, structured, confidence = input.route.confidence ?? 0.6 } = params;

  if (input.route.intent === 'shopping') return 'shopping';
  if (input.route.intent === 'compare') return 'compare';
  if (input.route.intent === 'research') return 'search';
  if (input.route.intent === 'gmail' || input.route.intent === 'planning' || input.route.intent === 'productivity') {
    return 'email';
  }

  const query = getRequestText(input.request).toLowerCase();
  const wantsComparison = /\b(compare|vs\.?|versus|difference|which is better)\b/.test(query);
  const wantsShopping = /\b(buy|best|price|deal|cheap|shopping|recommend)\b/.test(query);
  const wantsEmail = /\b(email|gmail|inbox|calendar|meeting|schedule)\b/.test(query);
  const wantsSearch = /\b(latest|news|search|source|report|article|what happened)\b/.test(query);

  if (hasTool(toolSummaries, 'compare') || wantsComparison) return 'compare';
  if (hasTool(toolSummaries, 'gmail') || hasTool(toolSummaries, 'calendar') || wantsEmail) return 'email';

  const hasShoppingToolData = toolSummaries.some(
    (item) => item.ok && (item.tool === 'web' || item.tool === 'shopping') && Array.isArray(item.data.products),
  );
  if (hasShoppingToolData || wantsShopping) return 'shopping';

  if (hasTool(toolSummaries, 'web') || wantsSearch) return 'search';

  const hasStructuredSignals = Boolean(
    structured?.sources?.length || structured?.highlights?.length || structured?.nextStep,
  );

  if (confidence >= 0.66 && hasStructuredSignals) return 'operator';
  if (hasTool(toolSummaries, 'finance')) return 'operator';

  return 'plain';
}
