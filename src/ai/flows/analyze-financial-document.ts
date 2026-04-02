
'use server';
/**
 * @fileOverview Universal "AI Life Operator" flow with memory and high-IQ reasoning.
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
  title: z.string().describe('A title for the conversation if this is the start.'),
  summary: z.string().describe('The primary conversational response.'),
  detectedItems: z.array(DetectedItemSchema).optional(),
  savingsEstimate: z.number().optional(),
  beforeAfterComparison: z.object({
    currentSituation: z.string(),
    optimizedSituation: z.string(),
  }).optional(),
  isActionable: z.boolean().describe('True if this triggered a financial audit with items.'),
  memoryUpdates: z.object({
    newGoals: z.array(z.string()).optional(),
    newPreferences: z.array(z.string()).optional(),
    newSubscriptions: z.array(z.string()).optional(),
    behaviorSummaryUpdate: z.string().optional(),
  }).optional().describe('Inferred updates for the user long-term memory.'),
});

export type AnalyzeFinancialDocumentOutput = z.infer<typeof AnalyzeFinancialDocumentOutputSchema>;

export async function analyzeFinancialDocument(input: z.infer<typeof AnalyzeFinancialDocumentInputSchema>): Promise<AnalyzeFinancialDocumentOutput> {
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    console.error('GROQ_API_KEY is missing.');
    return {
      title: "Operator Connection",
      summary: "I'm having a brief connection issue with my deep audit framework (API Key Missing).",
      isActionable: false,
      detectedItems: [],
      savingsEstimate: 0,
    };
  }

  const groq = new Groq({ apiKey });

  // Prepare chat history context
  const historyContext = input.history?.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n') || "No previous history.";
  
  // Prepare memory context
  const memoryContext = input.userMemory ? `
USER MEMORY PROTOCOL:
- Behavior Summary: ${input.userMemory.behaviorSummary || 'No behavior recorded yet.'}
- Active Goals: ${input.userMemory.goals?.join(', ') || 'None set.'}
- Known Subscriptions: ${input.userMemory.subscriptions?.join(', ') || 'None detected yet.'}
- Preferences: ${input.userMemory.preferences?.join(', ') || 'No explicit preferences.'}
  ` : "USER MEMORY: No memory protocol active for this session.";

  const prompt = `You are a "High-IQ Life Operator Assistant". You are refined, intelligent, proactive, and analytical.
Use step-by-step reasoning (Chain of Thought) before answering. Always provide actionable, professional, and deeply analyzed advice.

${memoryContext}

CONTEXT MEMORY (Current Thread):
${historyContext}

INTENT ROUTING:
1. If the input contains financial data, bank logs, statements, or a request to "save money":
   - Act as a "Predatory Subscription Hunter".
   - Cross-reference with USER MEMORY to identify changes, usage patterns, or repeated waste.
   - Find waste, hidden fees, and cheaper alternatives.
   - Set "isActionable" to true.
   - Populate "detectedItems", "savingsEstimate", and "beforeAfterComparison".
   - Generate a short, relevant "title" for the conversation.

2. If the input is a general question or behavioral input:
   - Act as a high-IQ financial advisor.
   - Use USER MEMORY to personalize the advice.
   - Provide a deep, step-by-step reasoning based response in "summary".
   - Set "isActionable" to false.
   - Infer potential "memoryUpdates" if the user mentions a new goal, preference, or service.

CURRENT INPUT:
${input.documentText || "Visual source detected."}

Return a JSON object matching this schema:
{
  "title": string,
  "summary": string,
  "isActionable": boolean,
  "detectedItems": [],
  "savingsEstimate": number,
  "beforeAfterComparison": { "currentSituation": string, "optimizedSituation": string },
  "memoryUpdates": { "newGoals": [], "newPreferences": [], "newSubscriptions": [], "behaviorSummaryUpdate": string }
}`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a High-IQ Life Operator Assistant. Always output valid JSON. Use step-by-step reasoning.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error('Empty response from Groq');

    const result = JSON.parse(content);
    return AnalyzeFinancialDocumentOutputSchema.parse({
      ...result,
      detectedItems: result.detectedItems || [],
      savingsEstimate: result.savingsEstimate || 0,
    });
  } catch (error) {
    console.error('Groq Analysis Error:', error);
    return {
      title: "Protocol Interruption",
      summary: "I encountered an interruption while processing your request. Please try again.",
      isActionable: false,
      detectedItems: [],
      savingsEstimate: 0,
    };
  }
}
