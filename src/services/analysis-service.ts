/**
 * @fileOverview AI Agent Service Wrapper.
 * Unifies all intelligence calls through the Agent v3 pipeline.
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
   * Routes requests through the Agent v3 Pipeline.
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
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: input.documentText || "Analyze visual source.",
          history: input.history || [],
          memory: input.userMemory || null,
          imageUri: input.imageDataUri
        }),
      });

      if (!response.ok) return fallbackResponse;

      const result = await response.json();
      
      // Map AgentResult back to the legacy AnalysisOutput format for UI compatibility
      return {
        title: result.data?.title || result.intent.toUpperCase() + " Audit",
        summary: result.content,
        strategy: result.data?.strategy || "Execution protocol generated.",
        mode: result.mode,
        isActionable: result.isActionable,
        detectedItems: result.data?.data?.detectedItems || result.data?.detectedItems || [],
        savingsEstimate: result.data?.data?.savingsEstimate || result.data?.savingsEstimate || 0,
        beforeAfterComparison: result.data?.beforeAfterComparison || null,
        memoryUpdates: result.data?.memoryUpdates || null
      };
    } catch (error: any) {
      console.error('Agent Service Error:', error);
      return fallbackResponse;
    }
  }
}
