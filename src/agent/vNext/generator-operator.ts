import type { StructuredAnswer } from './types';
import type {
  GenerateFinalAnswerInput,
  StructuredPayloadSchema,
  ToolSummaryItem,
} from './generator-types';
import { normalizeText, toTitleCase, unique } from './generator-types';

export function buildOperatorResponse(params: {
  input: GenerateFinalAnswerInput;
  structured: StructuredAnswer;
  toolSummaries: ToolSummaryItem[];
}): Partial<StructuredPayloadSchema> {
  const { structured, toolSummaries } = params;

  const nextActions = structured.nextStep ? [structured.nextStep] : [];
  const opportunities: string[] = [];
  const risks: string[] = [];

  for (const item of toolSummaries) {
    if (item.ok) {
      const summary = normalizeText(item.summary);
      if (summary) opportunities.push(summary);
    } else {
      const error = normalizeText(item.error);
      if (error) risks.push(`${toTitleCase(item.tool)}: ${error}`);
    }
  }

  return {
    nextActions: nextActions.slice(0, 5),
    opportunities: unique(opportunities).slice(0, 5),
    risks: unique(risks).slice(0, 5),
  };
}
