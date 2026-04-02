
import { analyzeFinancialDocument, AnalyzeFinancialDocumentOutput } from '@/ai/flows/analyze-financial-document';

export interface AnalysisInput {
  imageDataUri?: string;
  documentText?: string;
  notes?: string;
  source?: 'screenshot' | 'pasted_text' | 'email' | 'chat';
}

/**
 * Service layer to handle universal assistant logic.
 * Routes between conversational AI and deep financial audits.
 */
export class AnalysisService {
  static async analyze(input: AnalysisInput): Promise<AnalyzeFinancialDocumentOutput> {
    const combinedText = [
      input.documentText,
      input.notes ? `User Notes: ${input.notes}` : null
    ].filter(Boolean).join('\n\n');

    try {
      // Pass directly to the universal AI flow
      const result = await analyzeFinancialDocument({
        imageDataUri: input.imageDataUri,
        documentText: combinedText || "Visual source uploaded."
      });

      return result;
    } catch (error) {
      console.error('Operator Logic Interruption:', error);
      // Fallback to a helpful conversational response if the AI fails
      return {
        title: "Operator Connection",
        summary: "I'm having a brief connection issue with my deep audit framework, but I'm still here to help. Could you try rephrasing your request or re-uploading the source?",
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
