
import { analyzeFinancialDocument, AnalyzeFinancialDocumentOutput } from '@/ai/flows/analyze-financial-document';

export interface AnalysisInput {
  imageDataUri?: string;
  documentText?: string;
  notes?: string;
  source?: 'screenshot' | 'pasted_text' | 'email' | 'chat';
  history?: Array<{role: 'user' | 'assistant', content: string}>;
}

/**
 * Service layer to handle universal assistant logic with memory.
 */
export class AnalysisService {
  static async analyze(input: AnalysisInput): Promise<AnalyzeFinancialDocumentOutput> {
    const combinedText = [
      input.documentText,
      input.notes ? `User Notes: ${input.notes}` : null
    ].filter(Boolean).join('\n\n');

    try {
      // Pass directly to the universal AI flow with history context
      const result = await analyzeFinancialDocument({
        imageDataUri: input.imageDataUri,
        documentText: combinedText || "Visual source uploaded.",
        history: input.history
      });

      return result;
    } catch (error) {
      console.error('Operator Logic Interruption:', error);
      return {
        title: "Operator Connection",
        summary: "I'm having a brief connection issue. Please try again.",
        isActionable: false,
        detectedItems: [],
        savingsEstimate: 0,
        beforeAfterComparison: {
          currentSituation: "Protocol interrupted.",
          optimizedSituation: "Stable connection required."
        }
      };
    }
  }
}
