/**
 * @fileOverview Client-side service wrapper for the AI Analysis API.
 * Includes safety guards and fallback mechanisms to prevent UI crashes.
 */

export interface AnalysisInput {
  imageDataUri?: string;
  documentText?: string;
  notes?: string;
  source?: 'screenshot' | 'pasted_text' | 'email' | 'chat';
  history?: Array<{role: 'user' | 'assistant', content: string}>;
  userMemory?: any;
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
  memoryUpdates?: {
    newGoals?: string[];
    newPreferences?: string[];
    newSubscriptions?: string[];
    behaviorSummaryUpdate?: string;
  };
}

export class AnalysisService {
  /**
   * Proxies the analysis request to the server-side API route with safety guards.
   */
  static async analyze(input: AnalysisInput): Promise<AnalysisOutput> {
    const combinedText = [
      input?.documentText,
      input?.notes ? `User Notes: ${input.notes}` : null
    ].filter(Boolean).join('\n\n');

    const fallbackResponse: AnalysisOutput = {
      title: "Syncing Protocol",
      summary: "I'm having a brief connection issue. Please check your network and try again.",
      isActionable: false,
      detectedItems: [],
      savingsEstimate: 0,
      beforeAfterComparison: {
        currentSituation: "Connection interrupted.",
        optimizedSituation: "Stable synchronization required."
      }
    };

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageDataUri: input?.imageDataUri,
          documentText: combinedText || "Manual audit request.",
          history: input?.history || [],
          userMemory: input?.userMemory || null
        }),
      });

      if (!response.ok) {
        console.warn('Analysis service returned non-OK status:', response.status);
        return fallbackResponse;
      }

      const result = await response.json();
      
      // Ensure all required fields exist in the response
      return {
        title: result?.title || "Audit Report",
        summary: result?.summary || "Analysis complete.",
        isActionable: !!result?.isActionable,
        detectedItems: Array.isArray(result?.detectedItems) ? result.detectedItems : [],
        savingsEstimate: typeof result?.savingsEstimate === 'number' ? result.savingsEstimate : 0,
        beforeAfterComparison: result?.beforeAfterComparison || undefined,
        memoryUpdates: result?.memoryUpdates || undefined
      };
    } catch (error) {
      console.error('Client Analysis Service Exception:', error);
      return fallbackResponse;
    }
  }
}
