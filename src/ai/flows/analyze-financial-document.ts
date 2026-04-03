'use server';
/**
 * @fileOverview High-IQ "AI Life Operator" reasoning engine.
 * Implements dynamic strategy selection, intent routing, and memory-aware behavior.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import Groq from 'groq-sdk';

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
  imageDataUri: z.string().optional(),
  documentText: z.string().optional(),
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

export async function analyzeFinancialDocument(input: z.infer<typeof AnalyzeFinancialDocumentInputSchema>): Promise<AnalyzeFinancialDocumentOutput> {
  const apiKey = process.env.GROQ_API_KEY;
  
  const fallback: AnalyzeFinancialDocumentOutput = {
    title: "Advisor Review",
    summary: "I've reviewed your latest request. To provide a truly tailored savings audit, could you provide a bit more context or a clear screenshot of the bill in question?",
    strategy: 'direct_answer',
    mode: 'advisor',
    isActionable: false,
    detectedItems: [],
    savingsEstimate: 0,
  };

  if (!apiKey) {
    return fallback;
  }

  const groq = new Groq({ apiKey });

  const historyContext = input.history?.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n') || "No previous history.";
  
  const memoryContext = input.userMemory ? `
USER MEMORY PROTOCOL:
- Behavior Summary: ${input.userMemory.behaviorSummary || 'Passive gathering active.'}
- Goals: ${input.userMemory.goals?.join(', ') || 'None set.'}
- Subscriptions: ${input.userMemory.subscriptions?.join(', ') || 'None detected.'}
- Preferences: ${input.userMemory.preferences?.join(', ') || 'No explicit preferences.'}
- Ignored/Rejected: ${input.userMemory.ignoredSuggestions?.join(', ') || 'None.'}
  ` : "USER MEMORY: Not initialized.";

  const systemPrompt = `You are a "High-IQ Life Operator Assistant". You are refined, intelligent, proactive, and analytical.
Your primary directive is to save the user time and money through strategic oversight.

OPERATIONAL GUIDELINES:
1. CHAIN OF THOUGHT: Analyze the user's intent, conversation history, and user memory before selecting a strategy.
2. ADAPTIVE STRATEGY: Do not use the same tone or format every time. Choose the best 'strategy' and 'mode' for the context.
3. MEMORY AWARENESS: Respect past decisions. If a user ignored a suggestion, do not suggest it again unless the context has changed.
4. FRESH DIALOGUE: Avoid repetitive phrases. Be conversational, concise, and professional.
5. INTENT ROUTING: 
   - Financial Audit (statements/receipts) -> 'analyst' mode, 'guided_analysis' strategy.
   - High Waste Found -> 'alert' mode, 'proactive_alert' strategy.
   - General Planning -> 'planner' mode, 'checklist' strategy.
   - Quick Question -> 'advisor' mode, 'direct_answer' strategy.

MEMORY CONTEXT:
${memoryContext}

THREAD HISTORY:
${historyContext}

CURRENT INPUT:
${input.documentText || "Visual source provided."}

OUTPUT SCHEMA REQUIREMENT:
You MUST return a JSON object exactly matching the schema. Select the most strategic 'mode' and 'strategy'.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a High-IQ Life Operator Assistant. Always output valid JSON.' },
        { role: 'user', content: systemPrompt },
      ],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error('Empty response');

    let result;
    try {
      result = JSON.parse(content);
    } catch (e) {
      console.warn("LLM JSON Parse failed, attempting fallback parsing.");
      return fallback;
    }

    return AnalyzeFinancialDocumentOutputSchema.parse({
      ...result,
      detectedItems: Array.isArray(result.detectedItems) ? result.detectedItems : [],
      savingsEstimate: typeof result.savingsEstimate === 'number' ? result.savingsEstimate : 0,
      isActionable: !!result.isActionable,
    });
  } catch (error) {
    console.error('Groq Analysis Error:', error);
    return fallback;
  }
}
