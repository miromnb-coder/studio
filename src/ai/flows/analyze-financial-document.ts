'use server';
/**
 * @fileOverview High-IQ "AI Life Operator" reasoning engine.
 * Implements dynamic strategy selection, intent routing, and memory-aware behavior.
 * Standardized to use Genkit 1.x for reliable AI orchestration.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DetectedItemSchema = z.object({
  title: z.string().describe('The name of the service or category.'),
  summary: z.string().describe('Why this is an optimization opportunity.'),
  type: z.enum([
    'subscription',
    'recurring_charge',
    'hidden_fee',
    'trial_ending',
    'price_increase',
    'unusual_spending',
    'savings_opportunity',
    'duplicate_charge'
  ]),
  estimatedSavings: z.number().describe('Monthly USD savings.'),
  alternativeSuggestion: z.string().optional(),
  alternativeLink: z.string().optional(),
  urgencyLevel: z.enum(['low', 'medium', 'high', 'urgent']),
  copyableMessage: z.string().describe('Professional script for negotiation or cancellation.'),
  actionLabel: z.string().describe('Button label for the action.'),
});

const UserMemorySchema = z.object({
  behaviorSummary: z.string().optional(),
  goals: z.array(z.string()).optional(),
  preferences: z.array(z.string()).optional(),
  subscriptions: z.array(z.string()).optional(),
  ignoredSuggestions: z.array(z.string()).optional(),
}).optional();

const AnalyzeFinancialDocumentInputSchema = z.object({
  imageDataUri: z.string().optional().describe("A photo of a document as a data URI."),
  documentText: z.string().optional().describe("The text content of the document."),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional(),
  userMemory: UserMemorySchema,
});

const AnalyzeFinancialDocumentOutputSchema = z.object({
  title: z.string().describe('A refined title for the session.'),
  summary: z.string().describe('The core conversational response, adapted to the selected strategy.'),
  strategy: z.enum([
    'direct_answer',
    'guided_analysis',
    'proactive_alert',
    'concise_summary',
    'follow_up',
    'action_recommendation',
    'clarification',
    'checklist'
  ]).describe('The chosen response strategy for this specific interaction.'),
  mode: z.enum(['alert', 'advisor', 'analyst', 'planner', 'executor', 'reminder']).describe('The active operational mode.'),
  detectedItems: z.array(DetectedItemSchema).optional(),
  savingsEstimate: z.number().optional(),
  beforeAfterComparison: z.object({
    currentSituation: z.string(),
    optimizedSituation: z.string(),
  }).optional(),
  followUpQuestion: z.string().optional().describe('A single high-value question if further data is needed.'),
  isActionable: z.boolean().describe('True if this triggered a structured financial audit.'),
  memoryUpdates: z.object({
    newGoals: z.array(z.string()).optional(),
    newPreferences: z.array(z.string()).optional(),
    newSubscriptions: z.array(z.string()).optional(),
    newIgnoredSuggestions: z.array(z.string()).optional(),
    behaviorSummaryUpdate: z.string().optional(),
  }).optional(),
});

export type AnalyzeFinancialDocumentOutput = z.infer<typeof AnalyzeFinancialDocumentOutputSchema>;
export type AnalyzeFinancialDocumentInput = z.infer<typeof AnalyzeFinancialDocumentInputSchema>;

/**
 * Prompt definition using Handlebars templating.
 */
const analyzePrompt = ai.definePrompt({
  name: 'analyzeFinancialDocumentPrompt',
  input: { schema: AnalyzeFinancialDocumentInputSchema },
  output: { schema: AnalyzeFinancialDocumentOutputSchema },
  prompt: `You are a "High-IQ Life Operator Assistant". You are refined, intelligent, proactive, and analytical.
Your primary directive is to save the user time and money through strategic oversight.

OPERATIONAL GUIDELINES:
1. CHAIN OF THOUGHT: Analyze the user's intent, conversation history, and user memory before selecting a strategy.
2. ADAPTIVE STRATEGY: Do not use the same tone or format every time. Choose the best 'strategy' and 'mode' for the context.
3. MEMORY AWARENESS: Respect past decisions.
4. FRESH DIALOGUE: Avoid repetitive phrases. Be conversational, concise, and professional.

USER MEMORY PROTOCOL:
- Behavior Summary: {{{userMemory.behaviorSummary}}}
- Goals: {{#each userMemory.goals}}{{{this}}}, {{/each}}
- Subscriptions: {{#each userMemory.subscriptions}}{{{this}}}, {{/each}}

THREAD HISTORY:
{{#each history}}
- {{{role}}}: {{{content}}}
{{/each}}

LATEST USER INPUT:
{{{documentText}}}

{{#if imageDataUri}}
VISUAL SOURCE PROVIDED:
{{media url=imageDataUri}}
{{/if}}

OUTPUT REQUIREMENT:
Analyze the input and return a JSON object. Select the most strategic 'mode' and 'strategy'.`,
});

/**
 * The main Genkit Flow for financial document analysis.
 */
const analyzeFinancialDocumentFlow = ai.defineFlow(
  {
    name: 'analyzeFinancialDocumentFlow',
    inputSchema: AnalyzeFinancialDocumentInputSchema,
    outputSchema: AnalyzeFinancialDocumentOutputSchema,
  },
  async (input) => {
    const { output } = await analyzePrompt(input);
    
    if (!output) {
      return {
        title: "Intelligence Briefing",
        summary: "I've reviewed the information. To give you a more detailed audit, could you share a bit more detail or a clearer source?",
        strategy: 'direct_answer',
        mode: 'advisor',
        isActionable: false,
        detectedItems: [],
        savingsEstimate: 0
      };
    }

    return output;
  }
);

/**
 * Wrapper function for the flow to be called by API routes or client components.
 */
export async function analyzeFinancialDocument(input: AnalyzeFinancialDocumentInput): Promise<AnalyzeFinancialDocumentOutput> {
  return analyzeFinancialDocumentFlow(input);
}
