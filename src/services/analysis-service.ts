
/**
 * @fileOverview Client-side service wrapper for the AI Analysis API.
 * Hardened to handle timeouts and network errors gracefully.
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
  strategy: string;
  mode: 'alert' | 'advisor' | 'analyst' | 'planner' | 'executor' | 'reminder' | 'time_optimizer' | 'monetization' | 'technical' | 'general';
  detectedItems?: any[];
  savingsEstimate?: number;
  beforeAfterComparison?: {
    currentSituation: string;
    optimizedSituation: string;
  };
  isActionable: boolean;
  memoryUpdates?: any;
}

export class AnalysisService {
  static async analyze(input: AnalysisInput): Promise<AnalysisOutput> {
    const fallbackResponse: AnalysisOutput = {
      title: "Advisor Update",
      summary: "I've encountered a connection delay. Please ensure your intelligence source is clear and try again.",
      strategy: 'direct_answer',
      mode: 'general',
      isActionable: false,
      detectedItems: [],
      savingsEstimate: 0,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000); // 55s client-side limit for complex planning

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          imageDataUri: input?.imageDataUri,
          documentText: input?.documentText || "Manual audit request.",
          history: input?.history || [],
          userMemory: input?.userMemory || null
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`Analysis API responded with status: ${response.status}`);
        return fallbackResponse;
      }

      const result = await response.json();
      return result;
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error('Analysis Service Error:', error);
      return fallbackResponse;
    }
  }
}
