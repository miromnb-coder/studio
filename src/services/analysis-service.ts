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
      summary: "I'm having a brief connection issue. Please check your network.",
      strategy: 'direct_answer',
      mode: 'advisor',
      isActionable: false,
      detectedItems: [],
      savingsEstimate: 0,
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
    } catch (error) {
      console.error('Client Analysis Service Exception:', error);
      return fallbackResponse;
    }
  }
}
