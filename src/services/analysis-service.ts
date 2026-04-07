/**
 * @fileOverview AI Agent Service Wrapper.
 * Unifies all intelligence calls through the Engine V6 bridge.
 */

export interface AnalysisInput {
  imageDataUri?: string;
  documentText?: string;
  history?: Array<{role: 'user' | 'assistant', content: string}>;
  userMemory?: any;
  source?: string;
}

export interface AnalysisOutput {
  title: string;
  summary: string;
  strategy: string;
  mode: string;
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
  /**
   * Main entry point for all AI intelligence.
   * Routes requests through the static Agent Bridge (V6 powered).
   */
  static async analyze(input: AnalysisInput): Promise<AnalysisOutput> {
    const fallbackResponse: AnalysisOutput = {
      title: "Agent Standby",
      summary: "I've encountered a connection delay with the reasoning core. Please retry your instruction.",
      strategy: 'Verify API status.',
      mode: 'general',
      isActionable: false,
      detectedItems: [],
      savingsEstimate: 0,
    };

    try {
      // Use /api/analyze for static JSON response (V6 Bridge)
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentText: input.documentText || "Analyze visual source.",
          history: input.history || [],
          userMemory: input.userMemory || null,
          imageDataUri: input.imageDataUri
        }),
      });

      if (!response.ok) return fallbackResponse;

      const result = await response.json();
      
      return {
        title: result.title || "Audit Report",
        summary: result.summary,
        strategy: result.strategy || "Execution protocol generated.",
        mode: result.mode,
        isActionable: result.isActionable,
        detectedItems: result.detectedItems || [],
        savingsEstimate: result.savingsEstimate || 0,
        beforeAfterComparison: result.beforeAfterComparison || null,
        memoryUpdates: result.memoryUpdates || null
      };
    } catch (error: any) {
      console.error('Agent Service Error:', error);
      return fallbackResponse;
    }
  }
}
