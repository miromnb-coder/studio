
/**
 * @fileOverview Client-side service wrapper for the AI Analysis API.
 * This file is now strictly a client-side utility that communicates via fetch.
 */

export interface AnalysisInput {
  imageDataUri?: string;
  documentText?: string;
  notes?: string;
  source?: 'screenshot' | 'pasted_text' | 'email' | 'chat';
  history?: Array<{role: 'user' | 'assistant', content: string}>;
}

export interface AnalysisOutput {
  title: string;
  summary: string;
  detectedItems?: any[];
  savingsEstimate?: number;
  beforeAfterComparison?: {
    currentSituation: string;
    optimizedSituation: string;
  };
  isActionable: boolean;
}

export class AnalysisService {
  /**
   * Proxies the analysis request to the server-side API route.
   */
  static async analyze(input: AnalysisInput): Promise<AnalysisOutput> {
    const combinedText = [
      input.documentText,
      input.notes ? `User Notes: ${input.notes}` : null
    ].filter(Boolean).join('\n\n');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageDataUri: input.imageDataUri,
          documentText: combinedText || "Visual source uploaded.",
          history: input.history
        }),
      });

      if (!response.ok) {
        throw new Error('Analysis protocol failed at the gateway.');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Client Analysis Service Error:', error);
      return {
        title: "Operator Connection",
        summary: "I'm having a brief connection issue with the analysis gateway. Please try again.",
        isActionable: false,
        detectedItems: [],
        savingsEstimate: 0,
        beforeAfterComparison: {
          currentSituation: "Gateway protocol interrupted.",
          optimizedSituation: "Stable connection required."
        }
      };
    }
  }
}
