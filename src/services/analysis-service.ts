
import { analyzeFinancialDocument, AnalyzeFinancialDocumentOutput } from '@/ai/flows/analyze-financial-document';

export interface AnalysisInput {
  imageDataUri?: string;
  documentText?: string;
  notes?: string;
  source?: 'screenshot' | 'pasted_text' | 'email';
}

/**
 * Service layer to handle financial analysis logic.
 * Now fully powered by Groq AI engine.
 */
export class AnalysisService {
  static async analyze(input: AnalysisInput): Promise<AnalyzeFinancialDocumentOutput> {
    // Combine notes and document text for the AI
    const combinedText = [
      input.documentText,
      input.notes ? `User Notes: ${input.notes}` : null
    ].filter(Boolean).join('\n\n');

    try {
      return await analyzeFinancialDocument({
        imageDataUri: input.imageDataUri,
        documentText: combinedText || "Empty statement data provided."
      });
    } catch (error) {
      console.error('Groq Analysis Error:', error);
      throw new Error('Failed to analyze document via Groq AI.');
    }
  }
}
