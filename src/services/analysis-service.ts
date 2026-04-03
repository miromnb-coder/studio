
/**
 * @fileOverview Client-side service wrapper for the AI Analysis API.
 * Updated to support high-IQ strategy selection and adaptive modes.
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
  strategy: 'direct_answer' | 'guided_analysis' | 'proactive_alert' | 'concise_summary' | 'follow_up' | 'action_recommendation' | 'clarification' | 'checklist';
  mode: 'alert' | 'advisor' | 'analyst' | 'planner' | 'executor' | 'reminder';
  detectedItems?: any[];
  savingsEstimate?: number;
  beforeAfterComparison?: {
    currentSituation: string;
    optimizedSituation: string;
  };
  followUpQuestion?: string;
  isActionable: boolean;
  memoryUpdates?: {
    newGoals?: string[];
    newPreferences?: string[];
    newSubscriptions?: string[];
    newIgnoredSuggestions?: string[];
    behaviorSummaryUpdate?: string;
  };
}

export class AnalysisService {
  static async analyze(input: AnalysisInput): Promise<AnalysisOutput> {
    const combinedText = [
      input?.documentText,
      input?.notes ? `User Notes: ${input.notes}` : null
    ].filter(Boolean).join('\n\n');

    const fallbackResponse: AnalysisOutput = {
      title: "Protocol Sync",
      summary: "I'm having a brief connection issue while consulting the intelligence ledger. Please try again.",
      strategy: 'direct_answer',
      mode: 'advisor',
      isActionable: false,
      detectedItems: [],
      savingsEstimate: 0,
    };

    // Implement a 30-second timeout for the AI response
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          imageDataUri: input?.imageDataUri,
          documentText: combinedText || "Manual audit request.",
          history: input?.history || [],
          userMemory: input?.userMemory || null
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) return fallbackResponse;

      const result = await response.json();
      
      return {
        title: result?.title || "Audit Report",
        summary: result?.summary || "Analysis complete.",
        strategy: result?.strategy || 'direct_answer',
        mode: result?.mode || 'advisor',
        isActionable: !!result?.isActionable,
        detectedItems: Array.isArray(result?.detectedItems) ? result.detectedItems : [],
        savingsEstimate: typeof result?.savingsEstimate === 'number' ? result.savingsEstimate : 0,
        beforeAfterComparison: result?.beforeAfterComparison || undefined,
        followUpQuestion: result?.followUpQuestion || undefined,
        memoryUpdates: result?.memoryUpdates || undefined
      };
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error('Client Analysis Service Exception:', error);
      if (error.name === 'AbortError') {
        return {
          ...fallbackResponse,
          summary: "The reasoning protocol timed out. This statement might be complex. Try focusing on a smaller section."
        };
      }
      return fallbackResponse;
    }
  }
}
