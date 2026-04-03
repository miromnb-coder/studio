/**
 * @fileOverview Analysis service wrapper.
 * Uses the legacy JSON contract at /api/analyze for structured responses.
 */

export interface AnalysisInput {
  imageDataUri?: string;
  documentText?: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  userMemory?: any;
  source?: string;
}

export interface DetectedItem {
  title: string;
  [key: string]: unknown;
}

export interface AnalysisOutput {
  title: string;
  summary: string;
  strategy: string;
  detectedItems: DetectedItem[];
  savingsEstimate: number;
  beforeAfterComparison?: {
    currentSituation: string;
    optimizedSituation: string;
  } | null;
  memoryUpdates?: any;
}

export class AnalysisService {
  static async analyze(input: AnalysisInput): Promise<AnalysisOutput> {
    const fallbackResponse: AnalysisOutput = {
      title: 'Agent Standby',
      summary: "I've encountered a connection delay with the reasoning core. Please retry your instruction.",
      strategy: 'Verify API status.',
      detectedItems: [],
      savingsEstimate: 0,
      beforeAfterComparison: null,
      memoryUpdates: null,
    };

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentText: input.documentText || 'Analyze visual source.',
          history: input.history || [],
          userMemory: input.userMemory || null,
          imageDataUri: input.imageDataUri,
        }),
      });

      if (!response.ok) return fallbackResponse;

      const result = await response.json();
      const detectedItems = Array.isArray(result.detectedItems)
        ? result.detectedItems.filter((item: unknown): item is DetectedItem => {
            return Boolean(item && typeof item === 'object' && typeof (item as { title?: unknown }).title === 'string');
          })
        : [];

      return {
        title: typeof result.title === 'string' ? result.title : fallbackResponse.title,
        summary: typeof result.summary === 'string' ? result.summary : fallbackResponse.summary,
        strategy: typeof result.strategy === 'string' ? result.strategy : fallbackResponse.strategy,
        detectedItems,
        savingsEstimate: typeof result.savingsEstimate === 'number' ? result.savingsEstimate : 0,
        beforeAfterComparison:
          result.beforeAfterComparison && typeof result.beforeAfterComparison === 'object'
            ? result.beforeAfterComparison
            : null,
        memoryUpdates: result.memoryUpdates ?? null,
      };
    } catch (error: any) {
      console.error('Analysis Service Error:', error);
      return fallbackResponse;
    }
  }
}
